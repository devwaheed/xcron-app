# Implementation Plan: Design System & Branding for xCron

## Overview

Build a complete design system and brand identity for xCron, starting from the token foundation and layering up through icons, theme engine, component library, and feature-level components (command palette, onboarding, empty states, mobile responsive layout). Each task builds on the previous — tokens feed into components, components feed into features.

## Tasks

- [x] 1. Design token system
  - [x] 1.1 Create the token definition file (`src/lib/design-tokens.ts`)
    - Define `ColorScale`, `TokenSet` interfaces
    - Export `lightTokens` and `darkTokens` with full color scales (primary, secondary, accent, success, warning, error, surface, neutral), spacing (4px base, 0–96), typography (font families, sizes xs–4xl, weights, line heights), radii (sm, md, lg, xl, 2xl, full), and shadows (sm, md, lg, xl)
    - Implement `tokensToCssProperties(tokens)` that flattens a `TokenSet` into `Record<string, string>` where every key starts with `--`
    - Implement `parseTokenName(name)` and `formatTokenName(parsed)` for round-trip token name parsing
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 1.2 Write property tests for design tokens
    - **Property 1: Token name round-trip** — `parseTokenName` then `formatTokenName` produces the original string
    - **Validates: Requirements 1.5**
    - **Property 2: Token sets structural parity** — every key path in `lightTokens` exists in `darkTokens` and vice versa
    - **Validates: Requirements 1.1, 1.4**
    - **Property 3: Token-to-CSS property generation** — `tokensToCssProperties` output keys all start with `--`, values are non-empty, count equals leaf values
    - **Validates: Requirements 1.2**

  - [x] 1.3 Update `globals.css` to use generated tokens
    - Replace existing `:root` CSS custom properties with the full light token set
    - Add `.dark` selector with the dark token set
    - Update `@theme inline` block to map tokens to Tailwind v4 utilities
    - _Requirements: 1.2, 1.3, 1.4_

- [x] 2. Custom icon library
  - [x] 2.1 Create icon components (`src/components/icons/index.ts`)
    - Define `IconProps` interface with `size` (default 20), `color` (default "currentColor"), `className`, and `accessibleLabel`
    - Implement all 23+ icon components: ClockIcon, CalendarIcon, PlayIcon, PauseIcon, BoltIcon, CodeIcon, ShieldIcon, ChartIcon, PlusIcon, EditIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon, CheckIcon, XCloseIcon, SearchIcon, CommandIcon, SettingsIcon, SunIcon, MoonIcon, UploadIcon, ExternalLinkIcon, AlertTriangleIcon
    - Each icon renders `<svg>` with `viewBox="0 0 24 24"`, `aria-hidden="true"` by default, `role="img"` + `aria-label` when `accessibleLabel` is provided
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 Write property tests for icon library
    - **Property 4: Icon rendering consistency** — for any icon, size, and color, the SVG has correct width/height/viewBox/stroke
    - **Validates: Requirements 2.2, 2.5**
    - **Property 5: Icon accessibility attributes** — without `accessibleLabel` → `aria-hidden="true"`; with label → `role="img"` + `aria-label`
    - **Validates: Requirements 2.3, 2.4**

