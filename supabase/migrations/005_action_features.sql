-- Migration 005: Add env_vars, timeout, and retry fields to actions table

ALTER TABLE actions
  ADD COLUMN IF NOT EXISTS env_vars jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timeout_minutes integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_retries integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retry_delay_seconds integer DEFAULT 60;

-- Validate constraints
ALTER TABLE actions
  ADD CONSTRAINT chk_timeout CHECK (timeout_minutes >= 1 AND timeout_minutes <= 30),
  ADD CONSTRAINT chk_retries CHECK (max_retries >= 0 AND max_retries <= 3),
  ADD CONSTRAINT chk_retry_delay CHECK (retry_delay_seconds >= 0 AND retry_delay_seconds <= 900);
