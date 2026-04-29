# xCron — Scheduled Job Platform

A complete, production-ready scheduled job platform built with Next.js 16, Supabase, and Tailwind CSS. Let users schedule HTTP requests and custom scripts to run automatically — no servers to manage.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdevwaheed%2Fxcron-app&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,GITHUB_REPO_OWNER,GITHUB_REPO_NAME,GITHUB_PAT,CRONJOB_API_KEY,CRON_SECRET,NEXT_PUBLIC_APP_URL&project-name=xcron&repository-name=xcron)

## What's Included

- **No-code HTTP scheduling** — users paste a URL, pick a time, done
- **Custom script editor** — inline JavaScript with syntax highlighting
- **Multi-tenant** — isolated user accounts with row-level security
- **3 pricing tiers** — Starter/Pro/Business with enforced limits
- **Admin panel** — system health, user stats, plan distribution
- **Email notifications** — welcome, password reset, failure alerts
- **367 automated tests** — unit, integration, and property-based
- **Pluggable execution engine** — swap GitHub Actions for Lambda/Docker via env var

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Database | Supabase (Postgres + Auth + RLS) |
| Execution | GitHub Actions (pluggable) |
| Scheduling | cron-job.org |
| Email | Resend (optional) |
| Monitoring | Sentry (optional) |
| Editor | CodeMirror 6 |

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd xcron
npm install
```

### 2. Set Up Supabase

1. Create a [Supabase](https://supabase.com) project
2. Run migrations in order via the SQL editor:

```
supabase/migrations/001_create_actions_table.sql
supabase/migrations/002_add_cron_job_id.sql
supabase/migrations/003_multi_tenant.sql
supabase/migrations/004_usage_tiers.sql
supabase/migrations/005_action_features.sql
supabase/migrations/006_monthly_pricing.sql
```

### 3. Set Up GitHub Repository

Create a private repo (e.g., `xcron-scripts`) for storing user scripts. Generate a Personal Access Token with `repo` + `workflow` scopes.

### 4. Configure Environment

```bash
cp .env.example .env.local
# Fill in all required values
```

### 5. Run

```bash
npm run dev        # Development (http://localhost:3000)
npm run build      # Production build
npm start          # Production server
```

### 6. Deploy

Click the "Deploy with Vercel" button above, or:

```bash
npx vercel
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_URL` | ✅ | Supabase URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `GITHUB_REPO_OWNER` | ✅ | GitHub username/org |
| `GITHUB_REPO_NAME` | ✅ | Repository for scripts |
| `GITHUB_PAT` | ✅ | GitHub Personal Access Token |
| `CRONJOB_API_KEY` | ✅ | cron-job.org API key |
| `CRON_SECRET` | ✅ | Secret for cron callbacks |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app's public URL |
| `RESEND_API_KEY` | | Resend key for emails |
| `EMAIL_FROM` | | Sender address |
| `ADMIN_EMAILS` | | Comma-separated admin emails |
| `GITHUB_APP_ID` | | GitHub App ID (alternative to PAT) |
| `GITHUB_APP_PRIVATE_KEY` | | GitHub App private key |
| `GITHUB_APP_INSTALLATION_ID` | | GitHub App installation ID |
| `EXECUTION_ENGINE` | | `github` (default), `lambda`, `modal`, `docker` |
| `NEXT_PUBLIC_SENTRY_DSN` | | Sentry DSN for error monitoring |

## Project Structure

```
src/
├── app/
│   ├── api/            # API routes
│   │   ├── actions/    # CRUD, trigger, toggle, duplicate, runs
│   │   ├── admin/      # Admin stats + auth check
│   │   ├── auth/       # Login, logout, refresh, reset password
│   │   ├── checkout/   # Stripe (stub)
│   │   ├── cron/       # Cleanup + failure alerts
│   │   ├── profile/    # User profile
│   │   ├── redeem/     # Promo codes
│   │   ├── usage/      # Usage stats
│   │   └── webhooks/   # Stripe webhooks
│   ├── admin/          # Admin panel
│   ├── dashboard/      # Jobs, account, billing, templates, history
│   ├── docs/           # Help center
│   ├── login/          # Auth page
│   ├── pricing/        # Pricing page
│   ├── privacy/        # Privacy policy
│   ├── terms/          # Terms of service
│   └── page.tsx        # Landing page
├── components/         # 25+ React components
├── lib/
│   ├── engines/        # Execution engine implementations
│   ├── __tests__/      # Unit tests
│   ├── engine-factory.ts
│   ├── execution-engine.ts
│   ├── email.ts
│   ├── rate-limit.ts
│   ├── script-sanitizer.ts
│   └── ...
└── types/
supabase/
└── migrations/         # 6 migration files
tests/                  # 367 tests across 47 files
```

## Features at a Glance

| Feature | Details |
|---------|---------|
| Job types | HTTP Request (no-code) + Custom Script |
| Scheduling | Any day/time/timezone combination |
| Retries | 0–3 with configurable delay |
| Timeout | 1–30 minutes per job |
| Env vars | Up to 20 per job, masked in UI |
| History | Sparkline charts, success rate, run logs |
| Templates | 10 pre-built across 5 categories |
| Auth | Email/password, session refresh, password reset |
| Plans | 3 tiers with enforced limits |
| Admin | Health checks, user stats, plan breakdown |
| Email | Welcome, reset, failure alerts (Resend) |
| Security | RLS, rate limiting, script validation |
| Tests | 367 (unit + integration + property-based) |

## Customization

**Change branding:** Edit `src/components/Logo.tsx` and `src/app/globals.css`

**Add execution engine:** Implement `ExecutionEngine` interface in `src/lib/engines/`, register in `src/lib/engine-factory.ts`

**Modify plans:** Update `supabase/migrations/004_usage_tiers.sql` and the PLANS arrays in `src/app/page.tsx` and `src/app/pricing/page.tsx`

**Add Stripe payments:** Fill in `STRIPE_*` env vars, the checkout and webhook routes are already stubbed

## License

MIT — use it however you want. Resell, modify, deploy, white-label.
