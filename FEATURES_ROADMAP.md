# xCron — Features Roadmap for AppSumo Launch

## Current State

xCron is a cron job scheduling SaaS that lets users write JavaScript, pick a schedule, and have it run automatically via GitHub Actions. It uses Supabase for auth/database, GitHub for script storage and execution, and cron-job.org for scheduling triggers.

**What exists today:**
- Single-user email/password auth (Supabase)
- CRUD for scheduled actions (name, JS script, day/time/timezone)
- Pause/resume, manual trigger, delete
- Run history from GitHub Actions (success/failure, logs, pagination)
- CodeMirror script editor with syntax highlighting
- Onboarding flow with starter templates
- Design system, dark mode, command palette, keyboard shortcuts
- PWA support for mobile installation
- Responsive dashboard with skeleton loading

**Architecture:** Next.js 16 + Supabase + GitHub Actions + cron-job.org

---

## Phase 1 — Core Product Hardening (Must-Have for Launch)

These features are non-negotiable for selling on AppSumo. Without them, users will refund.

### 1.1 Multi-Tenant User System
**Why:** Currently single-user. Every AppSumo buyer needs their own isolated workspace.
**What:**
- Add `user_id` column to `actions` table with RLS per user
- Update all API routes to scope queries by authenticated user
- Each user gets their own GitHub repo (or use a shared repo with user-scoped paths)
- Per-user cron-job.org job management
- User profile page (email, timezone preference)

### 1.2 Usage Tiers & Limits
**Why:** Lifetime deals need cost control. Unlimited compute = bankruptcy.
**What:**
- Define tier structure:
  - Tier 1 ($49): 5 actions, 100 runs/month, 30-day log retention
  - Tier 2 ($99): 15 actions, 500 runs/month, 90-day log retention
  - Tier 3 ($199): 50 actions, 2000 runs/month, 1-year log retention
- Add `plans` table and `user_plans` table
- Enforce limits in API routes (action count, run count)
- Show usage stats in dashboard (runs used / total, actions used / total)
- Usage reset on monthly cycle

### 1.3 Execution Notifications
**Why:** Users need to know when their scripts fail without checking the dashboard.
**What:**
- Email notifications on failure (via Supabase Edge Functions or Resend)
- Optional email on success (digest mode: daily summary)
- Notification preferences page (per-action: none / failures / all)
- Webhook URL per action (POST with run result JSON) for Slack/Discord/Zapier

### 1.4 Action Duplication
**Why:** Users create similar actions often. Copy-and-modify is faster than starting from scratch.
**What:**
- "Duplicate" button on action card and edit page
- Creates new action with same script/schedule, appended " (copy)" to name
- Opens edit page for the duplicate

### 1.5 Script Environment Variables
**Why:** Users need API keys, tokens, and config values without hardcoding them in scripts.
**What:**
- Per-action key-value env vars stored encrypted in Supabase
- Injected as environment variables during GitHub Actions execution
- UI for managing env vars on the edit page
- Masked display (show last 4 chars only)
- Max 20 env vars per action

---

## Phase 2 — Differentiation Features (Makes It Sellable)

These features make xCron stand out from EasyCron/FastCron and justify the price.

### 2.1 Template Marketplace
**Why:** Most AppSumo buyers aren't developers. Pre-built templates lower the barrier.
**What:**
- Curated template library (15-20 templates at launch):
  - Website uptime monitor (HTTP ping + alert)
  - Database backup (PostgreSQL/MySQL dump to S3)
  - Slack daily standup reminder
  - RSS feed to email digest
  - Social media post scheduler
  - Invoice reminder sender
  - SSL certificate expiry checker
  - Sitemap generator
  - Google Analytics report emailer
  - Stripe revenue daily summary
- Template detail page with description, preview, required env vars
- "Use Template" → pre-fills new action form
- Community template submissions (future)

### 2.2 Visual Run Dashboard
**Why:** Current history page is basic. Users want at-a-glance health monitoring.
**What:**
- Success/failure sparkline chart per action (last 30 runs)
- Global dashboard stats: total runs today, success rate %, next scheduled run
- Calendar heatmap showing run activity (like GitHub contribution graph)
- Average execution time per action
- Trend indicators (↑↓ compared to last period)

### 2.3 Retry Policies
**Why:** Transient failures are common. Auto-retry prevents false alarms.
**What:**
- Per-action retry config: max retries (0-3), delay between retries (1min, 5min, 15min)
- Exponential backoff option
- Only notify after all retries exhausted
- Retry count shown in run history

### 2.4 Execution Timeout
**Why:** Runaway scripts burn GitHub Actions minutes and cost money.
**What:**
- Per-action timeout setting (default 5min, max 30min)
- Enforced via `timeout-minutes` in generated workflow YAML
- Warning when script approaches timeout
- Kill and mark as failed when exceeded

### 2.5 Action Groups / Folders
**Why:** Power users with 20+ actions need organization.
**What:**
- Create named groups (e.g., "Monitoring", "Backups", "Reports")
- Drag-and-drop actions into groups
- Collapsible group sections in dashboard
- Bulk pause/resume per group
- Color-coded group labels

---

## Phase 3 — Growth & Retention Features

These keep users engaged long-term and reduce churn.

