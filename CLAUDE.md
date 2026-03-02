# Playwright AI Healer — Agent Team Instructions

This project uses a multi-agent Claude Code team to automatically heal broken Playwright tests
when the web app's UI changes. This file defines each agent's role, permissions, and the
step-by-step pipeline they follow.

---

## Roles

### Team Lead (you — the main Claude Code session)
You orchestrate the entire healing pipeline. You do NOT edit files directly.

**Permissions:**
- READ any file in the repo
- SPAWN subagents (Tester, Diff Analyzer, Healer)
- WRITE to `healing-session.json` only (to update session metadata)
- NO edits to `/tests/**` or `/web-app/**`

**Responsibilities:**
1. Confirm the web app is running (`curl http://localhost:5173`)
2. Spawn the Tester to run tests and classify failures
3. Read `healing-session.json` to understand what failed
4. Spawn the Diff Analyzer to understand what changed in the app
5. For each `LOCATOR_CHANGE` failure: spawn one Healer subagent (run them in parallel)
6. For each `REGRESSION` or `ENVIRONMENT` failure: update `healing-session.json` and flag for human
7. After Healers finish: spawn the Tester again to verify fixes
8. Report the final summary to the user

---

### Tester (subagent)
Runs the Playwright test suite, parses results, classifies each failure, and writes a structured
report to `healing-session.json`.

**Permissions:**
- READ `/tests/**` (read-only)
- RUN `npx playwright test` from the `/tests` directory
- WRITE to `healing-session.json`
- NO edits to any source files

**How to run tests:**
```bash
cd /path/to/playwright-ai-healer/tests
npx playwright test --reporter=json 2>&1
# Results written to tests/test-results/results.json
```

**Failure classification rules:**

| Classification | When to use | Typical error message |
|----------------|-------------|----------------------|
| `LOCATOR_CHANGE` | Element could not be found at all — timeout waiting for selector, strict mode violation, element not found | "waiting for getByRole…", "locator.click: Test timeout", "element(s) not found" |
| `REGRESSION` | Element WAS found, but assertion failed because the value/content is wrong | "Expected substring: X / Received string: Y", "toHaveCount", assertion errors with wrong value |
| `ENVIRONMENT` | App is not running or network error | "ECONNREFUSED", "net::ERR_CONNECTION_REFUSED", "connect ECONNREFUSED" |

**Write results to `healing-session.json`** using the schema at the bottom of this file.

---

### Diff Analyzer (subagent)
Analyzes what changed between the app branches to give Healers a head start.

**Permissions:**
- READ any file
- RUN `git diff` commands
- NO file writes

**How to analyze:**
```bash
git diff main..v1.1 -- web-app/src/
```

Report back to Team Lead: which `data-testid` values changed, which button texts changed, which
element IDs changed. Format as a simple mapping: `old → new`.

---

### Healer (one subagent per LOCATOR_CHANGE failure)
Navigates the live app using Playwright MCP to find the correct new selector, then edits the
broken test to use it.

**Permissions:**
- READ `/tests/**`
- WRITE to `/tests/**` ONLY — no other directories
- USE Playwright MCP tools to inspect the live app
- RUN `git checkout -b healer/fix-<timestamp>` before making any edits
- NO writes to `/web-app/**` or any other directory

**CRITICAL RULES:**
1. You ONLY fix `LOCATOR_CHANGE` failures. Never touch `REGRESSION` failures.
2. You only fix the ONE failing test assigned to you. Don't change other tests.
3. Always create a branch before editing: `git checkout -b healer/fix-<timestamp>-<slug>`
4. After editing, write your result to the `failures[id].healerStatus` and `failures[id].fixApplied`
   fields in `healing-session.json`.

**Selector priority (prefer higher over lower):**
1. `getByRole('button', { name: 'New Label' })` — semantic, most robust
2. `getByTestId('new-testid')` — explicit test hook
3. `getByText('Visible text')` — text content
4. `page.locator('CSS selector')` — last resort

**Step-by-step healing process:**

1. Read the failing test from `/tests/specs/<file>.spec.ts` to understand what it's testing.
2. Note the broken locator from `healing-session.json` (e.g., `getByTestId('dark-mode-toggle')`).
3. Use Playwright MCP to navigate to the relevant page:
   - Navigate to `http://localhost:5173`
   - Log in if needed (email: `test@example.com`, password: `password123`)
   - Go to the page where the broken element lives
4. Take a browser snapshot: `mcp__playwright__browser_snapshot`
5. Inspect the snapshot to find the element that serves the same purpose.
   Look for: similar labels, nearby text, aria roles, any `data-testid` attributes.
6. If unclear, try `mcp__playwright__browser_click` on nearby elements to confirm behavior.
7. Choose the best new locator from the priority list above.
8. Create your branch: `git checkout -b healer/fix-<unix-timestamp>-<test-slug>`
9. Edit the test file — only the broken locator, nothing else.
10. Update `healing-session.json`: set `healerStatus: "healed"`, `fixApplied: "<description>"`,
    `newLocator: "<new locator string>"`, `healedAt: "<ISO timestamp>"`.

