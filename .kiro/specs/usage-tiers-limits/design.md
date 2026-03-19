# Design Document

## Introduction

This document describes the technical design for implementing usage tiers, limits, Stripe payments, and promo code redemption in xCron. The system adds four new database tables (plans, user_plans, runs, promo_codes), a usage tracking library, Stripe Checkout integration, a public pricing page, and dashboard usage displays. All changes build on the existing multi-tenant architecture (migration 003) and Next.js 16 + Supabase stack.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  /pricing (public)  │  /dashboard (usage display)           │
│  /dashboard/profile (plan info, redeem code, change plan)   │
│  /dashboard/new (action limit feedback)                     │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                     API Routes                               │
│  POST /api/checkout        → Stripe Checkout session         │
│  POST /api/webhooks/stripe → Stripe event handler            │
│  POST /api/redeem          → Promo code redemption           │
│  GET  /api/usage           → Usage statistics                │
│  POST /api/actions         → Action creation (limit check)   │
│  POST /api/actions/[id]/trigger → Run trigger (limit check)  │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                   src/lib/usage-tracker.ts                    │
│  getUserPlan() │ checkActionLimit() │ checkRunLimit()        │
│  recordRun()   │ getUsageStats()    │ getBillingCycle()      │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                     Supabase (Database)                       │
│  plans │ user_plans │ runs │ promo_codes │ actions │ profiles│
└─────────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                     Stripe API                               │
│  Checkout Sessions │ Subscriptions │ Webhooks                │
└─────────────────────────────────────────────────────────────┘
```

## Database Design

### Migration: `supabase/migrations/004_usage_tiers.sql`

#### plans table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Auto-increment plan ID |
| name | text | NOT NULL | Tier display name ("Starter", "Pro", "Business") |
| max_actions | integer | NOT NULL, CHECK > 0 | Max actions allowed |
| max_runs_per_month | integer | NOT NULL, CHECK > 0 | Max runs per billing cycle |
| log_retention_days | integer | NOT NULL, CHECK > 0 | Days to retain run logs |
| stripe_price_id | text | NULLABLE | Stripe Price ID for checkout |
| price_cents | integer | NOT NULL DEFAULT 0 | Display price in cents (4900, 9900, 19900) |
| created_at | timestamptz | DEFAULT now() | Row creation timestamp |

Seeded with three rows:
- Tier 1 "Starter": 5 actions, 100 runs, 30 days, $49
- Tier 2 "Pro": 15 actions, 500 runs, 90 days, $99
- Tier 3 "Business": 50 actions, 2000 runs, 365 days, $199

RLS: Read-only for authenticated users (plans are public data).

#### user_plans table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Row ID |
| user_id | uuid | NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE | One plan per user |
| plan_id | integer | NOT NULL REFERENCES plans(id) | Current plan |
| billing_cycle_start | timestamptz | NOT NULL DEFAULT now() | Start of current 30-day cycle |
| stripe_customer_id | text | NULLABLE, UNIQUE | Stripe Customer ID |
| stripe_subscription_id | text | NULLABLE | Stripe Subscription ID |
| created_at | timestamptz | DEFAULT now() | Row creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

RLS: Users can SELECT and UPDATE their own row. INSERT via trigger only (service role).

The `handle_new_user()` trigger (from migration 003) will be updated to also insert a user_plans row with plan_id = 1 (Tier 1).

#### runs table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Row ID |
| action_id | uuid | NOT NULL REFERENCES actions(id) ON DELETE CASCADE | Which action was triggered |
| user_id | uuid | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Who owns the action |
| triggered_at | timestamptz | NOT NULL DEFAULT now() | When the run was triggered |

Index: `CREATE INDEX idx_runs_user_triggered ON runs(user_id, triggered_at)` for efficient billing cycle queries.

RLS: Users can SELECT their own runs. INSERT via service role (API routes use service role for run tracking).

#### promo_codes table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Row ID |
| code | text | NOT NULL UNIQUE | The promo code string |
| plan_id | integer | NOT NULL REFERENCES plans(id) | Plan tier this code grants |
| redeemed_by | uuid | NULLABLE REFERENCES auth.users(id) | User who redeemed |
| redeemed_at | timestamptz | NULLABLE | When redeemed |
| created_at | timestamptz | DEFAULT now() | Row creation timestamp |

RLS: Service-role only (no direct user access). All operations go through API routes.

## Component Design

### 1. Usage Tracker Library — `src/lib/usage-tracker.ts`

Central module for all plan/usage queries. Uses the service role client for writes (run tracking) and authenticated client for reads.

```typescript
interface UserPlan {
  planId: number;
  planName: string;
  maxActions: number;
  maxRunsPerMonth: number;
  logRetentionDays: number;
  billingCycleStart: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface UsageStats {
  planName: string;
  actions: { used: number; limit: number };
  runs: { used: number; limit: number };
  billingCycleReset: string; // ISO date of next reset
  logRetentionDays: number;
}

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resetDate?: string; // only for run limits
}
```

Key functions:
- `getUserPlan(supabase, userId)` → Joins user_plans + plans, returns UserPlan
- `checkActionLimit(supabase, userId)` → Counts actions, compares to plan limit, returns LimitCheckResult
- `checkRunLimit(supabase, userId)` → Counts runs in current billing cycle, returns LimitCheckResult
- `recordRun(supabase, actionId, userId)` → Inserts into runs table (service role)
- `getUsageStats(supabase, userId)` → Returns full UsageStats for dashboard display
- `getBillingCycleRange(billingCycleStart)` → Computes current cycle start/end dates using 30-day increments
- `assignPlan(supabase, userId, planId)` → Updates user_plans row, resets billing cycle

### 2. Stripe Integration

#### Environment Variables (added to `.env.local`)
- `STRIPE_SECRET_KEY` — Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` — Webhook endpoint signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Client-side publishable key (for future client-side Stripe.js if needed)

