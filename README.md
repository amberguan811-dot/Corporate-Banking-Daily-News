# APAC Deal Intelligence

A public, mobile-friendly **Next.js + PostgreSQL + Prisma** deal intelligence site with an RSS/AI ingestion pipeline, searchable deal archive, transaction pages, source attribution, and a scheduled GitHub Actions job.

## Architecture

- **Frontend:** Next.js App Router (server-rendered)
- **Database:** Managed PostgreSQL (Neon recommended), Prisma ORM
- **Discovery:** Google News RSS searches (availability and link formats may change)
- **Extraction:** OpenAI API, structured JSON with Zod validation
- **Scheduling:** GitHub Actions, 23:00 UTC = 08:00 JST next day
- **Hosting:** Vercel or another Next.js-compatible Node.js host

## Deploy (Vercel + Neon)

1. Create a Neon PostgreSQL database. Copy its pooled connection string to `DATABASE_URL` (with SSL enabled).
2. Create a GitHub repository and upload the project files.
3. In Vercel, **Add New → Project → Import Git Repository**. Select the repository and deploy.
4. Add Vercel project environment variables: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` (optional), `CRON_SECRET` (a strong random string), `AUTO_PUBLISH` (see below).
5. On your computer: `npm install`, `cp .env.example .env`, fill in values, and run `npx prisma db push` to create tables in Neon. (Or run `DATABASE_URL=... npx prisma db push` from a secure terminal.)
6. Redeploy the Vercel project after adding environment variables.
7. In GitHub repository **Settings → Secrets and variables → Actions**, add `SITE_URL` (e.g. `https://your-project.vercel.app`, without trailing slash) and `CRON_SECRET` (must exactly match Vercel).
8. Open **Actions → Daily APAC deal ingestion → Run workflow** to test. Scheduled workflow runs every day at **08:00 JST**. GitHub Actions schedules can be delayed, so this is an approximate publication time rather than a guaranteed 08:00 delivery.
9. Visit your public site. For a custom domain, configure it in Vercel and your DNS provider.

## Local development

```bash
npm install
cp .env.example .env
# edit .env with your own Neon DB and API key
npx prisma db push
npm run dev
```

Open http://localhost:3000.

## Publishing and editorial safety

**Important:** The site is empty on first deploy. This is intentional: no made-up financial transactions are shipped.

- By default `AUTO_PUBLISH=false`. The daily job **ingests draft records only**, and the public website will remain empty until records are reviewed and published. Use `npx prisma studio` locally to inspect and edit records. Set `published=true` on vetted records and set `featuredDate` to a Japan-local `YYYY-MM-DD` to place a deal in the daily top 3.
- If you want fully unattended daily publication, set `AUTO_PUBLISH=true` in Vercel. The pipeline will automatically publish AI-extracted RSS summaries and feature the three newest published deals. **This mode is not fact-checked** and should not be represented as verified research. RSS snippets may be incomplete; deal values, parties, and terms must be independently checked.
- Source URLs may point to Google News redirects rather than original publishers. The site displays these as linked sources, but primary-source confirmation is strongly recommended.
- The job is designed to avoid claiming that a proposed deal has closed. It stores `PROPOSED`, `ANNOUNCED`, `SIGNED`, `CLOSED`, or `UNKNOWN` separately.
- A daily cron job does not guarantee three newly announced deals; the automatic feature selection uses the three most recent records, including older deals when needed.
- Some publishers prohibit automated republication. Use original summaries and respect publisher terms and licensing.

## API

- `GET /api/deals?q=bank&country=Japan` — public, published records (up to 100)
- `GET /api/cron/ingest` — requires header `Authorization: Bearer <CRON_SECRET>`

## Production improvements

- Add a private editor interface with authentication, rather than relying on Prisma Studio.
- Add article-level deduplication across syndications and Google News redirects.
- Retrieve and cross-check original articles or issuer/stock exchange releases, respecting licensing, before publishing.
- Score materiality and diversify top-3 selections by geography and financing type.
- Add retries/queueing to handle platform function timeouts (a 36-item sequential AI job may exceed short serverless limits). For reliable scale, run ingestion in a dedicated worker or scheduled container.
- Add audit history, correction notices, RSS health alerts, rate limits and monitoring.

## Cost considerations

Hosting, managed PostgreSQL, OpenAI API usage, and domain registration may incur costs. Check current provider pricing. This code is a starter implementation, not a hosted live service.
