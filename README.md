# xCron

Scheduled job platform built with Next.js, Supabase, and GitHub Actions. Create JavaScript scripts, set a schedule, and let them run automatically.

## Features

- **Scheduled Jobs** — Pick days, time, and timezone. Scripts run automatically via GitHub Actions.
- **Dual Scheduling** — GitHub Actions cron + cron-job.org for redundancy.
- **Run History** — Full execution logs with success/failure tracking.
- **Usage Tiers** — Starter, Pro, and Business plans with configurable limits.
- **Multi-Tenant** — Row-level security, user-scoped data, isolated GitHub paths.
- **Admin Panel** — System health, user management, plan distribution.
- **Email Notifications** — Welcome emails, password reset, job failure alerts (via Resend).
- **Script Sanitization** — Defense-in-depth validation before scripts reach GitHub.
- **Rate Limiting** — Auth and API endpoints protected against abuse.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API routes, Supabase (Postgres + Auth + RLS)
- **Execution**: GitHub Actions (workflow dispatch)
- **Scheduling**: cron-job.org API
- **Email**: Resend (optional)
- **Payments**: Stripe (optional, promo codes work without it)

## Self-Hosting Guide

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A GitHub repository (for storing user scripts/workflows)
- A GitHub Personal Access Token with `repo` and `workflow` scopes
- (Optional) [cron-job.org](https://cron-job.org) account for reliable scheduling
- (Optional) [Resend](https://resend.com) account for transactional emails

### 1. Clone & Install

```bash
git clone https://github.com/devwaheed/xcron-app.git
cd xcron-app
npm install
```

### 2. Set Up Supabase

Create a new Supabase project, then run the migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor — run these files in order:
# supabase/migrations/001_create_actions_table.sql
# supabase/migrations/002_add_cron_job_id.sql
# supabase/migrations/003_multi_tenant.sql
# supabase/migrations/004_usage_tiers.sql
```

### 3. Create GitHub Repository

Create a repository (e.g., `xcron`) where user scripts and workflows will be stored. Generate a Personal Access Token with `repo` and `workflow` permissions.

### 4. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 5. Run

```bash
npm run dev        # Development
npm run build      # Production build
npm start          # Production server
```

### 6. Deploy

Deploy to Vercel (recommended), Railway, or any Node.js host:

```bash
# Vercel
npx vercel

# Or build and run anywhere
npm run build && npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_URL` | Yes | Supabase project URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `GITHUB_REPO_OWNER` | Yes | GitHub username/org |
| `GITHUB_REPO_NAME` | Yes | Repository name for scripts |
| `GITHUB_PAT` | Yes | GitHub Personal Access Token |
| `CRONJOB_API_KEY` | Yes | cron-job.org API key |
| `CRON_SECRET` | Yes | Secret for authenticating cron callbacks |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app's public URL |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `EMAIL_FROM` | No | Sender address (default: `xCron <noreply@xcron.dev>`) |
| `ADMIN_EMAILS` | No | Comma-separated admin emails for /admin access |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (actions, auth, usage, admin, webhooks)
│   ├── dashboard/    # Dashboard pages (jobs, account, billing, history)
│   ├── admin/        # Admin panel
│   ├── docs/         # Documentation page
│   ├── login/        # Auth pages
│   ├── pricing/      # Pricing page
│   └── page.tsx      # Landing page
├── components/       # React components
├── lib/              # Utilities (email, rate-limit, sanitizer, etc.)
└── types/            # TypeScript types
supabase/
└── migrations/       # Database migrations (run in order)
```

## Admin Panel

Access `/admin` with an account whose email is listed in the `ADMIN_EMAILS` environment variable. The admin panel shows:

- Total users, jobs, and runs
- System health (Supabase, GitHub, cron-job.org, email)
- Plan distribution across users
- Recent signups

## License

MIT
