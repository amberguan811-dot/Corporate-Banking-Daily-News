import Parser from 'rss-parser';
import OpenAI from 'openai';
import { z } from 'zod';
import { prisma } from './db';
import { jstDate } from './date';

const parser = new Parser({ timeout: 12000 });
const searches = [
  'APAC syndicated loan financing bank deal',
  'Asia Pacific acquisition financing banks corporate',
  'Asia fund finance insurance financing facility banks',
  'Japan Singapore Hong Kong Australia infrastructure project finance bank'
];
const DealExtraction = z.object({
  isRelevant: z.boolean(),
  title: z.string(), borrower: z.string(), country: z.string(), sector: z.string(),
  transactionType: z.string(), amount: z.string().nullable(), banks: z.array(z.string()),
  announcedAt: z.string(), summary: z.string(), rationale: z.string(), bankingInsight: z.string(),
  status: z.enum(['PROPOSED','ANNOUNCED','SIGNED','CLOSED','UNKNOWN']),
  sourceName: z.string()
});

function googleNewsRss(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' when:7d')}&hl=en-US&gl=US&ceid=US:en`;
}
function cleanLink(url: string) { return url.split('#')[0]; }

export async function ingestDeals() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing');
  const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const entries = (await Promise.allSettled(searches.map(q => parser.parseURL(googleNewsRss(q)))))
    .flatMap(r => r.status === 'fulfilled' ? r.value.items : []);
  const unique = [...new Map(entries.filter(e => e.link && e.title).map(e => [cleanLink(e.link!), e])).values()].slice(0, 36);
  let saved = 0;
  let skipped = 0;
  for (const entry of unique) {
    const sourceUrl = cleanLink(entry.link!);
    if (await prisma.deal.findUnique({ where: { sourceUrl }, select: { id: true } })) { skipped++; continue; }
    try {
      const result = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `Extract ONLY verifiable information from the supplied RSS title and snippet. Never invent deal size, banks, date, parties, structure, or outcome. If the article does not clearly establish a specific corporate banking transaction in APAC, set isRelevant=false. Distinguish PROPOSED from SIGNED/CLOSED. Dates must be YYYY-MM-DD. Return JSON keys: isRelevant,title,borrower,country,sector,transactionType,amount,banks,announcedAt,summary,rationale,bankingInsight,status,sourceName. If rationale or insight is an inference, say "Potential implication:". No hallucinations.` },
          { role: 'user', content: JSON.stringify({ title: entry.title, snippet: entry.contentSnippet || entry.content || '', publicationDate: entry.isoDate || entry.pubDate, link: sourceUrl }) }
        ]
      });
      const data = DealExtraction.parse(JSON.parse(result.choices[0]?.message?.content || '{}'));
      if (!data.isRelevant || !/^\d{4}-\d{2}-\d{2}$/.test(data.announcedAt)) { skipped++; continue; }
      const announcedAt = new Date(`${data.announcedAt}T00:00:00Z`);
      if (Number.isNaN(announcedAt.valueOf())) { skipped++; continue; }
      const { isRelevant: _isRelevant, announcedAt: _announcedAt, ...dealFields } = data;
      await prisma.deal.create({ data: { ...dealFields, amount: data.amount || null, announcedAt, sourceUrl,
        // Human review is the default. Opt in to automatic publishing only if desired.
        published: process.env.AUTO_PUBLISH === 'true'
      } });
      saved++;
    } catch (err) {
      console.error('Could not process feed item', sourceUrl, err);
      skipped++;
    }
  }
  let featured = 0;
  if (process.env.AUTO_PUBLISH === 'true') {
    const date = jstDate();
    const top = await prisma.deal.findMany({ where: { published: true }, orderBy: { announcedAt: 'desc' }, take: 3 });
    for (const deal of top) {
      await prisma.deal.update({ where: { id: deal.id }, data: { featuredDate: date } });
      featured++;
    }
  }
  return { scanned: unique.length, saved, skipped, featured, autoPublish: process.env.AUTO_PUBLISH === 'true' };
}
