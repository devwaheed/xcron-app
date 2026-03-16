# Requirements Document

## Introduction

A cron job builder application that provides an admin-only dashboard for managing scheduled JavaScript actions. The application uses a Next.js frontend hosted on Vercel, Supabase for authentication and job configuration storage, and GitHub as the execution backend. Admins configure actions through a clean, modern UI. All external API calls are routed through Next.js API routes — the client never communicates directly with external services. Run history is fetched from GitHub's existing execution logs rather than stored separately.

## Glossary

- **App**: The cron job builder Next.js web application
- **Admin**: The single authenticated user who manages actions
- **Dashboard**: The main application page displayed after login, showing all configured actions
- **Action**: A scheduled task consisting of a JS script, a recurring schedule (days + time + timezone), and execution configuration. Each action maps to one automated execution unit.
- **Script**: A JavaScript file provided by the Admin, either pasted or uploaded, that gets executed on schedule
- **Schedule**: The combination of selected weekdays, a run time (hours, minutes, AM/PM), and a timezone defining when an Action executes
- **Run_History**: The execution log of past Action runs, fetched from the execution backend's existing history API
- **API_Route**: A Next.js server-side API route that proxies all calls to external services (Supabase, GitHub) so the client never calls external APIs directly
- **GitHub_Bridge**: The server-side module (accessed via API_Routes) that communicates with the GitHub API to manage scripts and workflow configurations in the repository
- **Landing_Page**: The public-facing page highlighting the application's features
- **Login_Page**: The authentication page where the Admin enters credentials
- **Supabase_Auth**: The Supabase authentication service used for admin login and password reset
- **Action_Card**: A UI component on the Dashboard representing a single configured Action
- **Day_Badge**: A compact badge on the Action_Card showing an abbreviated day label (e.g., "M", "T", "W")

## Requirements

### Requirement 1: Landing Page

**User Story:** As a visitor, I want to see a landing page that highlights the cron job builder's features, so that I understand what the application offers before logging in.

#### Acceptance Criteria

1. THE Landing_Page SHALL display a hero section with a headline, subtitle, and a call-to-action button linking to the Login_Page
2. THE Landing_Page SHALL display a features section describing the key capabilities of the App (scheduling flexibility, script execution, run history monitoring)
3. THE Landing_Page SHALL apply a glass-morphism visual style consistent with a clean, modern Apple-inspired design
4. THE Landing_Page SHALL be publicly accessible without authentication
5. THE Landing_Page SHALL NOT expose or reference any underlying technical infrastructure or implementation details

### Requirement 2: Admin Authentication

**User Story:** As an admin, I want to log in securely with my credentials, so that I can access the action management dashboard.

#### Acceptance Criteria

1. THE Login_Page SHALL display an email and password input form
2. THE Login_Page SHALL NOT display a signup or registration option
3. WHEN the Admin submits valid credentials, THE App SHALL authenticate the Admin via an API_Route and redirect the Admin to the Dashboard
4. WHEN the Admin submits invalid credentials, THE Login_Page SHALL display an error message indicating authentication failure
5. THE Login_Page SHALL display a "Forgot Password" link
6. WHEN the Admin clicks "Forgot Password" and submits a valid email, THE App SHALL trigger a password reset email via an API_Route using the Supabase_Auth built-in email reset flow
7. WHILE the Admin is not authenticated, THE App SHALL redirect all Dashboard and action management routes to the Login_Page
8. WHEN the Admin clicks "Log Out" on the Dashboard, THE App SHALL end the session via an API_Route and redirect to the Login_Page

### Requirement 3: Dashboard Action Listing

**User Story:** As an admin, I want to see all my configured actions on the dashboard, so that I can monitor and manage them at a glance.

#### Acceptance Criteria

