# Implementation Tasks

## Task 1: Database migration for plans, user_plans, runs, and promo_codes tables
- [x] Create `supabase/migrations/004_usage_tiers.sql`
- [x] Create `plans` table with id, name, max_actions, max_runs_per_month, log_retention_days, stripe_price_id, price_cents, created_at and CHECK constraints
- [x] Seed three plan tiers: Starter (5/100/30/$49), Pro (15/500/90/$99), Business (50/2000/365/$199)
- [x] Create `user_plans` table with user_id (unique), plan_id, billing_cycle_start, stripe_customer_id (unique nullable), stripe_subscription_id, created_at, updated_at
- [x] Create `runs` table with id, action_id, user_id, triggered_at and index on (user_id, triggered_at)
- [x] Create `promo_codes` table with id, code (unique), plan_id, redeemed_by, redeemed_at, created_at
- [x] Enable RLS on all new tables with appropriate policies (plans: read-only for authenticated, user_plans: select/update own, runs: select own, promo_codes: service-role only)
- [x] Update `handle_new_user()` trigger to also insert a user_plans row with plan_id = 1
- [x] Backfill user_plans for existing users with plan_id = 1
- [x] Add updated_at trigger on user_plans
- **Requirements:** Req 1, Req 2, Req 9, Req 11, Req 15

## Task 2: Add Plan, UserPlan, and UsageStats types
- [x] Add `Plan`, `UserPlan`, and `UsageStats` interfaces to `src/types/index.ts`
- **Requirements:** Req 1, Req 2, Req 6

## Task 3: Create usage-tracker library
- [x] Create `src/lib/usage-tracker.ts`
- [x] Implement `getUserPlan(supabase, userId)` — joins user_plans + plans, returns UserPlan
- [x] Implement `getBillingCycleRange(billingCycleStart)` — computes current cycle start/end using 30-day increments
- [x] Implement `checkActionLimit(supabase, userId)` — counts user's actions vs plan max_actions, returns LimitCheckResult
- [x] Implement `checkRunLimit(supabase, userId)` — counts runs in current billing cycle vs plan max_runs_per_month, returns LimitCheckResult
- [x] Implement `recordRun(supabase, actionId, userId)` — inserts row into runs table
- [x] Implement `getUsageStats(supabase, userId)` — returns full UsageStats object for dashboard
- [x] Implement `assignPlan(supabase, userId, planId)` — updates user_plans plan_id and resets billing_cycle_start
- **Requirements:** Req 3, Req 4, Req 5, Req 6, Req 9

## Task 4: Enforce action creation limit in POST /api/actions
- [x] Import and call `checkActionLimit()` before validation in `src/app/api/actions/route.ts` POST handler
- [x] Return HTTP 403 with `{ error: "Action limit reached", current, limit }` when limit exceeded
- **Requirements:** Req 3

## Task 5: Enforce run limit and record runs in POST /api/actions/[id]/trigger
- [x] Import and call `checkRunLimit()` after action existence check in `src/app/api/actions/[id]/trigger/route.ts`
- [x] Return HTTP 429 with `{ error: "Monthly run limit reached", current, limit, resetDate }` when limit exceeded
- [x] Call `recordRun()` after successful GitHub workflow trigger (use service role client)
- **Requirements:** Req 4, Req 9

## Task 6: Create GET /api/usage endpoint
- [x] Create `src/app/api/usage/route.ts`
- [x] Authenticate user via cookies
- [x] Call `getUsageStats()` and return the result
- [x] Return 401 for unauthenticated requests
- **Requirements:** Req 6

## Task 7: Create UsageDisplay component
- [x] Create `src/components/UsageDisplay.tsx`
- [x] Fetch GET /api/usage on mount
- [x] Render action usage progress bar with "{used} / {limit} actions" label
- [x] Render run usage progress bar with "{used} / {limit} runs this month" label
- [x] Show days remaining until billing cycle reset
- [x] Apply warning color (amber) when usage >= 80% of limit
- **Requirements:** Req 7

## Task 8: Add UsageDisplay to dashboard page
- [x] Import and render `UsageDisplay` in `src/app/dashboard/page.tsx` in the stats bar area
- **Requirements:** Req 7

## Task 9: Add action limit feedback to new action page
- [x] Fetch usage stats on mount in `src/app/dashboard/new/page.tsx`
- [x] Display remaining action slots above the form
- [x] Disable form and show upgrade message when at limit
- **Requirements:** Req 10

