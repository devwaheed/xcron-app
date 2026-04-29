-- Migration 006: Update plan prices from one-time to monthly

UPDATE plans SET price_cents = 900 WHERE name = 'Starter';
UPDATE plans SET price_cents = 1900 WHERE name = 'Pro';
UPDATE plans SET price_cents = 3900 WHERE name = 'Business';