- [x] 3. Brand assets
  - [x] 3.1 Create Logo component and static assets
    - Create `src/components/Logo.tsx` with `variant` ("light" | "dark"), `showWordmark`, and `className` props
    - Add `public/favicon.ico` (32×32), `public/apple-touch-icon.png` (180×180), `public/og-image.png` (1200×630) placeholder assets
    - Update `src/app/layout.tsx` metadata to reference favicon, apple-touch-icon, and OG image via Next.js Metadata API
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Theme engine
  - [x] 5.1 Implement theme logic (`src/lib/theme.ts`)
    - Implement `resolveTheme(mode, systemPrefersDark)` pure function
    - Implement `persistTheme(mode)` and `getPersistedTheme()` using localStorage key `xcron-theme`
    - Default to `"system"` when no persisted preference exists
    - Handle localStorage unavailability gracefully (fallback to system, no throw)
    - _Requirements: 4.1, 4.2, 4.6_

  - [x] 5.2 Create ThemeProvider component (`src/components/ThemeProvider.tsx`)
    - Create React context with `mode`, `resolved`, and `setMode`
    - Toggle `dark` class on `<html>` element when theme changes
    - Listen for `prefers-color-scheme` changes when mode is `"system"` and update within 100ms
    - Add blocking inline `<script>` in layout to prevent flash of incorrect theme on load
    - Wire ThemeProvider into `src/app/layout.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.3 Write property tests for theme engine
    - **Property 6: Theme persistence round-trip** — `persistTheme(mode)` then `getPersistedTheme()` returns the original mode
    - **Validates: Requirements 4.2**
    - **Property 7: Theme mode round-trip** — `resolveTheme("light", x)` → `resolveTheme("dark", x)` → `resolveTheme("light", x)` equals initial
    - **Validates: Requirements 4.7**

- [x] 6. Shortcut manager
  - [x] 6.1 Implement shortcut manager (`src/lib/shortcuts.ts`)
    - Implement `isEditableElement(el)` that returns `true` for input, textarea, select, contenteditable, and CodeMirror elements
    - Implement `useShortcut(key, handler, options)` hook that registers/deregisters on mount/unmount
    - Suppress single-key shortcuts (N, T) when editable element is focused
    - Allow meta-key shortcuts (Cmd+K / Ctrl+K) to fire regardless of focus unless in CodeMirror
    - Do not override browser-native shortcuts
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.2 Write property tests for shortcut manager
    - **Property 10: Editable element shortcut suppression** — `isEditableElement` returns `true` for input/textarea/select/contenteditable/CodeMirror, `false` for others
    - **Validates: Requirements 5.7, 6.2**

- [x] 7. Component library primitives
  - [x] 7.1 Create UI primitive components (`src/components/ui/`)
    - Implement `Button` with variants (primary, secondary, ghost, danger), sizes (sm, md, lg), loading, and disabled states
    - Implement `Input` with label, error display, and validation message rendering
    - Implement `Select` with options array, label, and error display
    - Implement `Badge` with variants (success, warning, error, neutral)
    - Implement `Card` with padding options (sm, md, lg)
    - Implement `Modal` with focus trapping, Escape close, backdrop click close, and focus restoration to trigger element
    - All components use design tokens via CSS custom properties
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 7.2 Write property tests for component library
    - **Property 14: Button variant and size rendering** — all variant/size/loading/disabled combos render without error, disabled attribute correct
    - **Validates: Requirements 10.3**
    - **Property 15: Input error display** — non-empty error string renders error text; empty/undefined error renders no error element
    - **Validates: Requirements 10.5**
    - **Property 16: Component rendering idempotence** — same props produce identical DOM output on re-render
    - **Validates: Requirements 10.6**

- [x] 8. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Command palette
  - [x] 9.1 Implement command palette (`src/components/ui/CommandPalette.tsx`)
    - Build fuzzy matching function (character-by-character sequential match with gap penalty)
    - Create `CommandPalette` component with search input, filtered command list, and keyboard navigation
    - Open via Cmd+K / Ctrl+K using `useShortcut`, close on Escape
    - Trap focus within modal (Tab/Shift+Tab cycling between search input and command items)
    - Provide commands: navigate to Dashboard, navigate to New Action, toggle theme, search actions by name
    - ArrowUp/ArrowDown moves selection, Enter/click executes command and closes palette
    - Restore focus to previously focused element on close
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 9.2 Write property tests for command palette
    - **Property 8: Fuzzy match correctness** — results contain only commands whose label has all query chars in sequential order
    - **Validates: Requirements 5.3**
    - **Property 9: Command palette keyboard navigation bounds** — selected index stays within [0, N-1] for any ArrowUp/ArrowDown sequence
    - **Validates: Requirements 5.6**

- [x] 10. Onboarding flow
  - [x] 10.1 Implement onboarding flow (`src/components/OnboardingFlow.tsx`)
    - Define `ACTION_TEMPLATES` array with 3 templates: "Health Check Ping", "Database Backup", "Daily Report" — each with pre-filled name, scriptContent, and schedule
    - Implement `isOnboardingComplete()` and `markOnboardingComplete()` using localStorage key `xcron-onboarding-complete`
    - Create `OnboardingFlow` component with welcome step, template selection, and skip button
    - Show only when user has zero actions and onboarding not previously completed
    - On template select, navigate to New Action page with pre-populated values
    - On skip or complete, persist completion flag
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 10.2 Write property tests for onboarding
    - **Property 11: Onboarding templates validity** — every template has non-empty name/description/scriptContent, valid schedule (days.length > 0, hour 1-12, minute 0-59, valid period)
    - **Validates: Requirements 7.2**
    - **Property 12: Onboarding completion persistence round-trip** — after `markOnboardingComplete()`, `isOnboardingComplete()` returns `true`
    - **Validates: Requirements 7.4**

- [x] 11. Empty state illustrations
  - [x] 11.1 Create empty state component (`src/components/ui/EmptyState.tsx`)
    - Implement `EmptyState` component accepting `illustration` ("no-actions" | "no-runs"), `heading`, `description`, and optional `action` (label + onClick)
    - Create inline SVG illustrations that use `currentColor` and CSS custom properties for theme awareness
    - Each illustration SVG has `role="img"` and `aria-label`
    - Integrate into dashboard page (replace current empty state) and run history page
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 11.2 Write property tests for empty state
    - **Property 13: Empty state rendering completeness** — heading, description, and illustration SVG with `role="img"` and non-empty `aria-label` are present
    - **Validates: Requirements 8.3, 8.5**

- [x] 12. Mobile-responsive dashboard
  - [x] 12.1 Update dashboard layout for responsive breakpoints
    - Action cards: single-column below 640px, two-column 640–1024px, three-column above 1024px
    - Stats bar: collapse to horizontally scrollable row below 640px
    - Header: compact layout with plus-icon-only "New Action" button below 640px
    - Ensure all interactive elements have minimum 44×44px touch targets on mobile
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 12.2 Make command palette render as bottom sheet on mobile
    - Add `useMediaQuery` hook to detect viewport below 640px
    - Render command palette as full-width bottom sheet instead of centered modal on mobile
    - _Requirements: 9.7_

- [x] 13. Integration and wiring
  - [x] 13.1 Wire all systems together
    - Register global shortcuts (N → New Action, T → toggle theme, Escape → close modals) in dashboard layout
    - Integrate command palette into dashboard layout with action search
    - Integrate onboarding flow into dashboard page (conditional on zero actions + not completed)
    - Replace inline SVG icons across all existing components with Icon Library components
    - Replace existing GlassCard, ConfirmDialog with token-aware Card and Modal from component library
    - Update landing page, login page, and dashboard to use design tokens and Logo component
    - _Requirements: 5.4, 6.1, 7.1, 7.5_

- [x] 14. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The token system is the foundation — all subsequent tasks depend on it
