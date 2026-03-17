-- Add cron_job_id column to store the cron-job.org job identifier
ALTER TABLE actions ADD COLUMN cron_job_id bigint;
