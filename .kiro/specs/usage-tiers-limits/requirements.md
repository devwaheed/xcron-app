# Requirements Document

## Introduction

xCron is a self-contained cron job scheduling SaaS with its own payment system powered by Stripe. The product is designed to be self-hostable and sold as source code. To manage compute costs and monetize the service, the system needs a tiered plan structure that limits the number of actions, monthly runs, and log retention per user. This feature introduces three pricing tiers, database tables to track plans and usage, server-side enforcement of limits on API routes, a dashboard usage display, an automatic monthly usage reset cycle, Stripe Checkout integration for purchasing and upgrading plans, and a public pricing page.

## Glossary

- **Plan**: A predefined tier configuration defining resource limits (action count, monthly run count, log retention period).
- **User_Plan**: The association between a user and their active plan, including the current billing cycle start date and Stripe references.
- **Action**: A user-created scheduled JavaScript task that runs via GitHub Actions.
- **Run**: A single execution of an action, triggered by schedule or manual dispatch.
- **Usage_Tracker**: The server-side module responsible for counting and enforcing resource consumption against plan limits.
- **Usage_Display**: The dashboard UI component that shows current resource consumption relative to plan limits.
- **Billing_Cycle**: A rolling 30-day period starting from the user's plan activation date, used to scope monthly run counts.
- **Log_Retention**: The duration for which run history entries are preserved before automatic cleanup.
- **API_Route**: A Next.js server-side route handler that processes client requests for actions and runs.
- **Dashboard**: The authenticated web interface where users manage actions and view usage.
- **Stripe_Checkout**: Stripe's hosted payment page used to collect payment for plan purchases and upgrades.
- **Stripe_Webhook**: An HTTP POST callback from Stripe to the application server, used to confirm completed payments and handle payment events.
- **Pricing_Page**: A public (unauthenticated) page displaying the three plan tiers, their features, and "Buy" buttons that initiate Stripe Checkout.
- **stripe_customer_id**: The Stripe Customer ID stored on the User_Plan record, linking the xCron user to their Stripe customer object.
- **stripe_subscription_id**: The Stripe Subscription ID stored on the User_Plan record when the user has an active recurring subscription.
- **stripe_price_id**: The Stripe Price ID associated with each Plan tier, used to create Checkout sessions.
- **Promo_Code**: An optional alphanumeric code that grants a user a plan tier upgrade or discount. Secondary to Stripe as a payment method.
- **Promo_Codes_Table**: A database table storing promotional codes, their associated plan tier, and redemption status.

## Requirements

### Requirement 1: Plan Definition Schema

**User Story:** As a system administrator, I want plan tiers defined in the database, so that the system can look up resource limits for any user.

#### Acceptance Criteria

1. THE Plan schema SHALL define each tier with the fields: id, name, max_actions (integer), max_runs_per_month (integer), and log_retention_days (integer).
2. THE Plan schema SHALL store exactly three tiers: Tier 1 (5 actions, 100 runs/month, 30-day retention), Tier 2 (15 actions, 500 runs/month, 90-day retention), and Tier 3 (50 actions, 2000 runs/month, 365-day retention).
3. WHEN a new plan row is inserted, THE Plan schema SHALL enforce that max_actions is greater than zero, max_runs_per_month is greater than zero, and log_retention_days is greater than zero via CHECK constraints.

### Requirement 2: User Plan Assignment

**User Story:** As a user, I want to be assigned a plan when I sign up, so that I have defined resource limits from the start.

#### Acceptance Criteria

1. WHEN a new user signs up, THE User_Plan assignment SHALL automatically assign the user to Tier 1 as the default plan.
2. THE User_Plan schema SHALL store the user's id, plan id, billing cycle start date, and created/updated timestamps.
3. THE User_Plan schema SHALL enforce that each user has exactly one active plan assignment via a unique constraint on user id.
4. WHEN a user's plan is changed, THE User_Plan assignment SHALL update the plan id and reset the billing cycle start date to the current timestamp.

### Requirement 3: Action Count Enforcement

**User Story:** As a user, I want the system to prevent me from creating more actions than my plan allows, so that I understand my limits clearly.

#### Acceptance Criteria

1. WHEN a user attempts to create a new action, THE Usage_Tracker SHALL count the user's existing actions and compare against the plan's max_actions limit.
2. IF the user's action count equals or exceeds the plan's max_actions limit, THEN THE API_Route SHALL reject the creation request with HTTP 403 and a response body containing the error message "Action limit reached", the current count, and the maximum allowed.
3. WHEN a user deletes an action, THE Usage_Tracker SHALL allow the user to create new actions up to the plan's max_actions limit without requiring any additional reset.

### Requirement 4: Monthly Run Count Enforcement

**User Story:** As a user, I want the system to prevent runs beyond my monthly limit, so that I can plan my usage accordingly.

#### Acceptance Criteria

