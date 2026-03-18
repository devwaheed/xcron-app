# Requirements Document

## Introduction

xCron is a cron job scheduling platform built with Next.js, Tailwind CSS v4, and Supabase. The application currently uses ad-hoc styling with inline Tailwind classes, generic SVG icons, and no formal design system. This feature establishes a cohesive design system and brand identity for xCron as a startup product — including a design token system, custom iconography, brand assets, dark mode, a command palette, keyboard shortcuts, an onboarding flow, empty state illustrations, and a mobile-responsive dashboard.

## Glossary

- **Design_Token_Provider**: The React context provider that supplies design tokens (colors, spacing, typography, shadows, radii) to all components via CSS custom properties and Tailwind theme configuration
- **Icon_Library**: The module that exports a set of custom SVG icon components purpose-built for xCron's domain (scheduling, scripts, actions, status)
- **Theme_Engine**: The system that manages light and dark color schemes, persists user preference, and applies the correct token set to the document
- **Command_Palette**: The modal overlay activated by Cmd+K (Mac) or Ctrl+K (Windows/Linux) that provides fuzzy-searchable access to navigation, actions, and settings
- **Shortcut_Manager**: The module that registers, deregisters, and dispatches global keyboard shortcuts while respecting focus context (e.g., suppressing shortcuts when an input or CodeMirror editor is focused)
- **Onboarding_Flow**: The guided multi-step experience shown to first-time users that walks them through creating their first scheduled action using a template
- **Empty_State_View**: A component that renders an illustration and contextual call-to-action when a list or view contains no data
- **Brand_Asset_Set**: The collection of logo files, favicon, and Open Graph images used across the application and social sharing
- **Dashboard_Layout**: The responsive layout shell for the /dashboard route that adapts from mobile single-column to desktop multi-column grid

## Requirements

### Requirement 1: Design Token System

**User Story:** As a developer, I want a centralized design token system, so that all components use consistent spacing, colors, typography, shadows, and radii without duplicating magic values.

#### Acceptance Criteria

1. THE Design_Token_Provider SHALL define tokens for colors (primary, secondary, accent, success, warning, error, surface, and neutral scales), spacing (4px base unit scale from 0 to 96), typography (font families, sizes from xs to 4xl, weights, line heights), border radii (sm, md, lg, xl, 2xl, full), and shadows (sm, md, lg, xl)
2. THE Design_Token_Provider SHALL expose tokens as CSS custom properties on the `:root` element and as Tailwind CSS v4 `@theme` values
3. WHEN a token value is updated in the token definition file, THE Design_Token_Provider SHALL propagate the change to all components that reference the token without requiring per-component edits
4. THE Design_Token_Provider SHALL define separate token sets for light mode and dark mode color schemes
5. FOR ALL token names, parsing the token name then formatting it back to a string SHALL produce the original token name (round-trip property)

### Requirement 2: Custom Icon Library

**User Story:** As a designer, I want a custom icon set that reflects xCron's brand identity, so that the product has a distinctive visual language instead of generic SVGs.

#### Acceptance Criteria

1. THE Icon_Library SHALL provide icon components for at minimum: clock, calendar, play, pause, bolt, code, shield, chart, plus, edit, trash, chevron-right, chevron-down, check, x-close, search, command, settings, sun, moon, upload, external-link, and alert-triangle
2. WHEN an icon component is rendered, THE Icon_Library SHALL accept `size` (number, default 20), `color` (string, default "currentColor"), and `className` (string) props
3. THE Icon_Library SHALL render each icon as an inline SVG element with `aria-hidden="true"` by default
4. WHEN an `accessibleLabel` prop is provided, THE Icon_Library SHALL set `role="img"` and `aria-label` to the provided label instead of `aria-hidden`
5. FOR ALL icons in the Icon_Library, rendering an icon then reading its SVG `viewBox` attribute SHALL return "0 0 24 24"

### Requirement 3: Brand Assets

**User Story:** As a product owner, I want a proper logo, favicon, and Open Graph images, so that xCron has a professional brand presence across browsers and social media.

