-- Migration 004: Usage tiers, plans, billing, runs tracking, and promo codes
-- Adds plans table, user_plans table, runs table, and promo_codes table.

-- 1. Create plans table
CREATE TABLE plans (
  id serial PRIMARY KEY,
  name text NOT NULL,
  max_actions integer NOT NULL CHECK (max_actions > 0),
  max_runs_per_month integer NOT NULL CHECK (max_runs_per_month > 0),
  log_retention_days integer NOT NULL CHECK (log_retention_days > 0),
  stripe_price_id text,
  price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read plans"
  ON plans FOR SELECT TO authenticated
  USING (true);

-- 2. Seed three plan tiers
INSERT INTO plans (name, max_actions, max_runs_per_month, log_retention_days, price_cents) VALUES
  ('Starter', 5, 100, 30, 4900),
  ('Pro', 15, 500, 90, 9900),
  ('Business', 50, 2000, 365, 19900);

-- 3. Create user_plans table
CREATE TABLE user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id integer NOT NULL REFERENCES plans(id) DEFAULT 1,
  billing_cycle_start timestamptz NOT NULL DEFAULT now(),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own plan"
  ON user_plans FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own plan"
  ON user_plans FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 4. Create runs table
CREATE TABLE runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_runs_user_triggered ON runs(user_id, triggered_at);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own runs"
  ON runs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 5. Create promo_codes table
CREATE TABLE promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan_id integer NOT NULL REFERENCES plans(id),
  redeemed_by uuid REFERENCES auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — service role only

-- 6. Update handle_new_user() to also create a user_plans row
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  INSERT INTO user_plans (user_id, plan_id) VALUES (NEW.id, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Backfill user_plans for existing users
INSERT INTO user_plans (user_id, plan_id)
SELECT id, 1 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 8. Auto-update updated_at on user_plans
CREATE TRIGGER user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
