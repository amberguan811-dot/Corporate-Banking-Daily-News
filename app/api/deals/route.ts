import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').slice(0, 100);
  const country = (req.nextUrl.searchParams.get('country') || '').slice(0, 60);
  const deals = await prisma.deal.findMany({
    where: { published: true, ...(country ? { country: { contains: country, mode: 'insensitive' } } : {}),
      ...(q ? { OR: ['title','borrower','sector','transactionType'].map(k => ({ [k]: { contains: q, mode: 'insensitive' } })) } : {}) },
    orderBy: { announcedAt: 'desc' }, take: 100
  });
  return NextResponse.json({ deals });
}
