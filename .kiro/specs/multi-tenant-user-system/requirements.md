# Requirements Document

## Introduction

xCron is a cron job scheduling SaaS built on Next.js 16, Supabase, GitHub Actions, and cron-job.org. The application currently operates as a single-user system where all authenticated users share full access to every action. The Multi-Tenant User System introduces per-user data isolation so that each user (AppSumo buyer) gets their own workspace with private actions, user-scoped GitHub script storage, per-user cron job management, and a profile page. This is the foundational feature that all other features (usage tiers, teams, etc.) depend on.

## Glossary

- **Action**: A scheduled JavaScript task consisting of a name, script content, schedule, and status (active/paused), stored in the `actions` table.
- **Actions_Table**: The Supabase PostgreSQL table that stores all Action records.
- **API_Route**: A Next.js server-side route handler under `/api/` that processes HTTP requests.
- **Auth_Session**: The Supabase Auth session containing the authenticated user's identity, retrieved from httpOnly cookies (access token + refresh token).
- **Dashboard_Layout**: The server-side Next.js layout component (`src/app/dashboard/layout.tsx`) that guards all `/dashboard` routes by verifying the Auth_Session.
- **GitHub_Bridge**: The module (`src/lib/github-bridge.ts`) that commits scripts and workflows to a GitHub repository and manages workflow lifecycle.
- **CronJob_Bridge**: The module (`src/lib/cronjob-bridge.ts`) that creates, updates, enables, disables, and deletes jobs on cron-job.org.
- **Profiles_Table**: A new Supabase PostgreSQL table that stores per-user profile data (display name, timezone preference) linked to `auth.users`.
- **RLS**: Row Level Security — PostgreSQL policies that restrict which rows a user can access based on their identity.
- **Supabase_Server_Client**: The server-side Supabase client (`src/lib/supabase-server.ts`) currently configured with the service role key, which bypasses RLS.
- **User_Scoped_Path**: A GitHub repository file path that includes the user ID as a directory segment, e.g., `scripts/{user_id}/{action_id}.js`.
- **Timezone_Preference**: The user's preferred IANA timezone string stored in the Profiles_Table, used as the default when creating new Actions.

## Requirements

### Requirement 1: Add user_id Column to Actions Table

**User Story:** As a platform operator, I want every action to be associated with the user who created it, so that actions are owned and isolated per user.

#### Acceptance Criteria

1. THE Actions_Table SHALL include a `user_id` column of type `uuid` that references `auth.users(id)` with a NOT NULL constraint.
2. WHEN a new database migration is applied, THE Actions_Table SHALL have a `user_id` column added with a default value set to the ID of the first existing user for backfill of pre-existing rows.
3. WHEN the migration completes, THE Actions_Table SHALL have the default value removed from the `user_id` column so that future inserts require an explicit `user_id`.
4. THE Actions_Table SHALL have an index on the `user_id` column to support efficient per-user queries.

### Requirement 2: Row Level Security Scoped to User

**User Story:** As a user, I want my actions to be invisible and inaccessible to other users, so that my data remains private.

#### Acceptance Criteria

1. WHEN the migration is applied, THE Actions_Table SHALL replace the existing "Authenticated users have full access" RLS policy with user-scoped policies.
2. THE Actions_Table SHALL have a SELECT RLS policy that restricts rows to those where `user_id` matches `auth.uid()`.
3. THE Actions_Table SHALL have an INSERT RLS policy that allows inserts only when the `user_id` value in the new row matches `auth.uid()`.
4. THE Actions_Table SHALL have an UPDATE RLS policy that restricts updates to rows where `user_id` matches `auth.uid()`.
5. THE Actions_Table SHALL have a DELETE RLS policy that restricts deletes to rows where `user_id` matches `auth.uid()`.

### Requirement 3: Authenticated User Extraction in API Routes

**User Story:** As a developer, I want a reliable way to extract the authenticated user's ID from the request in every API route, so that all queries can be scoped to the correct user.

#### Acceptance Criteria

