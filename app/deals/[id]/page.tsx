import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/db';
import { formatDate } from '../../../lib/date';
export const dynamic = 'force-dynamic';
export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.deal.findFirst({ where: { id, published: true } });
  if (!d) notFound();
  return <main className="shell detail"><Link href="/" className="back">← BACK TO DEAL INTELLIGENCE</Link><div className="eyebrow dark">{d.country.toUpperCase()} / {d.transactionType.toUpperCase()}</div><h1>{d.title}</h1><div className="detailMeta"><span>{formatDate(d.announcedAt)}</span><span>STATUS: {d.status}</span><span>{d.sector}</span></div><div className="detailGrid"><article><h2>Transaction overview</h2><p>{d.summary}</p><h2>Transaction rationale</h2><p>{d.rationale}</p><h2>Corporate banking perspective</h2><p>{d.bankingInsight}</p><div className="sourceBox"><strong>Source</strong><a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">{d.sourceName} ↗</a><small>Always check the original report before relying on transaction terms.</small></div></article><aside className="dealFacts"><div className="eyebrow dark">DEAL SNAPSHOT</div><div><small>BORROWER</small><strong>{d.borrower}</strong></div><div><small>TRANSACTION VALUE</small><strong>{d.amount || 'Not disclosed'}</strong></div><div><small>MARKET</small><strong>{d.country}</strong></div><div><small>FINANCING STRUCTURE</small><strong>{d.transactionType}</strong></div><div><small>REPORTED BANKS</small><strong>{d.banks.length ? d.banks.join(', ') : 'Not disclosed'}</strong></div></aside></div></main>;
}
