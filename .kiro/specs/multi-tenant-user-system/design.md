# Design Document

## Overview

This design transforms xCron from a single-user system to a multi-tenant platform where each user has isolated data, user-scoped GitHub storage, and a personal profile. The approach uses Supabase RLS for database isolation, a dual-client pattern (service role for server-to-server, user-authenticated for user requests), and user-scoped file paths in the shared GitHub repository.

## Architecture

### Dual Supabase Client Pattern

The current system uses a single service-role client that bypasses RLS. The new design introduces two client types:

1. **Service Role Client** (`getSupabaseServerClient()`) — unchanged, used for:
   - Cron trigger endpoint (`/api/actions/[id]/trigger`) called by cron-job.org
   - Database triggers and admin operations
   - Any server-to-server call where no user session exists

2. **User-Authenticated Client** (`getAuthenticatedClient(cookies)`) — new, used for:
   - All user-facing API routes (`/api/actions/*`, `/api/profile`)
   - Returns both the Supabase client (with RLS enforced) and the user's ID
   - Created per-request from the access token in httpOnly cookies
   - Handles token refresh when access token is expired but refresh token is valid

```
┌─────────────────────────────────────────────────────┐
│                   API Routes                         │
│                                                      │
│  User Routes (/api/actions, /api/profile)            │
│    → getAuthenticatedClient(cookies)                 │
│    → Returns { supabase, userId }                    │
│    → RLS enforced: user sees only their rows         │
│                                                      │
│  Server Routes (/api/actions/[id]/trigger)           │
│    → getSupabaseServerClient()                       │
│    → Service role: bypasses RLS                      │
│    → Validates CRON_SECRET header                    │
└─────────────────────────────────────────────────────┘
```

### Database Schema Changes

#### Migration 003: Add user_id to actions + create profiles table

```sql
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

-- 9. Auto-update updated_at on profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### File Changes

#### `src/lib/supabase-server.ts` — Add authenticated client function

```typescript
interface AuthenticatedClient {
  supabase: SupabaseClient;
  userId: string;
}

async function getAuthenticatedClient(
  cookieStore: ReadonlyRequestCookies
): Promise<AuthenticatedClient>
```

- Reads `sb-access-token` from cookies
- Creates a Supabase client with the user's access token (not service role)
- Calls `supabase.auth.getUser()` to validate and extract user ID
- If access token is expired, attempts refresh using `sb-refresh-token`
- Throws an error if both fail (caller returns 401)

#### `src/lib/github-bridge.ts` — Add userId parameter

All methods gain a `userId` parameter:

```typescript
interface GitHubBridge {
  commitScript(userId: string, actionId: string, scriptContent: string): Promise<void>;
  commitWorkflow(userId: string, actionId: string, workflowYaml: string): Promise<void>;
  deleteScript(userId: string, actionId: string): Promise<void>;
  deleteWorkflow(userId: string, actionId: string): Promise<void>;
  enableWorkflow(userId: string, actionId: string): Promise<void>;
  disableWorkflow(userId: string, actionId: string): Promise<void>;
  triggerWorkflow(userId: string, actionId: string): Promise<void>;
  getWorkflowRuns(userId: string, actionId: string, page: number, status?: string): Promise<RunEntry[]>;
}
```

Path functions change:
- `getScriptPath(userId, actionId)` → `scripts/{userId}/{actionId}.js`
- `getWorkflowPath(userId, actionId)` → `.github/workflows/{userId}_{actionId}.yml`

#### `src/lib/workflow-generator.ts` — User-scoped script path

The `generate` function needs `userId` to produce the correct `node scripts/{userId}/{actionId}.js` run command:

```typescript
export function generate(action: Action, userId: string): string
```

#### `src/lib/cronjob-bridge.ts` — userId in job title

The `createJob` method adds a short user ID prefix to the job title for identification:

```typescript
createJob(actionId: string, actionName: string, schedule: Schedule, enabled: boolean, userId: string): Promise<number>
```

Job title becomes: `{actionName} [{userId first 8 chars}]`

#### `src/lib/mapRowToAction.ts` — Add userId to Action type

```typescript
// ActionRow gains:
user_id: string;

// Action type gains:
userId: string;
```

#### `src/types/index.ts` — Add userId to Action interface

```typescript
export interface Action {
  // ... existing fields
  userId: string;
}
```

### API Route Changes

All user-facing routes follow this pattern:

```typescript
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { supabase, userId } = await getAuthenticatedClient(cookieStore);
    // ... use supabase (RLS enforced) and userId
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}
```

Routes affected:
- `GET /api/actions` — uses authenticated client (RLS filters by user_id)
- `POST /api/actions` — sets `user_id: userId` in insert, passes userId to GitHub/cron bridges
- `GET /api/actions/[id]` — uses authenticated client (RLS filters)
- `PUT /api/actions/[id]` — uses authenticated client, passes userId to bridges
- `DELETE /api/actions/[id]` — uses authenticated client, passes userId to bridges
- `POST /api/actions/[id]/toggle` — uses authenticated client, passes userId to bridges
- `GET /api/actions/[id]/runs` — uses authenticated client, passes userId to GitHub bridge

Special case — `POST /api/actions/[id]/trigger`:
- Called by cron-job.org (no user cookies)
- Continues using service role client
- Validates `CRON_SECRET` in Authorization header
- Fetches action to get `user_id` for GitHub bridge calls

#### New Routes

- `GET /api/profile` — returns `{ email, displayName, timezone }` from profiles table + auth session
- `PUT /api/profile` — updates `display_name` and/or `timezone` with validation

### Frontend Changes

#### New: `/dashboard/profile` page

- Displays email (read-only from auth session)
- Editable display name field
- Timezone picker (reuses timezone list from SchedulePicker)
- Save button → `PUT /api/profile`
- Toast notifications on success/failure

#### Modified: Dashboard header

- Add profile link/icon next to "Log Out" button

#### Modified: New Action page (`/dashboard/new`)

- On mount, fetch `GET /api/profile` to get user's timezone preference
- Pre-select that timezone in SchedulePicker instead of browser-detected timezone
- Fallback to `getLocalTimezone()` if profile fetch fails

#### Modified: Edit Action page (`/dashboard/[id]/edit`)

- No change needed — already loads the action's saved timezone

### Migration Script: `scripts/migrate-github-files.js`

Standalone Node.js script that:
1. Fetches all actions from Supabase (with user_id after migration)
2. For each action, moves `scripts/{actionId}.js` → `scripts/{userId}/{actionId}.js`
3. Moves `.github/workflows/{actionId}.yml` → `.github/workflows/{userId}_{actionId}.yml`
4. Updates workflow YAML content to reference new script path
5. Logs warnings for missing files, continues processing

Run manually after applying the database migration.

## Test Strategy

- Unit tests for `getAuthenticatedClient` (mock cookies, test token refresh, test 401 on failure)
- Unit tests for updated `getScriptPath`/`getWorkflowPath` with userId
- Unit tests for `generate(action, userId)` producing correct script path
- Property tests for profile API validation (timezone validation, display name length)
- Component tests for profile page (render, save, error states)
- Existing tests updated to pass `userId` where needed