### 3.1 Webhook Triggers (Event-Driven Actions)
**Why:** Not everything is time-based. "Run when X happens" is powerful.
**What:**
- Generate unique webhook URL per action
- Trigger action via POST to webhook URL (with optional payload)
- Payload available as `process.env.WEBHOOK_PAYLOAD` in script
- Use cases: run on deploy, run on form submission, run on Stripe event
- Rate limiting on webhook endpoints (10 calls/min)

### 3.2 Script Versioning
**Why:** Users accidentally break scripts and need to rollback.
**What:**
- Store last 10 versions of each script
- Version history page with diff view
- One-click rollback to any previous version
- Auto-save draft while editing (don't commit until explicit save)

### 3.3 Team Collaboration
**Why:** Tier 3 buyers expect team features.
**What:**
- Invite team members by email
- Roles: Owner (full access), Editor (edit actions), Viewer (read-only)
- Activity log (who changed what, when)
- Shared action library within team
- Per-seat pricing in higher tiers

### 3.4 API Access
**Why:** Developers want programmatic control.
**What:**
- API key generation (per user, revocable)
- REST API matching dashboard functionality:
  - List/create/update/delete actions
  - Trigger action
  - Get run history
  - Get usage stats
- API documentation page (interactive, like Swagger)
- Rate limiting (100 req/min)

### 3.5 Custom Notification Channels
**Why:** Not everyone uses email. Slack, Discord, and Telegram are popular.
**What:**
- Slack integration (OAuth, pick channel)
- Discord webhook URL
- Telegram bot integration
- Microsoft Teams webhook
- Per-action channel selection

---

## Phase 4 — Premium / Enterprise Features (Post-Launch Upsell)

These can be sold as add-ons or higher tiers after the AppSumo launch.

### 4.1 Custom Runtime Environments
**Why:** Not all scripts need just Node.js. Python, shell scripts, etc.
**What:**
- Runtime selector: Node.js 20, Node.js 22, Python 3.12, Bash
- Pre-installed packages per runtime
- Custom package.json / requirements.txt per action
- Docker-based execution (future)

### 4.2 Cron Expression Builder (Advanced Scheduling)
**Why:** Power users want "every 15 minutes" or "first Monday of month."
**What:**
- Visual cron expression builder
- Interval scheduling (every N minutes/hours)
- Monthly scheduling (specific day of month)
- Custom cron expression input with validation
- Human-readable preview of schedule
- Next 5 execution times preview

### 4.3 Output Storage & Data Pipeline
**Why:** Scripts that generate data need somewhere to put it.
**What:**
- Capture stdout as structured output
- Store last N outputs per action (configurable retention)
- Export outputs as CSV/JSON
- S3/GCS bucket integration for large outputs
- Output forwarding to webhook URL

### 4.4 Status Page
**Why:** Users want to share uptime/monitoring status publicly.
**What:**
- Public status page per user (customizable subdomain)
- Select which actions appear on status page
- Uptime percentage badges (embeddable)
- Incident history timeline
- Custom branding (logo, colors)

### 4.5 White-Label / Reseller
**Why:** Agencies want to offer cron jobs to their clients under their brand.
**What:**
- Custom domain support
- Remove xCron branding
- Custom logo and colors
- Client sub-accounts
- Reseller pricing tier

---

## AppSumo Launch Checklist

### Pricing Structure
| Tier | Price | Actions | Runs/Month | Log Retention | Team Members | Features |
|------|-------|---------|------------|---------------|--------------|----------|
| Tier 1 | $49 | 5 | 100 | 30 days | 1 | Core + Templates |
| Tier 2 | $99 | 15 | 500 | 90 days | 3 | + Webhooks, Retry, API |
| Tier 3 | $199 | 50 | 2,000 | 1 year | 10 | + Teams, Versioning, Channels |

### Minimum Viable for Launch (Phase 1 + select Phase 2)
1. ✅ Multi-tenant user system (1.1)
2. ✅ Usage tiers & limits (1.2)
3. ✅ Execution notifications — email (1.3)
4. ✅ Action duplication (1.4)
5. ✅ Script environment variables (1.5)
6. ✅ Template library — at least 10 templates (2.1)
7. ✅ Visual run dashboard with charts (2.2)
8. ✅ Retry policies (2.3)
9. ✅ Execution timeout (2.4)

### Launch Assets Needed
- Demo video (2-3 min walkthrough)
- 5 high-quality screenshots (dashboard, editor, templates, history, mobile)
- Comparison table vs competitors (EasyCron, FastCron, Cronitor)
- FAQ section addressing lifetime deal concerns
- Testimonials / beta user quotes
- Landing page optimized for AppSumo audience (less dev-focused, more outcome-focused)

### Cost Estimation Per User
- GitHub Actions: ~$0.008/min (free tier: 2000 min/month for public repos)
- Supabase: Free tier covers 50K rows, 500MB storage
- cron-job.org: Free tier covers basic scheduling
- Estimated cost per Tier 1 user: ~$1-3/month
- Break-even on $49 LTD: ~16-49 months (acceptable for LTD model)

---

## Recommended Build Order

1. **Multi-tenant system** (1.1) — foundation for everything else
2. **Usage tiers & limits** (1.2) — cost control before launch
3. **Script environment variables** (1.5) — makes templates actually useful
4. **Template library** (2.1) — biggest differentiator for AppSumo audience
5. **Execution notifications** (1.3) — table-stakes feature
6. **Action duplication** (1.4) — quick win, great UX
7. **Retry policies** (2.3) — reliability feature
8. **Execution timeout** (2.4) — cost protection
9. **Visual run dashboard** (2.2) — wow factor for screenshots
