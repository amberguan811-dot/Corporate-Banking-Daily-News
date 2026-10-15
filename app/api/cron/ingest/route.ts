import { NextRequest, NextResponse } from 'next/server';
import { ingestDeals } from '../../../../lib/ingest';
export const maxDuration = 300;
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try { return NextResponse.json({ ok: true, ...(await ingestDeals()) }); }
  catch (e) { console.error(e); return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 }); }
}
