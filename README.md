# Playwright AI Healer

A demo showing a multi-agent Claude Code team that automatically heals broken Playwright tests
when a web app's UI changes — and knows when NOT to heal (regressions).

## What this demonstrates

When a developer renames selectors, updates button labels, or restructures the UI, tests break.
Most of those breaks are mechanical: the element still exists, its locator just changed.
An AI agent can find the new locator and fix the test — faster than a human, without judgment errors.

But not every failure is mechanical. Sometimes the app has a real bug (wrong value, missing data,
broken calculation). The agent team classifies failures and refuses to heal those — surfacing them
for human review instead.

```
main branch:    app + tests (all 8 pass)
v1.1 branch:    app with 4 locator renames + 1 calculation bug
                → 5 tests fail (4 healable, 1 regression)

AI healing:     4 tests auto-healed (new locators found via Playwright MCP)
                1 test left broken and flagged for human
```

## Architecture

```
Team Lead (main session)
  ├── Tester          → runs tests, classifies failures, writes healing-session.json
  ├── Diff Analyzer   → git diffs the app branch to give Healers context
  └── Healer × N      → one per LOCATOR_CHANGE, runs in parallel
                         uses Playwright MCP to inspect live app
                         edits /tests only, never touches /web-app
```

State is tracked in `healing-session.json` — updated live as agents work.
See `CLAUDE.md` for the full pipeline, role definitions, and guardrails.

## Prerequisites

- Node.js 18+
- npm

## Running the app

```bash
cd web-app
npm install
npm run dev
# App starts at http://localhost:5173
```

Login with: `test@example.com` / `password123`

## Running the tests

In a separate terminal (with the app running):

```bash
cd tests
npm install
npx playwright install chromium
npx playwright test
# All 8 tests should pass on main
```

## Triggering the AI healing workflow

1. Start the app on the broken branch:
   ```bash
   cd web-app
   git checkout v1.1
   npm run dev
   ```

2. Confirm tests fail (in a separate terminal):
   ```bash
   cd tests
   npx playwright test
   # 5 fail, 3 pass
   ```

3. Open a Claude Code session in the project root:
   ```bash
   claude
   ```

4. Tell the Team Lead:
   > "The web app is running on v1.1. Please run the healing pipeline."

   Claude Code will:
   - Spawn a Tester to classify the 5 failures
   - Spawn 4 parallel Healers (one per LOCATOR_CHANGE)
   - Leave the regression flagged for your review
   - Re-run tests to confirm 4 are now fixed

## Before / after

**Before healing (v1.1 branch):**
| Test | Status | Type |
|------|--------|------|
| Login: successful login | FAIL | LOCATOR_CHANGE — button says "Log In" not "Sign In" |
| Login: invalid credentials | FAIL | LOCATOR_CHANGE — same button |
| Dashboard: welcome heading | PASS | — |
| Dashboard: transaction rows | PASS | — |
| Dashboard: total amount | FAIL | REGRESSION — shows $1,100.00, expected $1,250.00 |
| Settings: dark mode toggle | FAIL | LOCATOR_CHANGE — testid renamed to `theme-toggle` |
| Settings: save display name | FAIL | LOCATOR_CHANGE — button now says "Save" |
| Navigation: between pages | PASS | — |

**After healing:**
| Test | Status | Notes |
|------|--------|-------|
| Login: successful login | PASS | Healer updated to `getByRole('button', { name: 'Log In' })` |
| Login: invalid credentials | PASS | Same fix |
| Dashboard: total amount | FAIL | Flagged for human — real calculation bug |
| Settings: dark mode toggle | PASS | Healer updated to `getByTestId('theme-toggle')` |
| Settings: save display name | PASS | Healer updated to `getByRole('button', { name: 'Save' })` |

## File structure

```
playwright-ai-healer/
├── CLAUDE.md                   # Agent team instructions, roles, guardrails
├── README.md
├── healing-session.json        # Created at runtime — tracks agent findings
├── web-app/                    # React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── App.tsx             # State-based router (no react-router)
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── DashboardPage.tsx
│       │   └── SettingsPage.tsx
│       └── components/
│           ├── NavBar.tsx
│           └── Toast.tsx
└── tests/                      # Playwright test suite
    ├── playwright.config.ts
    └── specs/
        ├── helpers/auth.ts     # Shared login() helper
        ├── login.spec.ts
        ├── dashboard.spec.ts
        ├── settings.spec.ts
        └── navigation.spec.ts
```