1. WHEN an action is triggered (by schedule or manual dispatch), THE Usage_Tracker SHALL count the user's runs within the current billing cycle and compare against the plan's max_runs_per_month limit.
2. IF the user's run count within the current billing cycle equals or exceeds the plan's max_runs_per_month limit, THEN THE API_Route SHALL reject the trigger request with HTTP 429 and a response body containing the error message "Monthly run limit reached", the current count, the maximum allowed, and the billing cycle reset date.
3. THE Usage_Tracker SHALL count runs by querying action trigger events scoped to the current user and the current billing cycle date range.

### Requirement 5: Billing Cycle Reset

**User Story:** As a user, I want my monthly run count to reset automatically, so that I get a fresh allocation each cycle.

#### Acceptance Criteria

1. WHEN the current date exceeds the billing cycle start date plus 30 days, THE Usage_Tracker SHALL treat the run count as zero for the new cycle.
2. WHEN a new billing cycle begins, THE User_Plan assignment SHALL update the billing cycle start date to the start of the new cycle.
3. THE Usage_Tracker SHALL calculate billing cycle boundaries using the user's billing_cycle_start date, advancing in 30-day increments, so that the cycle is consistent regardless of calendar month length.

### Requirement 6: Usage Statistics API

**User Story:** As a user, I want to retrieve my current usage statistics via an API endpoint, so that the dashboard can display them.

#### Acceptance Criteria

1. THE API_Route SHALL expose a GET /api/usage endpoint that returns the authenticated user's current action count, action limit, run count for the current billing cycle, run limit, billing cycle reset date, and plan name.
2. WHEN an unauthenticated request is made to GET /api/usage, THE API_Route SHALL respond with HTTP 401 and the error message "Authentication required".
3. THE API_Route SHALL compute run counts by querying runs scoped to the authenticated user's actions within the current billing cycle date range.

### Requirement 7: Dashboard Usage Display

**User Story:** As a user, I want to see my usage stats on the dashboard, so that I know how close I am to my limits.

#### Acceptance Criteria

1. THE Usage_Display SHALL show the current action count and the plan's max_actions limit in the format "{used} / {limit} actions".
2. THE Usage_Display SHALL show the current billing cycle run count and the plan's max_runs_per_month limit in the format "{used} / {limit} runs this month".
3. THE Usage_Display SHALL show the number of days remaining until the billing cycle resets.
4. WHEN the user's action count reaches 80% or more of the max_actions limit, THE Usage_Display SHALL render the action count in a warning color.
5. WHEN the user's run count reaches 80% or more of the max_runs_per_month limit, THE Usage_Display SHALL render the run count in a warning color.

### Requirement 8: Log Retention Enforcement

**User Story:** As a user, I want old run logs automatically cleaned up based on my plan's retention period, so that storage is managed efficiently.

#### Acceptance Criteria

1. THE Log_Retention process SHALL delete run history entries older than the user's plan log_retention_days value.
2. THE Log_Retention process SHALL execute on a scheduled basis (at least once per day).
3. WHEN a user's plan is upgraded to a tier with longer retention, THE Log_Retention process SHALL preserve existing logs that fall within the new retention window.
4. WHEN a user's plan is downgraded to a tier with shorter retention, THE Log_Retention process SHALL delete logs that exceed the new retention period on the next scheduled execution.

### Requirement 9: Run Tracking

**User Story:** As a system operator, I want every action execution recorded in the database, so that usage counting and history are accurate.

#### Acceptance Criteria

1. WHEN an action is triggered successfully (workflow dispatch accepted by GitHub), THE Usage_Tracker SHALL insert a row into a runs tracking table with the action id, user id, and timestamp.
2. THE runs tracking table SHALL store the action_id, user_id, triggered_at timestamp, and a reference to the billing cycle.
3. THE runs tracking table SHALL have an index on (user_id, triggered_at) to support efficient billing cycle queries.

### Requirement 10: Limit Feedback on Action Creation UI

**User Story:** As a user, I want to see my remaining action capacity before I try to create one, so that I am not surprised by a rejection.

#### Acceptance Criteria

1. WHEN the user navigates to the new action page, THE Dashboard SHALL display the remaining action slots available (max_actions minus current action count).
2. WHEN the user has zero remaining action slots, THE Dashboard SHALL disable the action creation form and display the message "You have reached your action limit. Upgrade your plan or delete an existing action."

### Requirement 11: Stripe Integration Schema

**User Story:** As a system administrator, I want Stripe payment data stored alongside user plans, so that the system can track subscriptions and process payments.

#### Acceptance Criteria

1. THE User_Plan schema SHALL include the fields: stripe_customer_id (nullable text), stripe_subscription_id (nullable text), and stripe_price_id (nullable text).
2. THE Plan schema SHALL include a stripe_price_id field (text) that maps each plan tier to its corresponding Stripe Price object.
3. WHEN a user completes a Stripe Checkout session, THE User_Plan record SHALL store the stripe_customer_id and stripe_subscription_id returned by Stripe.
4. THE User_Plan schema SHALL enforce that stripe_customer_id is unique across all rows (one Stripe customer per xCron user).
5. WHEN a self-hosted instance is deployed without Stripe credentials, THE system SHALL allow plan assignment via the Promo_Code path or direct database updates without requiring Stripe fields.

