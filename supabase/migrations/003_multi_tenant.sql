-- Migration 003: Multi-tenant user system
-- Adds user_id to actions table, creates profiles table, and sets up user-scoped RLS policies.

-- 1. Add user_id column (nullable first for backfill)
ALTER TABLE actions ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- 2. Backfill: assign all existing actions to the first user
UPDATE actions SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

-- 3. Make NOT NULL after backfill
ALTER TABLE actions ALTER COLUMN user_id SET NOT NULL;

-- 4. Index for efficient per-user queries
CREATE INDEX idx_actions_user_id ON actions(user_id);

-- 5. Replace the permissive RLS policy with user-scoped policies
DROP POLICY "Authenticated users have full access" ON actions;

CREATE POLICY "Users can select own actions"
  ON actions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own actions"
  ON actions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own actions"
  ON actions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own actions"
  ON actions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 6. Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 7. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 8. Backfill profiles for existing users
INSERT INTO profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 9. Auto-update updated_at on profiles (reuses existing update_updated_at_column function from migration 001)
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
