# Implementation Plan: Cron Job Builder

## Overview

Incremental implementation of the cron job builder: core data models and utilities first, then API routes, then UI pages and components, then integration wiring. Each task builds on the previous. GitHub Bridge and CronBuilder are implemented early since most features depend on them.

## Tasks

- [x] 1. Set up project foundation and core types
  - [x] 1.1 Create shared TypeScript interfaces and types
    - Define `Action`, `Schedule`, `RunEntry` interfaces in `src/types/index.ts`
    - Define environment config type and validation helper in `src/lib/env.ts`
    - _Requirements: 10.2, 11.1_

  - [x] 1.2 Create Supabase database migration for the actions table
    - Create SQL migration file with the `actions` table schema (id, name, script_content, days, time_hour, time_minute, time_period, timezone, status, github_workflow_id, created_at, updated_at)
    - Include RLS policy restricting access to authenticated users only
    - _Requirements: 4.6, 11.1_

  - [x] 1.3 Set up Supabase client helpers
    - Create server-side Supabase client using service role key in `src/lib/supabase-server.ts`
    - Create client-side Supabase client for auth session management in `src/lib/supabase-client.ts`
    - _Requirements: 2.3, 11.6_

- [x] 2. Implement CronBuilder and schedule validation
  - [x] 2.1 Implement CronBuilder module
    - Create `src/lib/cron-builder.ts` with `buildCron(schedule: Schedule): string` and `parseCron(cron: string, timezone: string): Schedule`
    - Handle 12-hour to 24-hour conversion, timezone-to-UTC offset, and day mapping
    - _Requirements: 10.2, 13.2_

  - [x] 2.2 Write property test: Schedule-to-cron round-trip
    - **Property 15: Schedule-to-cron round-trip**
    - Create `tests/property/schedule-roundtrip.property.test.ts`
    - Use `arbitrarySchedule` generator (valid days, hour 1–12, minute 0–59, AM/PM, IANA timezone)
    - For any valid schedule, `parseCron(buildCron(schedule), schedule.timezone)` should equal the original schedule
    - **Validates: Requirements 10.2, 13.2**

  - [x] 2.3 Implement schedule validation
    - Create `src/lib/schedule-validator.ts` with `validateSchedule(schedule: Schedule): ValidationResult`
    - Reject empty days, hour outside 1–12, minute outside 0–59, invalid timezone, invalid AM/PM
    - _Requirements: 13.3, 4.8_

  - [x] 2.4 Write property test: Invalid schedule rejection
    - **Property 17: Invalid schedule rejection**
    - Create `tests/property/validation.property.test.ts`
    - Use `arbitraryInvalidSchedule` generator
    - For any invalid schedule, `validateSchedule` should return errors
    - **Validates: Requirements 13.3**

  - [x] 2.5 Write unit tests for CronBuilder
    - Create `tests/unit/cron-builder.test.ts`
    - Test known schedule → cron string conversions
    - Test edge cases: midnight, noon, timezone boundary crossings, all days selected, single day
    - _Requirements: 10.2, 13.2_