#### POST /api/checkout — `src/app/api/checkout/route.ts`
1. Authenticate user via cookies
2. Validate plan_id exists in plans table and has a stripe_price_id
3. Look up user's existing stripe_customer_id from user_plans
4. If user has existing stripe_subscription_id, use Stripe Billing Portal or create new session with subscription_data
5. Create Stripe Checkout session:
   - mode: "subscription"
   - customer: existing stripe_customer_id or let Stripe create new
   - line_items: [{ price: plan.stripe_price_id, quantity: 1 }]
   - success_url: `{origin}/dashboard/profile?checkout=success`
   - cancel_url: `{origin}/pricing`
   - metadata: { userId, planId }
   - client_reference_id: userId
6. Return `{ url: session.url }`

#### POST /api/webhooks/stripe — `src/app/api/webhooks/stripe/route.ts`
1. Read raw body, verify Stripe signature using STRIPE_WEBHOOK_SECRET
2. Handle events:
   - `checkout.session.completed`: Extract userId from client_reference_id, planId from metadata. Call `assignPlan()`. Store stripe_customer_id and stripe_subscription_id on user_plans.
   - `customer.subscription.updated`: Look up user by stripe_customer_id. If price changed, find matching plan by stripe_price_id, call `assignPlan()`.
   - `customer.subscription.deleted`: Look up user by stripe_customer_id. Downgrade to plan_id = 1 (Tier 1).
   - `payment_intent.payment_failed`: Log warning, no plan change.
3. Return 200 for all handled events, 400 for signature failures.

Note: This route must NOT use the Next.js body parser (needs raw body for signature verification). Use `export const runtime = 'nodejs'` and read the raw body via `request.text()`.

### 3. Promo Code Redemption

#### POST /api/redeem — `src/app/api/redeem/route.ts`
1. Authenticate user via cookies
2. Validate code exists and is unredeemed (using service role client to bypass RLS)
3. Within a transaction-like flow:
   - Mark code as redeemed (set redeemed_by, redeemed_at)
   - Call `assignPlan(supabase, userId, code.plan_id)`
4. Return new plan details

#### CLI Script — `scripts/generate-promo-codes.js`
- Accepts: `--tier <1|2|3> --count <N>`
- Generates codes in format `XCRON-T{tier}-{8 random alphanumeric}`
- Inserts into promo_codes table via service role client
- Outputs CSV to stdout

