# Tasks

## Task 1: Database migration — add user_id to actions and create profiles table
- [x] Create `supabase/migrations/003_multi_tenant.sql` with:
  - Add `user_id uuid REFERENCES auth.users(id)` column to actions table (nullable initially)
  - Backfill existing rows with first user's ID
  - Set `user_id` to NOT NULL after backfill
  - Create index `idx_actions_user_id` on `user_id`
  - Drop existing "Authenticated users have full access" RLS policy
  - Create four user-scoped RLS policies (SELECT, INSERT, UPDATE, DELETE) using `auth.uid()`
  - Create `profiles` table with `id`, `display_name`, `timezone`, `created_at`, `updated_at`
  - Enable RLS on profiles with SELECT and UPDATE policies
  - Create `handle_new_user()` trigger function to auto-create profile on auth.users insert
  - Backfill profiles for existing users
  - Add `updated_at` trigger on profiles table
> Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.3, 8.4

## Task 2: Add authenticated client function to supabase-server module
- [x] Add `getAuthenticatedClient(cookieStore)` function to `src/lib/supabase-server.ts` that:
  - Reads `sb-access-token` and `sb-refresh-token` from the cookie store
  - Creates a Supabase client using the access token (not service role key)
  - Validates the token via `supabase.auth.getUser()`
  - If access token is expired, attempts refresh using the refresh token
  - Returns `{ supabase, userId }` on success
  - Throws an error on authentication failure
- [x] Export the `AuthenticatedClient` interface
- [x] Keep existing `getSupabaseServerClient()` unchanged for service-role operations
> Requirements: 3.1, 3.2, 3.3, 3.4

## Task 3: Update Action type and mapRowToAction with userId
- [x] Add `userId: string` field to the `Action` interface in `src/types/index.ts`
- [x] Add `user_id: string` field to the `ActionRow` interface in `src/lib/mapRowToAction.ts`
- [x] Map `row.user_id` to `action.userId` in the `mapRowToAction` function
> Requirements: 1.1, 4.2

## Task 4: Update GitHub bridge with user-scoped paths
- [x] Update `getScriptPath(userId, actionId)` to return `scripts/{userId}/{actionId}.js`
- [x] Update `getWorkflowPath(userId, actionId)` to return `.github/workflows/{userId}_{actionId}.yml`
- [x] Add `userId` as the first parameter to all `GitHubBridge` interface methods
- [x] Update all method implementations to use user-scoped paths and workflow file names
- [x] Update all call sites that reference `getScriptPath` and `getWorkflowPath` exports
> Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7

## Task 5: Update workflow generator with user-scoped script path
- [x] Add `userId` parameter to the `generate` function in `src/lib/workflow-generator.ts`
- [x] Update the "Run script" step to use `node scripts/{userId}/{actionId}.js`
- [x] Update all call sites of `generate()` to pass userId
> Requirements: 5.1

## Task 6: Update cronjob bridge with userId in job title
- [x] Add `userId` parameter to `createJob` method in `src/lib/cronjob-bridge.ts`
- [x] Update job title to include short user ID: `{actionName} [{userId first 8 chars}]`
- [x] Update all call sites of `createJob()` to pass userId
> Requirements: 7.1

## Task 7: Update GET/POST /api/actions routes with auth
- [x] Update `GET /api/actions` in `src/app/api/actions/route.ts` to:
  - Use `getAuthenticatedClient(cookies)` instead of `getSupabaseServerClient()`
  - Return 401 if authentication fails
  - RLS automatically filters actions by user_id
- [x] Update `POST /api/actions` to:
  - Use `getAuthenticatedClient(cookies)` to get userId
  - Include `user_id: userId` in the Supabase insert
  - Pass userId to `bridge.commitScript()`, `bridge.commitWorkflow()`, `cronBridge.createJob()`, and `generate()`
  - Return 401 if authentication fails
> Requirements: 3.2, 4.1, 4.2

## Task 8: Update /api/actions/[id] routes with auth
- [x] Update `GET /api/actions/[id]` to use `getAuthenticatedClient(cookies)` — RLS handles scoping
- [x] Update `PUT /api/actions/[id]` to use `getAuthenticatedClient(cookies)` and pass userId to bridges and generate()
- [x] Update `DELETE /api/actions/[id]` to use `getAuthenticatedClient(cookies)` and pass userId to bridges
- [x] All three return 401 on auth failure, 404 when action not found (RLS prevents cross-user access)
> Requirements: 3.2, 4.3, 4.4, 4.5, 4.9

## Task 9: Update /api/actions/[id]/toggle, trigger, and runs routes with auth
- [x] Update `POST /api/actions/[id]/toggle` to use `getAuthenticatedClient(cookies)` and pass userId to bridges
- [x] Update `POST /api/actions/[id]/trigger` to:
  - Keep using service role client for cron-job.org calls (CRON_SECRET auth)
  - For user-initiated triggers (has cookies), use `getAuthenticatedClient(cookies)`
  - Fetch action's `user_id` from the row to pass to GitHub bridge
- [x] Update `GET /api/actions/[id]/runs` to use `getAuthenticatedClient(cookies)` and pass userId to GitHub bridge
> Requirements: 4.6, 4.7, 4.8, 7.2, 7.3

## Task 10: Create profile API routes
- [x] Create `src/app/api/profile/route.ts` with:
  - `GET /api/profile` — fetches profile from profiles table, includes email from auth session
  - `PUT /api/profile` — updates timezone and/or display_name with validation
  - Timezone validation: check against `Intl.supportedValuesOf('timeZone')` if available, or regex
  - Display name validation: max 100 characters
  - Returns 400 for invalid timezone or display name too long
  - Returns 401 if not authenticated
> Requirements: 9.1, 9.2, 9.3, 9.4, 9.5

## Task 11: Create profile page UI
- [x] Create `src/app/dashboard/profile/page.tsx` with:
  - Fetch profile data on mount via `GET /api/profile`
  - Display email (read-only)
  - Editable display name field
  - Timezone picker (reuse timezone list from SchedulePicker)
  - Save button that sends `PUT /api/profile`
  - Toast notifications on success/failure
  - Loading and error states
- [x] Add profile link to dashboard header in `src/app/dashboard/page.tsx` (next to Log Out button)
> Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7

## Task 12: Default timezone from user profile on new action page
- [x] Update `src/app/dashboard/new/page.tsx` to:
  - Fetch `GET /api/profile` on mount
  - Pre-select the user's timezone preference in the SchedulePicker
  - Fall back to `getLocalTimezone()` if profile fetch fails
- [x] Verify edit page still uses the action's saved timezone (no change needed)
> Requirements: 11.1, 11.2, 11.3

## Task 13: Create GitHub file migration script
- [x] Create `scripts/migrate-github-files.js` that:
  - Connects to Supabase and fetches all actions with their user_id
  - For each action, reads the old script file, commits to new user-scoped path, deletes old file
  - For each action, reads the old workflow file, updates script path in YAML, commits to new path, deletes old file
  - Logs warnings for missing files and continues
  - Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_PAT
> Requirements: 6.1, 6.2, 6.3, 6.4

## Task 14: Update existing tests for multi-tenant changes
- [x] Update tests that mock or reference `getSupabaseServerClient` to account for the new `getAuthenticatedClient`
- [x] Update tests that reference `getScriptPath`/`getWorkflowPath` to pass userId
- [x] Update tests that call `generate()` to pass userId
- [x] Update tests that create Action objects to include `userId` field
- [x] Ensure all 320+ existing tests still pass
> Requirements: All
