import Link from 'next/link';
import { prisma } from '../lib/db';
import { formatDate, jstDate } from '../lib/date';
export const dynamic = 'force-dynamic';
export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; country?: string }> }) {
  const params = await searchParams;
  const q = (params.q || '').slice(0, 100);
  const country = (params.country || '').slice(0, 60);
  const where = { published: true, ...(country ? { country: { contains: country, mode: 'insensitive' as const } } : {}),
    ...(q ? { OR: ['title','borrower','sector','transactionType'].map(k => ({ [k]: { contains: q, mode: 'insensitive' as const } })) } : {}) };
  const [deals, total, featured] = await Promise.all([
    prisma.deal.findMany({ where, orderBy: { announcedAt: 'desc' }, take: 60 }),
    prisma.deal.count({ where: { published: true } }),
    prisma.deal.findMany({ where: { published: true, featuredDate: jstDate() }, orderBy: { announcedAt: 'desc' }, take: 3 })
  ]);
  const highlights = featured.length ? featured : deals.slice(0, 3);
  const countries = new Set(deals.map(d => d.country)).size;
  return <main>
    <section className="hero"><div className="shell"><div className="eyebrow"><span className="line"/> APAC CORPORATE BANKING / DAILY INTELLIGENCE</div><h1>Capital moves.<br/><em>We connect the dots.</em></h1><p className="heroSub">A curated view of the financing transactions shaping Asia-Pacific — from syndicated loans and acquisition finance to infrastructure, funds and insurance.</p><div className="heroMeta"><span>● &nbsp;DAILY DEAL MONITOR</span><span>UPDATED IN JAPAN TIME · {jstDate()}</span></div></div></section>
    <section className="shell mainContent"><div className="stats"><div><div className="statNum">{total.toLocaleString()}</div><div className="statLabel">TRANSACTIONS TRACKED</div></div><div><div className="statNum">{countries}</div><div className="statLabel">MARKETS IN CURRENT VIEW</div></div><div><div className="statNum">03</div><div className="statLabel">DAILY FEATURED DEALS</div></div><div className="statLast"><span className="pulse"/> LIVE RESEARCH DATABASE<br/><small>Sources linked on every deal</small></div></div>
    <div className="sectionHeading"><div><div className="eyebrow dark">THE DAILY BRIEF / {jstDate()}</div><h2>Deals in focus<span className="accent">.</span></h2></div><p>Three transactions worth understanding today.</p></div>
    {highlights.length ? <div className="featureGrid">{highlights.map((deal, i) => <Link href={`/deals/${deal.id}`} className="featureCard" key={deal.id}><div className="cardTop"><span>0{i+1} / FEATURED</span><span className="arrow">↗</span></div><div className="dealType">{deal.transactionType.toUpperCase()}</div><h3>{deal.borrower}</h3><div className="amount">{deal.amount || 'Undisclosed'}</div><p>{deal.summary}</p><div className="cardBottom"><span>{deal.country}</span><span>{formatDate(deal.announcedAt)}</span></div></Link>)}</div> : <div className="empty">No verified deals published yet. Run the ingestion workflow, review sources, and publish your first transactions.</div>}
    <section id="database" className="database"><div className="sectionHeading"><div><div className="eyebrow dark">RESEARCH ARCHIVE</div><h2>Transaction database<span className="accent">.</span></h2></div><p>Search by borrower, industry or financing type.</p></div><form className="filters" action="/" method="get"><input name="q" aria-label="Search deals" defaultValue={q} placeholder="Search transactions, borrowers, sectors..."/><input name="country" aria-label="Country filter" defaultValue={country} placeholder="Country (optional)"/><button type="submit">Search ↗</button></form><div className="tableWrap"><table><thead><tr><th>TRANSACTION / BORROWER</th><th>MARKET</th><th>FINANCING TYPE</th><th>VALUE</th><th>ANNOUNCED</th><th/></tr></thead><tbody>{deals.map(d => <tr key={d.id}><td><Link href={`/deals/${d.id}`} className="tableName">{d.borrower}</Link><div className="muted">{d.sector}</div></td><td>{d.country}</td><td>{d.transactionType}</td><td className="tableAmount">{d.amount || '—'}</td><td>{formatDate(d.announcedAt)}</td><td><Link href={`/deals/${d.id}`} aria-label={`View ${d.borrower}`}>↗</Link></td></tr>)}</tbody></table>{!deals.length && <div className="empty">No transactions match this search.</div>}</div><div className="tableFoot">SHOWING {deals.length} RESULTS · PUBLICLY SOURCED DEAL INTELLIGENCE</div></section>
    </section></main>;
}
