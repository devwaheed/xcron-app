#!/usr/bin/env node

/**
 * Migration script: moves existing GitHub files to user-scoped paths.
 *
 * For each action in the database:
 *   - scripts/{actionId}.js        → scripts/{userId}/{actionId}.js
 *   - .github/workflows/{actionId}.yml → .github/workflows/{userId}_{actionId}.yml
 *   - Updates the workflow YAML to reference the new script path
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_PAT
 *
 * Run after applying database migration 003_multi_tenant.sql:
 *   node scripts/migrate-github-files.js
 */

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// ---------------------------------------------------------------------------
// Load .env.local if present (no dotenv dependency needed)
// ---------------------------------------------------------------------------
try {
  const envPath = resolve(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env.local not found — rely on env vars being set externally
}

// ---------------------------------------------------------------------------
// Env validation
// ---------------------------------------------------------------------------

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_REPO_OWNER',
  'GITHUB_REPO_NAME',
  'GITHUB_PAT',
];

function loadEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    owner: process.env.GITHUB_REPO_OWNER,
    repo: process.env.GITHUB_REPO_NAME,
    pat: process.env.GITHUB_PAT,
  };
}

// ---------------------------------------------------------------------------
// GitHub helpers (mirrors github-bridge.ts patterns)
// ---------------------------------------------------------------------------

function githubHeaders(pat) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function getFileContent(owner, repo, path, pat) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: githubHeaders(pat) });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET ${path}: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
  };
}

async function commitFile(owner, repo, path, content, message, pat) {
  // Check if file already exists (need sha for update)
  const existing = await getFileContent(owner, repo, path, pat);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
  };
  if (existing) {
    body.sha = existing.sha;
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: githubHeaders(pat),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub PUT ${path}: ${res.status} ${res.statusText} - ${detail}`);
  }
}

async function deleteFile(owner, repo, path, sha, message, pat) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: githubHeaders(pat),
    body: JSON.stringify({ message, sha }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub DELETE ${path}: ${res.status} ${res.statusText} - ${detail}`);
  }
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function oldScriptPath(actionId) {
  return `scripts/${actionId}.js`;
}

function newScriptPath(userId, actionId) {
  return `scripts/${userId}/${actionId}.js`;
}

function oldWorkflowPath(actionId) {
  return `.github/workflows/${actionId}.yml`;
}

function newWorkflowPath(userId, actionId) {
  return `.github/workflows/${userId}_${actionId}.yml`;
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

async function main() {
  const env = loadEnv();

  const supabase = createClient(env.supabaseUrl, env.supabaseKey);

  // Fetch all actions with their user_id
  console.log('Fetching actions from Supabase…');
  const { data: actions, error } = await supabase
    .from('actions')
    .select('id, name, user_id');

  if (error) {
    console.error('Failed to fetch actions:', error.message);
    process.exit(1);
  }

  if (!actions || actions.length === 0) {
    console.log('No actions found. Nothing to migrate.');
    return;
  }

  console.log(`Found ${actions.length} action(s) to migrate.\n`);

  let migrated = 0;
  let warnings = 0;

  for (const action of actions) {
    const { id: actionId, name: actionName, user_id: userId } = action;
    console.log(`--- Migrating action "${actionName}" (${actionId}) for user ${userId}`);

    // ---- Script file ----
    const oldScript = oldScriptPath(actionId);
    const newScript = newScriptPath(userId, actionId);

    try {
      const scriptFile = await getFileContent(env.owner, env.repo, oldScript, env.pat);
      if (!scriptFile) {
        console.warn(`  ⚠ Script not found at ${oldScript}, skipping script migration`);
        warnings++;
      } else {
        console.log(`  Committing script to ${newScript}`);
        await commitFile(env.owner, env.repo, newScript, scriptFile.content, `Migrate script ${actionId} to user-scoped path`, env.pat);

        console.log(`  Deleting old script at ${oldScript}`);
        await deleteFile(env.owner, env.repo, oldScript, scriptFile.sha, `Remove old script ${actionId} (migrated)`, env.pat);
      }
    } catch (err) {
      console.error(`  ✗ Script migration failed for ${actionId}: ${err.message}`);
      warnings++;
    }

    // ---- Workflow file ----
    const oldWf = oldWorkflowPath(actionId);
    const newWf = newWorkflowPath(userId, actionId);

    try {
      const wfFile = await getFileContent(env.owner, env.repo, oldWf, env.pat);
      if (!wfFile) {
        console.warn(`  ⚠ Workflow not found at ${oldWf}, skipping workflow migration`);
        warnings++;
      } else {
        // Update script path reference inside the YAML
        const updatedContent = wfFile.content.replace(
          new RegExp(`scripts/${actionId}\\.js`, 'g'),
          `scripts/${userId}/${actionId}.js`
        );

        console.log(`  Committing workflow to ${newWf}`);
        await commitFile(env.owner, env.repo, newWf, updatedContent, `Migrate workflow ${actionId} to user-scoped path`, env.pat);

        console.log(`  Deleting old workflow at ${oldWf}`);
        await deleteFile(env.owner, env.repo, oldWf, wfFile.sha, `Remove old workflow ${actionId} (migrated)`, env.pat);
      }
    } catch (err) {
      console.error(`  ✗ Workflow migration failed for ${actionId}: ${err.message}`);
      warnings++;
    }

    migrated++;
    console.log();
  }

  console.log('='.repeat(50));
  console.log(`Migration complete: ${migrated} action(s) processed, ${warnings} warning(s).`);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