### 4. API Route Modifications

#### POST /api/actions (action creation)
Before the existing validation logic, add:
```
const limitCheck = await checkActionLimit(supabase, userId);
if (!limitCheck.allowed) {
  return 403 { error: "Action limit reached", current, limit }
}
```

#### POST /api/actions/[id]/trigger (run trigger)
After confirming action exists and is not paused, add:
```
const runCheck = await checkRunLimit(supabase, userId);
if (!runCheck.allowed) {
  return 429 { error: "Monthly run limit reached", current, limit, resetDate }
}
// After successful GitHub trigger:
await recordRun(serviceClient, actionId, userId);
```

### 5. Frontend Components

#### Usage Display — `src/components/UsageDisplay.tsx`
- Fetches GET /api/usage on mount
- Renders two progress bars (actions, runs) with "{used} / {limit}" labels
- Shows "X days until reset" for billing cycle
- Warning color (amber) when usage >= 80%
- Used in dashboard page (stats bar area) and profile page

#### Pricing Page — `src/app/pricing/page.tsx`
- Public page (no auth required to view)
- Fetches plans from GET /api/usage or a public plans endpoint
- Three tier cards with name, price, features list, "Buy" button
- If authenticated: highlights current plan, shows "Current Plan" badge
- If not authenticated: "Buy" redirects to /login?redirect=/pricing
- "Buy" for authenticated users: POST /api/checkout → redirect to Stripe

#### Profile Page Updates — `src/app/dashboard/profile/page.tsx`
- Add "Current Plan" section showing plan name and limits
- Add "Change Plan" link to /pricing
- Add "Redeem Code" section with text input and submit button
- Show success/error feedback for code redemption

#### New Action Page Updates — `src/app/dashboard/new/page.tsx`
- Fetch usage stats on mount
- Display "X of Y actions used" above the form
- If at limit: disable form, show upgrade message

### 6. Log Retention

#### Approach
A Supabase Edge Function or a cron-triggered API route that runs daily:
1. For each user, join user_plans → plans to get log_retention_days
2. Delete from runs where triggered_at < now() - log_retention_days interval
3. Triggered via cron-job.org hitting a protected endpoint, or via Supabase pg_cron

For simplicity, implement as `POST /api/cron/cleanup` protected by CRON_SECRET (same pattern as the existing trigger route). Schedule via cron-job.org to run once daily.

## Type Updates

### `src/types/index.ts` additions
```typescript
export interface Plan {
  id: number;
  name: string;
  maxActions: number;
  maxRunsPerMonth: number;
  logRetentionDays: number;
  stripePriceId: string | null;
  priceCents: number;
}

export interface UserPlan {
  userId: string;
  planId: number;
  planName: string;
  billingCycleStart: string;
  stripeCustomerId: string | null;
}

export interface UsageStats {
  planName: string;
  actions: { used: number; limit: number };
  runs: { used: number; limit: number };
  billingCycleReset: string;
  logRetentionDays: number;
}
```

## Security Considerations

1. Stripe webhook signature verification is mandatory — reject all unverified events
2. The /api/webhooks/stripe route must be excluded from CSRF protection and cookie auth (it uses Stripe signatures)
3. Promo codes table uses service-role-only RLS — users cannot enumerate or brute-force codes
4. The checkout endpoint validates plan_id server-side — clients cannot inject arbitrary Stripe price IDs
5. Usage checks use server-side counts — clients cannot bypass limits by manipulating requests
6. stripe_customer_id uniqueness prevents duplicate Stripe customers per user

## Self-Hosting Considerations

1. All Stripe env vars are optional — if STRIPE_SECRET_KEY is not set, the checkout and webhook routes return 501 "Payments not configured"
2. Self-hosters can assign plans directly via database or promo codes
3. The pricing page conditionally hides "Buy" buttons when Stripe is not configured, showing only the promo code path
4. Plan tier values (limits, prices) are database-driven and can be customized per deployment

## Dependencies

- `stripe` npm package (Stripe Node.js SDK) — for Checkout session creation and webhook verification
- No other new dependencies required