#### Acceptance Criteria

1. THE Brand_Asset_Set SHALL include an SVG logo component that renders the xCron logo mark and wordmark
2. THE Brand_Asset_Set SHALL include a favicon in ICO format at 32x32 pixels and a 180x180 PNG apple-touch-icon
3. THE Brand_Asset_Set SHALL include an Open Graph image at 1200x630 pixels in PNG format
4. WHEN the application metadata is rendered, THE layout SHALL reference the favicon, apple-touch-icon, and Open Graph image via the Next.js Metadata API
5. THE Brand_Asset_Set SHALL provide both light-background and dark-background variants of the logo SVG component

### Requirement 4: Dark Mode

**User Story:** As a user, I want to switch between light and dark color schemes, so that I can use xCron comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Theme_Engine SHALL support three modes: "light", "dark", and "system" (follows OS preference)
2. WHEN the user selects a theme mode, THE Theme_Engine SHALL persist the selection to localStorage under the key "xcron-theme"
3. WHEN the application loads, THE Theme_Engine SHALL apply the persisted theme preference before the first paint to prevent a flash of incorrect theme
4. WHILE the theme mode is set to "system", THE Theme_Engine SHALL listen for changes to the `prefers-color-scheme` media query and update the applied theme within 100 milliseconds
5. WHEN the theme changes, THE Theme_Engine SHALL toggle the `dark` class on the `<html>` element and swap the CSS custom property token set
6. IF no persisted theme preference exists, THEN THE Theme_Engine SHALL default to "system" mode
7. FOR ALL theme transitions, applying light mode then dark mode then light mode SHALL produce a visual state identical to the initial light mode state (round-trip property)

### Requirement 5: Command Palette

**User Story:** As a power user, I want a command palette accessible via Cmd+K, so that I can quickly navigate, search actions, and trigger operations without using the mouse.

#### Acceptance Criteria

1. WHEN the user presses Cmd+K (Mac) or Ctrl+K (Windows/Linux), THE Command_Palette SHALL open as a centered modal overlay with a search input auto-focused
2. WHEN the Command_Palette is open and the user presses Escape, THE Command_Palette SHALL close and return focus to the previously focused element
3. WHEN the user types in the Command_Palette search input, THE Command_Palette SHALL filter available commands using fuzzy matching and display results within 50 milliseconds
4. THE Command_Palette SHALL provide commands for: navigating to Dashboard, navigating to New Action, toggling theme, and searching actions by name
5. WHEN the user selects a command via Enter or click, THE Command_Palette SHALL execute the command and close the palette
6. WHEN the user presses ArrowUp or ArrowDown, THE Command_Palette SHALL move the highlighted command selection accordingly and scroll the selected item into view
7. WHILE a text input, textarea, or CodeMirror editor is focused, THE Shortcut_Manager SHALL suppress the Cmd+K shortcut to avoid conflicting with editor keybindings
8. THE Command_Palette SHALL trap focus within the modal while open, cycling between the search input and command list items

### Requirement 6: Global Keyboard Shortcuts

**User Story:** As a power user, I want keyboard shortcuts for common actions, so that I can operate xCron efficiently without reaching for the mouse.

#### Acceptance Criteria

1. THE Shortcut_Manager SHALL register the following global shortcuts: Cmd+K / Ctrl+K (open Command Palette), N (navigate to New Action from dashboard), T (toggle theme), and Escape (close any open modal or palette)
2. WHILE a text input, textarea, select, or contenteditable element is focused, THE Shortcut_Manager SHALL suppress single-key shortcuts (N, T) to prevent interference with typing
3. WHEN a registered shortcut is pressed, THE Shortcut_Manager SHALL execute the associated handler within 50 milliseconds
4. THE Shortcut_Manager SHALL provide a `useShortcut(key, handler, options)` hook that components can use to register page-specific shortcuts
5. IF a shortcut conflicts with a browser-native shortcut, THEN THE Shortcut_Manager SHALL not override the browser behavior

### Requirement 7: Onboarding Flow