1. THE Supabase_Server_Client module SHALL provide a function that accepts the request cookies, creates a Supabase client authenticated as the requesting user (using the access token from cookies), and returns both the client and the authenticated user's ID.
2. WHEN the access token cookie is missing or invalid, THE API_Route SHALL return an HTTP 401 response with an error message "Authentication required".
3. WHEN the access token is expired but a valid refresh token cookie exists, THE Supabase_Server_Client SHALL attempt to refresh the session and return the new authenticated client.
4. IF the refresh attempt also fails, THEN THE API_Route SHALL return an HTTP 401 response with an error message "Authentication required".

### Requirement 4: User-Scoped Action Queries in API Routes

**User Story:** As a user, I want all API operations on actions to be scoped to my account, so that I can only see and modify my own actions.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/actions`, THE API_Route SHALL return only actions where `user_id` matches the authenticated user's ID.
2. WHEN a POST request is made to `/api/actions`, THE API_Route SHALL set the `user_id` field of the new action to the authenticated user's ID.
3. WHEN a GET request is made to `/api/actions/[id]`, THE API_Route SHALL return the action only if `user_id` matches the authenticated user's ID.
4. WHEN a PUT request is made to `/api/actions/[id]`, THE API_Route SHALL update the action only if `user_id` matches the authenticated user's ID.
5. WHEN a DELETE request is made to `/api/actions/[id]`, THE API_Route SHALL delete the action only if `user_id` matches the authenticated user's ID.
6. WHEN a POST request is made to `/api/actions/[id]/toggle`, THE API_Route SHALL toggle the action only if `user_id` matches the authenticated user's ID.
7. WHEN a POST request is made to `/api/actions/[id]/trigger`, THE API_Route SHALL trigger the action only if `user_id` matches the authenticated user's ID.
8. WHEN a GET request is made to `/api/actions/[id]/runs`, THE API_Route SHALL return run history only if the action's `user_id` matches the authenticated user's ID.
9. IF an action is not found or the `user_id` does not match the authenticated user, THEN THE API_Route SHALL return an HTTP 404 response with an error message "Action not found".

### Requirement 5: User-Scoped GitHub Script and Workflow Storage

**User Story:** As a user, I want my scripts and workflows stored in a path that includes my user ID, so that files from different users do not collide in the shared GitHub repository.

#### Acceptance Criteria

1. WHEN the GitHub_Bridge commits a script, THE GitHub_Bridge SHALL store the file at the path `scripts/{user_id}/{action_id}.js` where `user_id` is the authenticated user's ID.
2. WHEN the GitHub_Bridge commits a workflow, THE GitHub_Bridge SHALL store the file at the path `.github/workflows/{user_id}_{action_id}.yml` where `user_id` is the authenticated user's ID.
3. WHEN the GitHub_Bridge deletes a script, THE GitHub_Bridge SHALL delete the file at the user-scoped path `scripts/{user_id}/{action_id}.js`.
4. WHEN the GitHub_Bridge deletes a workflow, THE GitHub_Bridge SHALL delete the file at the user-scoped path `.github/workflows/{user_id}_{action_id}.yml`.
5. WHEN the GitHub_Bridge enables, disables, or triggers a workflow, THE GitHub_Bridge SHALL reference the workflow file name `{user_id}_{action_id}.yml`.
6. WHEN the GitHub_Bridge fetches workflow runs, THE GitHub_Bridge SHALL query runs for the workflow file `{user_id}_{action_id}.yml`.
7. THE GitHub_Bridge interface SHALL accept a `userId` parameter in all methods that interact with file paths or workflow identifiers.

### Requirement 6: Migration of Existing GitHub Files to User-Scoped Paths

**User Story:** As a platform operator, I want existing scripts and workflows migrated to user-scoped paths, so that the system is consistent after the multi-tenant migration.

#### Acceptance Criteria

1. WHEN the migration script runs, THE migration script SHALL move each existing script from `scripts/{action_id}.js` to `scripts/{user_id}/{action_id}.js` using the `user_id` assigned during the database backfill.
2. WHEN the migration script runs, THE migration script SHALL move each existing workflow from `.github/workflows/{action_id}.yml` to `.github/workflows/{user_id}_{action_id}.yml`.
3. WHEN the migration script runs, THE migration script SHALL update the workflow YAML content to reference the new script path `scripts/{user_id}/{action_id}.js`.
4. IF a file to be migrated does not exist in the GitHub repository, THEN THE migration script SHALL log a warning and continue processing remaining files.

### Requirement 7: User-Scoped Cron Job Management

**User Story:** As a user, I want my cron-job.org jobs to trigger only my actions, so that scheduling is isolated per user.

#### Acceptance Criteria

1. WHEN the CronJob_Bridge creates a job, THE CronJob_Bridge SHALL include the user's ID in the job title for identification (e.g., `{action_name} [{user_id_short}]`).
2. THE CronJob_Bridge trigger URL SHALL remain `/api/actions/{action_id}/trigger`, and the API_Route at that endpoint SHALL verify ownership before executing.
3. WHEN the CronJob_Bridge creates or updates a job, THE CronJob_Bridge SHALL pass the `CRON_SECRET` in the Authorization header so that the trigger endpoint can authenticate the request as a legitimate cron trigger.

### Requirement 8: Profiles Table and User Profile Data

**User Story:** As a user, I want a profile page where I can view my email and set my preferred timezone, so that new actions default to my timezone.

#### Acceptance Criteria

1. THE Profiles_Table SHALL contain columns: `id` (uuid, primary key, references `auth.users(id)`), `display_name` (text, nullable), `timezone` (text, NOT NULL, default `'UTC'`), `created_at` (timestamptz), and `updated_at` (timestamptz).
2. THE Profiles_Table SHALL have RLS enabled with policies that allow each user to SELECT and UPDATE only their own row (where `id` matches `auth.uid()`).
3. WHEN a new user signs up via Supabase Auth, THE system SHALL automatically create a row in the Profiles_Table with the user's ID and default timezone `'UTC'` using a database trigger on `auth.users`.
4. THE Profiles_Table SHALL have an `updated_at` trigger that automatically sets the timestamp on row modification.

### Requirement 9: User Profile API Route

**User Story:** As a user, I want API endpoints to read and update my profile, so that the frontend can display and modify my settings.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/profile`, THE API_Route SHALL return the authenticated user's profile data (display name, timezone, email from auth session).
2. WHEN a PUT request is made to `/api/profile` with a valid timezone string, THE API_Route SHALL update the authenticated user's timezone in the Profiles_Table.
3. WHEN a PUT request is made to `/api/profile` with a valid display_name string, THE API_Route SHALL update the authenticated user's display name in the Profiles_Table.
4. IF the timezone value is not a valid IANA timezone string, THEN THE API_Route SHALL return an HTTP 400 response with an error message "Invalid timezone".
5. IF the display_name exceeds 100 characters, THEN THE API_Route SHALL return an HTTP 400 response with an error message "Display name too long".

