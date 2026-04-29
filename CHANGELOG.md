# Changelog

All notable changes to xCron are documented here.

## v1.0.0 — April 2026

### Core Platform
- Multi-tenant user system with row-level security
- Email/password authentication with Supabase Auth
- User profiles with timezone preferences
- Session management with auto-refresh

### Job Management
- Create, edit, duplicate, pause, resume, and delete scheduled jobs
- **No-code HTTP Request mode** — schedule any URL call without writing code
- **Custom Script mode** — inline JavaScript editor with syntax highlighting
- Flexible scheduling: pick days, time, timezone
- Environment variables per job (up to 20, masked display)
- Configurable execution timeout (1–30 minutes)
- Retry policies (0–3 retries with 1/5/15 min delay)
- Job duplication with one click

### Dashboard
- Sidebar navigation (Jobs, Account, Billing, Templates)
- Sparkline charts showing last 15 runs per job
- Success rate percentage on every job card
- Last run status indicator with date
- Stats overview: total jobs, active, paused, runs this month
- Skeleton loading states throughout
- Command palette with keyboard shortcuts (⌘K)
- Mobile-responsive with hamburger menu

### Templates
- 10 pre-built job templates across 5 categories
- Monitoring, Data, Notifications, Backups, Integrations, Maintenance
- One-click "Use template" to pre-fill new job form

### Usage Tiers & Billing
- 3 plans: Starter ($9/mo), Pro ($19/mo), Business ($39/mo)
- Per-user job and run limits enforced server-side
- Usage display with progress bars
- Promo code system for plan upgrades
- Billing & Usage dashboard page

### Notifications
- Welcome email on signup
- Password reset email
- Job failure alert emails with error output
- Configurable via Resend (optional)

### Admin Panel
- System health indicators (database, execution engine, scheduler, email)
- Total users, jobs, and runs counters
- Plan distribution breakdown
- Recent signups table
- Protected by ADMIN_EMAILS env var

### Security
- Rate limiting on auth (5/min) and password reset (3/5min)
- Script content validation (blocks dangerous patterns)
- Row-level security on all database tables
- HTTP-only secure session cookies
- Input sanitization on all API endpoints

### Execution Engine
- Pluggable architecture — swap backends via EXECUTION_ENGINE env var
- GitHub Actions engine (default) with PAT or GitHub App auth
- Auto-rotating GitHub App tokens (1-hour cache)
- Workflow generation with timeout and retry support
- Future-ready for Lambda, Modal, Docker backends

### Pages
- Landing page with hero, features, how-it-works, pricing, social proof, FAQ
- Documentation / Help Center
- Terms of Service
- Privacy Policy
- Standalone pricing page

### Developer Experience
- 367 automated tests (unit, integration, property-based)
- TypeScript throughout
- Tailwind CSS 4 with custom design tokens
- CodeMirror 6 editor with custom syntax theme
- PWA support with service worker
- Sentry error monitoring (optional)
- Comprehensive .env.example
- Database migrations (6 files, run in order)
- Deploy to Vercel button