1. WHEN the Admin navigates to the Dashboard, THE Dashboard SHALL fetch the list of all configured Actions via an API_Route and display them as Action_Cards
2. THE Action_Card SHALL display the Action name, Day_Badges for each selected day (e.g., "M", "F"), and current status (active or paused)
3. WHEN the Admin hovers over the Day_Badges on an Action_Card, THE Action_Card SHALL display a tooltip showing the full schedule details: selected day names, scheduled time (with AM/PM), and timezone
4. WHEN no Actions are configured, THE Dashboard SHALL display an empty state message with a prompt to create the first Action
5. THE Dashboard SHALL display a "Create New Action" button that navigates to the action creation form

### Requirement 4: Action Creation

**User Story:** As an admin, I want to create a new action by providing a script and configuring a schedule, so that the script runs automatically on the defined schedule.

#### Acceptance Criteria

1. THE App SHALL display an action creation form with fields for: Action name, script input, day selection, time selection, and timezone selection
2. THE App SHALL allow the Admin to provide a script by pasting JavaScript code into a text editor or by uploading a .js file
3. THE App SHALL display seven checkboxes representing each day of the week (Monday through Sunday) for schedule configuration
4. THE App SHALL display a time picker for selecting the run time in hours, minutes, and AM/PM format
5. THE App SHALL display a timezone selector defaulting to the Admin's local timezone
6. WHEN the Admin submits a valid action creation form, THE App SHALL send the configuration to an API_Route which stores the Action configuration in Supabase
7. WHEN the Admin submits a valid action creation form, THE API_Route SHALL invoke the GitHub_Bridge to commit the Script and generated workflow configuration to the configured GitHub repository
8. IF the Admin submits the action creation form with missing required fields, THEN THE App SHALL display validation errors indicating which fields are required
9. IF the API_Route fails to commit to the GitHub repository, THEN THE App SHALL display an error message and SHALL NOT save the Action configuration to Supabase

### Requirement 5: Action Editing

**User Story:** As an admin, I want to edit an existing action's script or schedule, so that I can update actions without recreating them.

#### Acceptance Criteria

1. WHEN the Admin selects an Action for editing, THE App SHALL display the action creation form pre-filled with the existing Action configuration
2. WHEN the Admin submits an updated Action, THE API_Route SHALL update the Action configuration in Supabase
3. WHEN the Admin submits an updated Action, THE API_Route SHALL invoke the GitHub_Bridge to update the Script and workflow configuration in the GitHub repository
4. IF the API_Route fails to update the GitHub repository, THEN THE App SHALL display an error message and SHALL NOT update the Action configuration in Supabase

### Requirement 6: Action Deletion

**User Story:** As an admin, I want to delete an action, so that I can remove actions that are no longer needed.

#### Acceptance Criteria

1. WHEN the Admin initiates deletion of an Action, THE App SHALL display a confirmation dialog before proceeding
2. WHEN the Admin confirms deletion, THE API_Route SHALL remove the corresponding Script and workflow configuration from the GitHub repository via the GitHub_Bridge
3. WHEN the Admin confirms deletion, THE API_Route SHALL remove the Action configuration from Supabase
4. IF the API_Route fails to remove files from the GitHub repository, THEN THE App SHALL display an error message and SHALL NOT remove the Action configuration from Supabase

### Requirement 7: Action Pause and Resume

**User Story:** As an admin, I want to pause and resume actions without deleting them, so that I can temporarily stop an action and restart it later.

#### Acceptance Criteria

1. THE Action_Card SHALL display a toggle control to pause or resume the Action
2. WHEN the Admin pauses an active Action, THE API_Route SHALL invoke the GitHub_Bridge to disable the corresponding workflow in the GitHub repository
3. WHEN the Admin pauses an active Action, THE API_Route SHALL update the Action status to "paused" in Supabase
4. WHEN the Admin resumes a paused Action, THE API_Route SHALL invoke the GitHub_Bridge to re-enable the corresponding workflow in the GitHub repository
5. WHEN the Admin resumes a paused Action, THE API_Route SHALL update the Action status to "active" in Supabase
6. WHILE an Action is paused, THE Action_Card SHALL visually indicate the paused state

### Requirement 8: Manual Action Trigger

**User Story:** As an admin, I want to manually trigger an action to run immediately, so that I can test or execute an action outside its regular schedule.

