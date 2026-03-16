-- Create the actions table for storing cron job configurations
CREATE TABLE actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  script_content text NOT NULL,
  days smallint[] NOT NULL,
  time_hour smallint NOT NULL,
  time_minute smallint NOT NULL,
  time_period text NOT NULL,
  timezone text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  github_workflow_id bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT actions_time_hour_check CHECK (time_hour BETWEEN 1 AND 12),
  CONSTRAINT actions_time_minute_check CHECK (time_minute BETWEEN 0 AND 59),
  CONSTRAINT actions_time_period_check CHECK (time_period IN ('AM', 'PM')),
  CONSTRAINT actions_status_check CHECK (status IN ('active', 'paused')),
  CONSTRAINT actions_days_not_empty CHECK (array_length(days, 1) > 0)
);

-- Enable Row Level Security
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- RLS policy: only authenticated users can select, insert, update, delete
CREATE POLICY "Authenticated users have full access"
  ON actions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-update the updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