### Requirement 12: Stripe Checkout API

**User Story:** As a user, I want to purchase or upgrade my plan via Stripe, so that I can pay securely and have my plan activated automatically.

#### Acceptance Criteria

1. THE API_Route SHALL expose a POST /api/checkout endpoint that accepts a JSON body with a "plan_id" field identifying the target plan tier.
2. WHEN an authenticated user submits a valid plan_id, THE API_Route SHALL create a Stripe Checkout session in "subscription" mode using the plan's stripe_price_id and return the session URL.
3. WHEN the user already has a stripe_customer_id, THE API_Route SHALL pass the existing customer ID to the Stripe Checkout session to link the purchase to the same Stripe customer.
4. WHEN the user already has an active stripe_subscription_id and requests a different tier, THE API_Route SHALL create a Stripe Checkout session that handles the plan change (upgrade or downgrade).
5. IF the plan_id does not reference a valid plan, THEN THE API_Route SHALL return HTTP 400 with the error message "Invalid plan".
6. WHEN an unauthenticated request is made to POST /api/checkout, THE API_Route SHALL return HTTP 401 with the error message "Authentication required".
7. THE API_Route SHALL set the Checkout session success_url to the dashboard profile page and cancel_url to the pricing page.

### Requirement 13: Stripe Webhook Handler

**User Story:** As a system operator, I want Stripe events processed automatically, so that user plans are activated and updated when payments succeed or fail.

#### Acceptance Criteria

1. THE API_Route SHALL expose a POST /api/webhooks/stripe endpoint that accepts Stripe webhook events.
2. THE webhook handler SHALL verify the Stripe signature header using the configured webhook secret before processing any event.
3. WHEN a checkout.session.completed event is received, THE webhook handler SHALL assign the purchased plan to the user, store the stripe_customer_id and stripe_subscription_id on the User_Plan record, and reset the billing cycle start date.
4. WHEN a customer.subscription.updated event is received with a changed price, THE webhook handler SHALL update the user's plan to match the new stripe_price_id.
5. WHEN a customer.subscription.deleted event is received, THE webhook handler SHALL downgrade the user to Tier 1 (free default).
6. IF the Stripe signature verification fails, THEN THE webhook handler SHALL return HTTP 400 with the error message "Invalid signature".
7. WHEN a payment_intent.payment_failed event is received, THE webhook handler SHALL log the failure and retain the user's current plan without changes.

### Requirement 14: Pricing Page UI

**User Story:** As a visitor, I want to see a pricing page comparing plan tiers, so that I can choose and purchase the right plan for my needs.

#### Acceptance Criteria

1. THE Pricing_Page SHALL be publicly accessible without authentication at the /pricing route.
2. THE Pricing_Page SHALL display all three plan tiers with their name, price, max_actions, max_runs_per_month, and log_retention_days.
3. THE Pricing_Page SHALL include a "Buy" button for each tier that initiates the Stripe Checkout flow (redirecting to POST /api/checkout).
4. WHEN an unauthenticated visitor clicks a "Buy" button, THE Pricing_Page SHALL redirect the visitor to the login page with a return URL pointing back to the pricing page.
5. WHEN an authenticated user views the Pricing_Page, THE page SHALL highlight the user's current plan tier and change the button label to "Current Plan" for that tier.
6. THE Dashboard profile page SHALL display the user's current plan name, tier limits, and a "Change Plan" link that navigates to the Pricing_Page.
7. THE Pricing_Page SHALL include a features comparison table listing the differences between tiers (action count, run limit, log retention).

### Requirement 15: Promo Code Redemption

**User Story:** As a user, I want to redeem a promotional code, so that I can activate or upgrade my plan without going through Stripe checkout.

#### Acceptance Criteria

1. THE Promo_Codes_Table SHALL store each code with the fields: id, code (unique text), plan_id (references plans table), redeemed_by (nullable uuid, references auth.users), redeemed_at (nullable timestamptz), and created_at (timestamptz).
2. THE Promo_Codes_Table SHALL enforce uniqueness on the code column.
3. THE Promo_Codes_Table SHALL have RLS enabled with a policy that allows only service-role access (no direct user access).
4. THE API_Route SHALL expose a POST /api/redeem endpoint that accepts a JSON body with a "code" field.
5. WHEN a valid, unredeemed code is submitted by an authenticated user, THE API_Route SHALL assign the code's associated plan to the user, mark the code as redeemed (setting redeemed_by and redeemed_at), reset the billing cycle start date, and return HTTP 200 with the new plan details.
6. IF the code does not exist, THEN THE API_Route SHALL return HTTP 404 with the error message "Invalid code".
7. IF the code has already been redeemed, THEN THE API_Route SHALL return HTTP 409 with the error message "Code already redeemed".
8. WHEN an unauthenticated request is made to POST /api/redeem, THE API_Route SHALL return HTTP 401 with the error message "Authentication required".
9. THE Dashboard profile page SHALL include a "Redeem Code" section with a text input for entering a promotional code and feedback messages for success or error states.