#### Acceptance Criteria

1. THE Action_Card SHALL display a "Run Now" button
2. WHEN the Admin clicks "Run Now", THE API_Route SHALL invoke the GitHub_Bridge to trigger the corresponding workflow using the workflow dispatch mechanism
3. WHEN the Admin clicks "Run Now", THE App SHALL display a confirmation that the manual run has been triggered
4. IF the API_Route fails to trigger the workflow, THEN THE App SHALL display an error message

### Requirement 9: Run History

**User Story:** As an admin, I want to view the execution history of each action, so that I can monitor success and failure of past runs.

#### Acceptance Criteria

1. WHEN the Admin selects an Action to view its history, THE App SHALL fetch and display a paginated list of Run_History entries via an API_Route
2. THE Run_History entry SHALL display the execution timestamp, status (success or fail), and execution output or error message
3. THE API_Route SHALL fetch Run_History from the execution backend's existing workflow run logs (GitHub Actions run history API)
4. THE App SHALL provide a filter to show Run_History entries by status (all, success, fail)
5. THE App SHALL display a maximum of 100 Run_History entries per Action

### Requirement 10: Workflow Configuration Generation

**User Story:** As an admin, I want the app to automatically generate the correct execution configuration from my action settings, so that I do not have to configure anything manually.

#### Acceptance Criteria

1. THE GitHub_Bridge SHALL generate a valid execution configuration file for each Action
2. THE execution configuration SHALL contain a cron schedule expression that matches the Action's configured days, time (hours, minutes, AM/PM), and timezone
3. THE execution configuration SHALL include a manual dispatch trigger to support the "Run Now" feature
4. THE execution configuration SHALL set up a step that executes the associated Script using Node.js
5. THE execution configuration SHALL include setup steps for installing dependencies (including Puppeteer support)

### Requirement 11: GitHub Repository Integration

**User Story:** As an admin, I want the app to manage scripts and execution configurations in my GitHub repository, so that all action artifacts are version-controlled.

#### Acceptance Criteria

1. THE App SHALL store the GitHub repository owner, repository name, and a personal access token in server-side environment configuration (not exposed to the client)
2. THE GitHub_Bridge SHALL commit Script files to a designated scripts directory in the configured repository
3. THE GitHub_Bridge SHALL commit execution configuration files to the .github/workflows directory in the configured repository
4. WHEN committing files, THE GitHub_Bridge SHALL use the GitHub REST API with the configured personal access token for authentication
5. IF the configured repository is inaccessible or the token is invalid, THEN THE App SHALL display an error message on the Dashboard indicating the connection issue
6. All GitHub API calls SHALL be made exclusively from API_Routes on the server side

### Requirement 12: UI Design and Experience

**User Story:** As an admin, I want a clean, modern, and intuitive interface, so that managing actions is efficient and pleasant.

#### Acceptance Criteria

1. THE App SHALL use a consistent modern color scheme across all pages
2. THE App SHALL apply glass-morphism (frosted glass) visual effects on card and panel components
3. THE App SHALL use smooth transitions and subtle animations for state changes (loading, toggling, navigation)
4. THE App SHALL be responsive and usable on desktop and tablet screen sizes
5. THE App SHALL provide clear visual feedback for all user actions (form submissions, toggles, deletions, errors)
6. THE App SHALL follow a minimal-step, guided interaction pattern for action creation and editing

### Requirement 13: Workflow File Serialization Round-Trip

**User Story:** As a developer, I want the workflow file generation to be reliable, so that generated configuration files are always valid and consistent.

#### Acceptance Criteria

1. THE GitHub_Bridge SHALL generate execution configuration files that are valid YAML parseable by standard YAML parsers
2. FOR ALL valid Action configurations, generating an execution configuration and then parsing the cron expression back into a schedule configuration SHALL produce an equivalent schedule to the original Action configuration (round-trip property)
3. IF an Action configuration contains an invalid combination of schedule parameters, THEN THE App SHALL reject the configuration before generating an execution configuration