### Requirement 10: User Profile Page

**User Story:** As a user, I want a profile page in the dashboard where I can see my email and change my timezone preference, so that I can personalize my experience.

#### Acceptance Criteria

1. THE Dashboard SHALL include a profile page accessible at `/dashboard/profile`.
2. WHEN the profile page loads, THE profile page SHALL display the user's email address (read-only) and current timezone preference.
3. WHEN the user selects a new timezone from a timezone picker, THE profile page SHALL send a PUT request to `/api/profile` to persist the change.
4. WHEN the profile update succeeds, THE profile page SHALL display a success toast notification.
5. IF the profile update fails, THEN THE profile page SHALL display an error toast notification with the error message.
6. THE profile page SHALL include a display name field that the user can edit and save.
7. THE Dashboard header SHALL include a link or button to navigate to the profile page.

### Requirement 11: Default Timezone from User Profile

**User Story:** As a user, I want new actions to default to my preferred timezone, so that I do not have to select my timezone every time I create an action.

#### Acceptance Criteria

1. WHEN the new action page loads, THE new action page SHALL fetch the user's timezone preference from `/api/profile` and pre-select the timezone in the schedule picker.
2. WHEN the edit action page loads, THE edit action page SHALL display the action's saved timezone (not the user's default).
3. IF the profile fetch fails, THEN THE new action page SHALL fall back to `'UTC'` as the default timezone.