## Task 10: Install Stripe SDK and add env vars
- [x] Run `npm install stripe`
- [x] Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to `.env.local` as placeholders
- [x] Add Stripe env vars to `src/lib/env.ts` as optional (not required for self-hosting)
- **Requirements:** Req 11, Req 12

## Task 11: Create POST /api/checkout endpoint
- [x] Create `src/app/api/checkout/route.ts`
- [x] Authenticate user via cookies
- [x] Validate plan_id exists and has stripe_price_id
- [x] Look up existing stripe_customer_id from user_plans
- [x] Create Stripe Checkout session (subscription mode) with plan's stripe_price_id
- [x] Set success_url to profile page, cancel_url to pricing page
- [x] Include userId and planId in session metadata and client_reference_id
- [x] Return 501 if STRIPE_SECRET_KEY is not configured
- [x] Return `{ url: session.url }`
- **Requirements:** Req 12

## Task 12: Create POST /api/webhooks/stripe endpoint
- [x] Create `src/app/api/webhooks/stripe/route.ts`
- [x] Read raw body and verify Stripe signature
- [x] Handle `checkout.session.completed`: assign plan, store stripe_customer_id and stripe_subscription_id
- [x] Handle `customer.subscription.updated`: update plan if price changed
- [x] Handle `customer.subscription.deleted`: downgrade to Tier 1
- [x] Handle `payment_intent.payment_failed`: log warning, no plan change
- [x] Return 400 for invalid signatures, 200 for handled events
- **Requirements:** Req 13

## Task 13: Create pricing page
- [x] Create `src/app/pricing/page.tsx` as a public page
- [x] Display three tier cards with name, price, features (max_actions, max_runs_per_month, log_retention_days)
- [x] Add "Buy" button per tier that POSTs to /api/checkout and redirects to Stripe
- [x] If unauthenticated: redirect to /login?redirect=/pricing on Buy click
- [x] If authenticated: highlight current plan with "Current Plan" badge
- [x] Conditionally hide Buy buttons when Stripe is not configured (check via env or API)
- [x] Include features comparison table
- **Requirements:** Req 14

## Task 14: Update profile page with plan info and promo code redemption
- [x] Add "Current Plan" section to `src/app/dashboard/profile/page.tsx` showing plan name and limits
- [x] Add "Change Plan" link navigating to /pricing
- [x] Add "Redeem Code" section with text input and submit button
- [x] POST to /api/redeem on submit, show success/error feedback
- **Requirements:** Req 14 (AC6), Req 15 (AC9)

## Task 15: Create POST /api/redeem endpoint
- [x] Create `src/app/api/redeem/route.ts`
- [x] Authenticate user via cookies
- [x] Validate code exists and is unredeemed (service role client)
- [x] Mark code as redeemed (set redeemed_by, redeemed_at)
- [x] Call `assignPlan()` to update user's plan
- [x] Return new plan details on success
- [x] Return 404 for invalid code, 409 for already redeemed, 401 for unauthenticated
- **Requirements:** Req 15

## Task 16: Create promo code generation script
- [x] Create `scripts/generate-promo-codes.js`
- [x] Accept --tier and --count CLI arguments
- [x] Generate codes in format XCRON-T{tier}-{8 random alphanumeric}
- [x] Insert into promo_codes table via service role client
- [x] Output generated codes as CSV to stdout
- [x] Load .env.local for Supabase credentials (same pattern as migrate-github-files.js)
- **Requirements:** Req 15

## Task 17: Create log retention cleanup endpoint
- [x] Create `src/app/api/cron/cleanup/route.ts`
- [x] Authenticate via CRON_SECRET (same pattern as trigger route)
- [x] For each user, join user_plans → plans to get log_retention_days
- [x] Delete runs where triggered_at < now() - log_retention_days interval
- [x] Return summary of deleted rows
- **Requirements:** Req 8

## Task 18: Write tests for usage-tracker, API routes, and components
- [x] Write unit tests for `src/lib/usage-tracker.ts` (getBillingCycleRange, checkActionLimit, checkRunLimit, etc.)
- [x] Write tests for POST /api/actions action limit enforcement
- [x] Write tests for POST /api/actions/[id]/trigger run limit enforcement and run recording
- [x] Write tests for GET /api/usage endpoint
- [x] Write tests for POST /api/checkout endpoint
- [x] Write tests for POST /api/webhooks/stripe endpoint
- [x] Write tests for POST /api/redeem endpoint
- [x] Write component tests for UsageDisplay
- [x] Write component tests for pricing page
- **Requirements:** Req 1-15
