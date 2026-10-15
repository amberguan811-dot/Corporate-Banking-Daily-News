import { prisma } from '../lib/db';
async function main() {
  // No invented or unverified live deals are preloaded.
  console.log('Database ready. Import articles using the protected ingestion endpoint.');
}
main().finally(() => prisma.$disconnect());