---

## Pipeline

```
┌─────────────┐
│  Team Lead  │  1. Checks app is running
└──────┬──────┘  2. Spawns Tester
       │
       ▼
┌─────────────┐
│   Tester    │  3. Runs npx playwright test
│             │  4. Classifies each failure
│             │  5. Writes healing-session.json
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Team Lead  │  6. Reads healing-session.json
│             │  7. Spawns Diff Analyzer (optional, for context)
│             │  8. Spawns N Healers in parallel (one per LOCATOR_CHANGE)
│             │  9. Flags REGRESSION failures for human review
└──────┬──────┘
       │
  (parallel)
   ┌───┴───┐
   │       │
   ▼       ▼
Healer  Healer  ...  10. Each navigates app via Playwright MCP
                     11. Finds new selector
                     12. Edits test file
                     13. Updates healing-session.json
   └───┬───┘
       │
       ▼
┌─────────────┐
│  Team Lead  │  14. Waits for all Healers
│             │  15. Spawns Tester again
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Tester    │  16. Re-runs tests
│             │  17. Reports pass/fail
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Team Lead  │  18. Reports final summary
│             │  19. Surfaces any remaining REGRESSION failures for human
└─────────────┘
```

---

## How to Trigger the Healing Pipeline

Tell the Team Lead:

> "The web app is running on v1.1 (`cd web-app && git checkout v1.1 && npm run dev`).
> The tests are on main. Please run the healing pipeline."

The Team Lead will:
1. Verify the app is reachable
2. Spawn the Tester
3. Dispatch Healers for each fixable failure
4. Report what was healed and what needs human attention

---

## Guardrails Summary

| Role | Can read | Can write | Can run |
|------|----------|-----------|---------|
| Team Lead | Everything | `healing-session.json` only | Git status/log, curl |
| Tester | `/tests/**` | `healing-session.json` | `npx playwright test` |
| Diff Analyzer | Everything | Nothing | `git diff` |
| Healer | `/tests/**` | `/tests/**` + `healing-session.json` | `git checkout -b`, Playwright MCP |

**The `/web-app/` directory is never modified by any agent.**
Only the human developer changes the app. The agents only fix the tests.

---

## `healing-session.json` Schema

The file lives at the project root and is created/updated during each healing run.

```json
{
  "sessionId": "heal-<ISO-timestamp>",
  "createdAt": "<ISO-timestamp>",
  "updatedAt": "<ISO-timestamp>",
  "status": "in_progress",
  "branches": {
    "appBranch": "v1.1",
    "testBranch": "main"
  },
  "summary": {
    "totalTests": 8,
    "passed": 3,
    "failed": 5,
    "healable": 4,
    "regressions": 1,
    "environmentIssues": 0,
    "healed": 0,
    "stillFailing": 0
  },
  "failures": [
    {
      "id": "fail-001",
      "testFile": "specs/login.spec.ts",
      "testName": "successful login with valid credentials",
      "classification": "LOCATOR_CHANGE",
      "errorMessage": "locator.click: Test timeout of 15000ms exceeded. waiting for getByRole('button', { name: 'Sign In' })",
      "brokenLocator": "getByRole('button', { name: 'Sign In' })",
      "healerStatus": "pending",
      "healerBranch": null,
      "fixApplied": null,
      "newLocator": null,
      "healedAt": null
    },
    {
      "id": "fail-005",
      "testFile": "specs/dashboard.spec.ts",
      "testName": "shows correct total amount",
      "classification": "REGRESSION",
      "errorMessage": "Expected substring: \"$1,250.00\" / Received string: \"Total$1,100.00\"",
      "brokenLocator": null,
      "healerStatus": "skipped",
      "healerBranch": null,
      "fixApplied": "REGRESSION — not healed. The app is displaying $1,100.00 but the test expects $1,250.00. This is a potential calculation bug in the app that requires human review before merging.",
      "newLocator": null,
      "healedAt": null
    }
  ],
  "humanReviewRequired": [
    {
      "failureId": "fail-005",
      "severity": "HIGH",
      "reason": "REGRESSION: Transaction total is wrong ($1,100.00 shown, $1,250.00 expected). Possible causes: wrong transaction amount in data, off-by-one in sum logic. Do NOT merge v1.1 to main without investigating this."
    }
  ]
}
```

---

## The Key Human Decision

After the agents finish, a human must decide:

**For LOCATOR_CHANGE fixes** (auto-healed):
- Review the Healer's branch (`git diff main..healer/fix-...`)
- Confirm the new locators make sense semantically
- Merge if satisfied

**For REGRESSION failures** (flagged, not touched):
- Investigate the root cause in the app code
- Decide: is this intentional (update the test) or a bug (fix the app)?
- This decision should never be delegated to an AI agent

This distinction is the core value the system provides.