**User Story:** As a first-time user, I want a guided onboarding experience, so that I can quickly understand how to create my first scheduled action.

#### Acceptance Criteria

1. WHEN a user with zero actions navigates to the dashboard for the first time, THE Onboarding_Flow SHALL display a welcome step with a brief explanation of xCron and a "Get Started" call-to-action
2. THE Onboarding_Flow SHALL present at least three action templates (e.g., "Health Check Ping", "Database Backup", "Daily Report") with pre-filled name, script, and schedule values
3. WHEN the user selects a template, THE Onboarding_Flow SHALL navigate to the New Action page with the template values pre-populated in the form fields
4. WHEN the user completes or dismisses the onboarding, THE Onboarding_Flow SHALL persist a flag to localStorage under the key "xcron-onboarding-complete" so the flow is not shown again
5. IF the user has previously completed onboarding (flag exists in localStorage), THEN THE Onboarding_Flow SHALL not display on subsequent visits
6. THE Onboarding_Flow SHALL include a "Skip" button on every step that dismisses the flow and marks it as complete

### Requirement 8: Empty State Illustrations

**User Story:** As a user, I want meaningful empty states with illustrations, so that blank screens feel intentional and guide me toward the next action.

#### Acceptance Criteria

1. WHEN the dashboard action list is empty and onboarding is complete, THE Empty_State_View SHALL display an illustration, a heading, a description, and a "Create Your First Action" call-to-action button
2. WHEN the run history for an action has no entries, THE Empty_State_View SHALL display an illustration, a heading, and a description indicating no runs have occurred
3. THE Empty_State_View SHALL accept `illustration`, `heading`, `description`, and an optional `action` (label + onClick) as props
4. THE Empty_State_View SHALL render the illustration as an inline SVG that respects the current theme colors
5. FOR ALL Empty_State_View instances, the illustration SVG SHALL have a `role="img"` attribute and an `aria-label` describing the illustration

### Requirement 9: Mobile-Responsive Dashboard

**User Story:** As a mobile user, I want the dashboard to be fully usable on small screens, so that I can manage my scheduled actions from my phone.

#### Acceptance Criteria

1. WHEN the viewport width is below 640px, THE Dashboard_Layout SHALL render action cards in a single-column stack
2. WHEN the viewport width is between 640px and 1024px, THE Dashboard_Layout SHALL render action cards in a two-column grid
3. WHEN the viewport width is above 1024px, THE Dashboard_Layout SHALL render action cards in a three-column grid
4. WHEN the viewport width is below 640px, THE Dashboard_Layout SHALL collapse the stats bar from a three-column grid to a horizontally scrollable row
5. WHEN the viewport width is below 640px, THE Dashboard_Layout SHALL display the header navigation as a compact layout with the "New Action" button showing only the plus icon
6. THE Dashboard_Layout SHALL ensure all interactive elements (buttons, links) have a minimum touch target size of 44x44 CSS pixels on viewports below 640px
7. WHEN the viewport width is below 640px, THE Command_Palette SHALL render as a full-width bottom sheet instead of a centered modal

### Requirement 10: Component Library Foundation

**User Story:** As a developer, I want a set of reusable, token-aware UI primitives, so that I can build new features with consistent styling and behavior.

#### Acceptance Criteria

1. THE Component Library SHALL provide the following primitives: Button (with variants: primary, secondary, ghost, danger), Input, Select, Badge (with variants: success, warning, error, neutral), Card, and Modal
2. WHEN a component is rendered, THE Component Library SHALL apply design tokens from the Design_Token_Provider for all visual properties (colors, spacing, radii, shadows, typography)
3. THE Button component SHALL accept `variant`, `size` (sm, md, lg), `loading`, and `disabled` props and render appropriate visual states for each combination
4. THE Modal component SHALL trap focus, close on Escape, close on backdrop click, and restore focus to the trigger element on close
5. THE Input component SHALL display validation error messages below the input when an `error` prop is provided
6. FOR ALL component variants, rendering a component with a given set of props then re-rendering with the same props SHALL produce identical DOM output (idempotence property)