- [x] 3. Implement WorkflowGenerator
  - [x] 3.1 Implement WorkflowGenerator module
    - Create `src/lib/workflow-generator.ts` with `generate(action: Action): string`
    - Output valid YAML with: `on.schedule[].cron`, `on.workflow_dispatch`, Node.js setup step, dependency install step (including Puppeteer), script execution step referencing `scripts/{actionId}.js`
    - _Requirements: 10.1, 10.3, 10.4, 10.5, 13.1_

  - [x] 3.2 Write property test: Generated workflow structure completeness
    - **Property 14: Generated workflow structure completeness**
    - Create `tests/property/workflow-generation.property.test.ts`
    - Use `arbitraryAction` generator
    - For any valid action, `generate(action)` should produce valid YAML containing all required sections
    - **Validates: Requirements 10.1, 10.3, 10.4, 10.5, 13.1**

  - [x] 3.3 Write unit tests for WorkflowGenerator
    - Create `tests/unit/workflow-generator.test.ts`
    - Test specific action → expected YAML structure
    - Verify correct script path, cron expression, and step ordering
    - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [x] 4. Checkpoint - Core utilities verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement GitHubBridge
  - [x] 5.1 Implement GitHubBridge module
    - Create `src/lib/github-bridge.ts` implementing the `GitHubBridge` interface
    - Implement `commitScript`, `commitWorkflow`, `deleteScript`, `deleteWorkflow` using GitHub REST API (Contents API)
    - Implement `enableWorkflow`, `disableWorkflow`, `triggerWorkflow` using GitHub Actions API
    - Implement `getWorkflowRuns` with pagination and status filtering
    - Use `GITHUB_PAT`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME` from env config
    - Scripts committed to `scripts/{actionId}.js`, workflows to `.github/workflows/{actionId}.yml`
    - _Requirements: 11.2, 11.3, 11.4, 11.6_

  - [x] 5.2 Write property test: Correct file paths in repository
    - **Property 16: Correct file paths in repository**
    - Create `tests/property/action-crud.property.test.ts` (or add to existing)
    - Use `arbitraryAction` generator
    - For any action, verify GitHubBridge constructs paths `scripts/{actionId}.js` and `.github/workflows/{actionId}.yml`
    - **Validates: Requirements 11.2, 11.3**

- [x] 6. Implement authentication API routes and middleware
  - [x] 6.1 Create auth middleware
    - Create `src/middleware.ts` (Next.js middleware) to protect `/dashboard` and sub-routes
    - Redirect unauthenticated requests to `/login`
    - _Requirements: 2.7_

  - [x] 6.2 Implement auth API routes
    - Create `src/app/api/auth/login/route.ts` — POST, authenticate via Supabase Auth, set session cookie
    - Create `src/app/api/auth/logout/route.ts` — POST, end session
    - Create `src/app/api/auth/reset-password/route.ts` — POST, trigger Supabase password reset email
    - _Requirements: 2.3, 2.6, 2.8_

  - [x] 6.3 Write property test: Unauthenticated route protection
    - **Property 1: Unauthenticated route protection**
    - Create `tests/property/auth-guard.property.test.ts`
    - For any protected route and unauthenticated request, verify redirect to login
    - **Validates: Requirements 2.7**

- [x] 7. Implement action CRUD API routes
  - [x] 7.1 Implement GET /api/actions and GET /api/actions/[id]
    - Create `src/app/api/actions/route.ts` — GET handler to list all actions from Supabase
    - Create `src/app/api/actions/[id]/route.ts` — GET handler for single action
    - Map Supabase row to `Action` application type
    - _Requirements: 3.1_

  - [x] 7.2 Implement POST /api/actions (create action)
    - Add POST handler to `src/app/api/actions/route.ts`
    - Validate input using schedule validator
    - GitHub-first: generate workflow YAML, commit script + workflow via GitHubBridge, then insert into Supabase
    - If GitHub fails, return error without touching Supabase
    - _Requirements: 4.6, 4.7, 4.9_

  - [x] 7.3 Implement PUT /api/actions/[id] (update action)
    - Add PUT handler to `src/app/api/actions/[id]/route.ts`
    - GitHub-first: update script + workflow via GitHubBridge, then update Supabase
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 7.4 Implement DELETE /api/actions/[id] (delete action)
    - Add DELETE handler to `src/app/api/actions/[id]/route.ts`
    - GitHub-first: delete script + workflow via GitHubBridge, then delete from Supabase
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 7.5 Write property test: GitHub-first transactional guarantee
    - **Property 5: GitHub-first transactional guarantee**
    - Add to `tests/property/action-crud.property.test.ts`
    - Mock GitHubBridge to fail; verify Supabase is never called for create, update, delete
    - **Validates: Requirements 4.9, 5.4, 6.4**

  - [x] 7.6 Write property test: Action creation persists to both stores
    - **Property 3: Action creation persists to both stores**
    - For any valid action config, verify both GitHubBridge and Supabase are called on create
    - **Validates: Requirements 4.6, 4.7**

  - [x] 7.7 Write property test: Action update persists to both stores
    - **Property 7: Action update persists to both stores**
    - For any valid action update, verify both stores are updated
    - **Validates: Requirements 5.2, 5.3**

  - [x] 7.8 Write property test: Action deletion removes from both stores
    - **Property 8: Action deletion removes from both stores**
    - For any action, verify deletion removes from both stores
    - **Validates: Requirements 6.2, 6.3**

- [x] 8. Implement toggle, trigger, and run history API routes
  - [x] 8.1 Implement POST /api/actions/[id]/toggle
    - Create `src/app/api/actions/[id]/toggle/route.ts`
    - If active → disable workflow via GitHubBridge, update status to "paused" in Supabase
    - If paused → enable workflow via GitHubBridge, update status to "active" in Supabase
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Implement POST /api/actions/[id]/trigger
    - Create `src/app/api/actions/[id]/trigger/route.ts`
    - Call `triggerWorkflow` on GitHubBridge
    - _Requirements: 8.2_

  - [x] 8.3 Implement GET /api/actions/[id]/runs
    - Create `src/app/api/actions/[id]/runs/route.ts`
    - Fetch run history from GitHubBridge with pagination (page query param) and optional status filter
    - Cap at 100 entries per action
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [x] 8.4 Write property test: Pause/resume round-trip
    - **Property 9: Pause/resume round-trip**
    - Create `tests/property/pause-resume.property.test.ts`
    - For any active action, pause then resume should restore original state
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

  - [x] 8.5 Write property test: Manual trigger dispatches workflow
    - **Property 11: Manual trigger dispatches workflow**
    - For any action with a valid workflow ID, Run Now should call dispatch API
    - **Validates: Requirements 8.2**

- [x] 9. Checkpoint - All API routes implemented
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Landing Page and Login Page
  - [x] 10.1 Create Landing Page
    - Create `src/app/page.tsx` with hero section (headline, subtitle, CTA button to `/login`), features section, glass-morphism styling
    - Publicly accessible, no auth required
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 10.2 Create Login Page
    - Create `src/app/login/page.tsx` with email/password form, error display, "Forgot Password" link
    - No signup option
    - On success, redirect to `/dashboard`
    - On failure, show error message
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 10.3 Create GlassCard reusable component
    - Create `src/components/GlassCard.tsx` — wrapper applying glass-morphism styling
    - _Requirements: 12.2_

- [x] 11. Implement Dashboard page and ActionCard component
  - [x] 11.1 Create ActionCard component
    - Create `src/components/ActionCard.tsx` displaying action name, DayBadges, status, toggle, "Run Now" button, edit/delete controls
    - Paused actions should have visually distinct styling (muted, paused label)
    - _Requirements: 3.2, 3.3, 7.1, 7.6, 8.1_

  - [x] 11.2 Create DayBadge component
    - Create `src/components/DayBadge.tsx` — single-letter day indicator with tooltip showing full day name
    - _Requirements: 3.2, 3.3_

  - [x] 11.3 Create ConfirmDialog component
    - Create `src/components/ConfirmDialog.tsx` — reusable confirmation modal for destructive actions
    - _Requirements: 6.1_

  - [x] 11.4 Create Dashboard page
    - Create `src/app/dashboard/page.tsx`
    - Fetch actions via `/api/actions`, render ActionCard grid
    - Empty state with prompt to create first action
    - "Create New Action" button navigating to `/dashboard/new`
    - Logout button
    - _Requirements: 3.1, 3.4, 3.5, 2.8_

  - [x] 11.5 Write property test: Dashboard renders all actions
    - **Property 2: Dashboard renders all actions with correct data**
    - Create `tests/property/dashboard-rendering.property.test.ts`
    - For any set of actions, dashboard renders one card per action with correct name, days, status
    - **Validates: Requirements 3.1, 3.2**

  - [x] 11.6 Write property test: Paused action visual indication
    - **Property 10: Paused action visual indication**
    - For any paused action, the rendered card should have a visual indicator
    - **Validates: Requirements 7.6**

- [x] 12. Implement Action Form (create and edit)
  - [x] 12.1 Create ScriptEditor component
    - Create `src/components/ScriptEditor.tsx` — code text area for pasting JS, with file upload (.js) option
    - _Requirements: 4.2_

  - [x] 12.2 Create SchedulePicker component
    - Create `src/components/SchedulePicker.tsx` — seven day checkboxes, time picker (H:M AM/PM), timezone dropdown defaulting to local timezone
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 12.3 Create ActionForm page (create and edit modes)
    - Create `src/app/dashboard/new/page.tsx` for create mode
    - Create `src/app/dashboard/[id]/edit/page.tsx` for edit mode (pre-fill from API)
    - Client-side validation: require name, script, at least one day, valid time
    - On submit, POST or PUT to API route; show validation errors or API errors
    - _Requirements: 4.1, 4.8, 5.1_

  - [x] 12.4 Write property test: Form validation rejects incomplete submissions
    - **Property 4: Form validation rejects incomplete submissions**
    - For any form submission with missing required fields, validation errors should appear
    - **Validates: Requirements 4.8**

  - [x] 12.5 Write property test: Edit form pre-fill correctness
    - **Property 6: Edit form pre-fill correctness**
    - Create `tests/property/dashboard-rendering.property.test.ts` (or add to existing)
    - For any existing action, edit form fields should match stored values
    - **Validates: Requirements 5.1**

- [x] 13. Implement Run History page
  - [x] 13.1 Create RunHistoryEntry component
    - Create `src/components/RunHistoryEntry.tsx` — displays timestamp, status badge, expandable output
    - _Requirements: 9.2_

  - [x] 13.2 Create Run History page
    - Create `src/app/dashboard/[id]/history/page.tsx`
    - Fetch runs from `/api/actions/[id]/runs` with pagination
    - Status filter dropdown (all, success, fail)
    - _Requirements: 9.1, 9.4, 9.5_

  - [x] 13.3 Write property test: Run history entries display required fields
    - **Property 12: Run history entries display required fields**
    - Create `tests/property/run-history.property.test.ts`
    - For any RunEntry, rendered display includes timestamp, status, and output
    - **Validates: Requirements 9.1, 9.2**

  - [x] 13.4 Write property test: Run history filter correctness
    - **Property 13: Run history filter correctness**
    - For any set of run entries and any filter, displayed entries match the filter
    - **Validates: Requirements 9.4**

- [x] 14. Checkpoint - All pages and components implemented
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Global styling, error handling, and polish
  - [x] 15.1 Set up global styles and layout
    - Configure `src/app/layout.tsx` with consistent color scheme, font, and glass-morphism CSS variables
    - Add toast notification system for API errors and success feedback
    - Add smooth transitions and subtle animations for state changes
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [x] 15.2 Add responsive layout support
    - Ensure dashboard grid, forms, and history page are usable on desktop and tablet
    - _Requirements: 12.4_

  - [x] 15.3 Add error handling for GitHub connection issues
    - Display persistent banner on dashboard when GitHub repo is inaccessible or token is invalid
    - Handle 401, 4xx/5xx, and network errors with appropriate toast messages
    - _Requirements: 11.5, 12.5_

- [x] 16. Final checkpoint - Full integration verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All API calls from the client go through Next.js API routes — no direct external service calls
- GitHub-first transactional pattern: GitHub commit before Supabase write on all mutations
