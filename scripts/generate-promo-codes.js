#!/usr/bin/env node

/**
 * Generates promo codes for a given plan tier and inserts them into the database.
 * Usage: node scripts/generate-promo-codes.js --tier <1|2|3> --count <N>
 * Output: CSV of generated codes to stdout
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error('Warning: Could not read .env.local');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Parse CLI args
const args = process.argv.slice(2);
let tier = null;
let count = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tier' && args[i + 1]) tier = parseInt(args[++i], 10);
  if (args[i] === '--count' && args[i + 1]) count = parseInt(args[++i], 10);
}

if (!tier || ![1, 2, 3].includes(tier)) {
  console.error('Usage: node scripts/generate-promo-codes.js --tier <1|2|3> --count <N>');
  process.exit(1);
}
if (!count || count < 1) {
  console.error('--count must be a positive integer');
  process.exit(1);
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for readability

function generateCode(tierNum) {
  let random = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    random += CHARS[bytes[i] % CHARS.length];
  }
  return `XCRON-T${tierNum}-${random}`;
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push({
      code: generateCode(tier),
      plan_id: tier,
    });
  }

  const { error } = await supabase.from('promo_codes').insert(codes);
  if (error) {
    console.error('Failed to insert codes:', error.message);
    process.exit(1);
  }

  // Output CSV
  console.log('code');
  for (const c of codes) {
    console.log(c.code);
  }

  console.error(`\nGenerated ${count} promo codes for Tier ${tier}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
