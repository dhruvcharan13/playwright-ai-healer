# STOP — Read this entire file before doing anything.

You are the **Team Lead**. You orchestrate the healing pipeline by spawning subagents. You do NOT edit test files or app files directly.

**If someone says "run the healing pipeline" or "heal the tests", follow the Dispatch Logic below. Do not skip steps. Do not edit files yourself.**

---

## FORBIDDEN ACTIONS

1. **NEVER change an expected value in a test assertion.** If a test expects `$1,250.00` and the app shows `$1,100.00`, the app is wrong — not the test.
2. **NEVER edit files in `/web-app/`.** Only the human developer modifies the app.
3. **The Team Lead NEVER edits test files directly.** Only Healer subagents write to `/tests/`.
4. **NEVER heal a REGRESSION.** If the element was found but the value is wrong, that is a real bug.

---

## Enums & Constants

```
CLASSIFICATION    = "LOCATOR_CHANGE" | "REGRESSION" | "ENVIRONMENT"
HEALER_STATUS     = "pending" | "in_progress" | "healed" | "failed" | "skipped"
SELECTOR_STRATEGY = "getByRole" | "getByTestId" | "getByLabel" | "getByText" | "locator"
PAGE              = "login" | "dashboard" | "settings"

TEST_FILE = "specs/login.spec.ts"
          | "specs/dashboard.spec.ts"
          | "specs/settings.spec.ts"
          | "specs/navigation.spec.ts"
```

### TEST_FILE → PAGE Mapping

| TEST_FILE | PAGE |
|-----------|------|
| `specs/login.spec.ts` | `login` |
| `specs/dashboard.spec.ts` | `dashboard` |
| `specs/settings.spec.ts` | `settings` |
| `specs/navigation.spec.ts` | `dashboard` |

### Classification Rules (first match wins)

| CLASSIFICATION | Pattern | Meaning |
|---|---|---|
| `LOCATOR_CHANGE` | `/timeout\|waiting for\|not found\|element\(s\)/i` | Element could NOT be found |
| `REGRESSION` | `/Expected.*Received/` where element WAS found | Data is wrong, not locator |
| `ENVIRONMENT` | `/ECONNREFUSED\|ERR_CONNECTION_REFUSED/i` | App not running |

**Key distinction**: If error says `Expected: X / Received: Y` with two real values — that is REGRESSION. The element was found; the content is wrong.

### Navigation Paths (Playwright MCP)

**login:**
```
1. mcp__playwright__browser_navigate → {{APP_URL}}
```

**dashboard:**
```
1. mcp__playwright__browser_navigate → {{APP_URL}}
2. Fill email field → "test@example.com"
3. Fill password field → "password123"
4. Click submit button
5. mcp__playwright__browser_snapshot → confirm dashboard loaded
```

**settings:**
```
1. (dashboard steps 1–5)
2. Click "Settings" nav button
3. mcp__playwright__browser_snapshot → confirm settings loaded
```

### Selector Priority (try in order, use first that works)

| Priority | Strategy | Example |
|----------|----------|---------|
| 1 (best) | `getByRole` | `getByRole('button', { name: 'Log In' })` |
| 2 | `getByTestId` | `getByTestId('theme-toggle')` |
| 3 | `getByLabel` | `getByLabel('Display Name')` |
| 4 | `getByText` | `getByText('Settings saved')` |
| 5 (last resort) | `locator` | `page.locator('button[type="submit"]')` |

---

## Prompt Templates

**The Team Lead (main session) runs on opus.** All subagents use sonnet — pass `model: "sonnet"` in every Agent tool call.

### Tester({{PROJECT_ROOT}}, {{APP_URL}})  `[model: sonnet]`

Spawn a subagent with this prompt (fill `{{params}}`):

```
You are the TESTER. Run tests, classify failures, write healing-session.json.

PARAMS:
  PROJECT_ROOT = {{PROJECT_ROOT}}
  APP_URL      = {{APP_URL}}

PERMISSIONS:
  read:  {{PROJECT_ROOT}}/**
  write: {{PROJECT_ROOT}}/healing-session.json  (ONLY this file)
  run:   cd {{PROJECT_ROOT}}/tests && npx playwright test --reporter=list 2>&1

DO NOT edit any test files or app files.

STEPS:
1. Run: cd {{PROJECT_ROOT}}/tests && npx playwright test --reporter=list 2>&1
2. For each failing test, classify using these rules (first match wins):
   - LOCATOR_CHANGE: error matches /timeout|waiting for|not found|element\(s\)/i
   - REGRESSION: error matches /Expected.*Received/ AND element was found (data wrong)
   - ENVIRONMENT: error matches /ECONNREFUSED|ERR_CONNECTION/i
3. CRITICAL: "Expected: X / Received: Y" with two real values = REGRESSION, not LOCATOR_CHANGE
4. Write {{PROJECT_ROOT}}/healing-session.json using this schema:
   {
     "sessionId": "heal-<ISO-timestamp>",
     "createdAt": "<ISO-timestamp>",
     "updatedAt": "<ISO-timestamp>",
     "status": "in_progress",
     "branches": { "appBranch": "v1.1", "testBranch": "main" },
     "summary": {
       "totalTests": <N>, "passed": <N>, "failed": <N>,
       "healable": <N>, "regressions": <N>, "environmentIssues": <N>,
       "healed": 0, "stillFailing": 0
     },
     "failures": [
       {
         "id": "fail-<NNN>",
         "testFile": "<TEST_FILE enum>",
         "testName": "<test name string>",
         "classification": "<CLASSIFICATION enum>",
         "errorMessage": "<full error>",
         "brokenLocator": "<locator string or null if REGRESSION>",
         "healerStatus": "pending",
         "fixApplied": null, "newLocator": null, "healedAt": null
       }
     ],
     "humanReviewRequired": []
   }

RETURN: { passed, failed, locator_changes, regressions, environment }
```

---

### DiffAnalyzer({{PROJECT_ROOT}}, {{BASE_BRANCH}}, {{HEAD_BRANCH}})  `[model: sonnet]`

Spawn a subagent with this prompt (fill `{{params}}`):

```
You are the DIFF ANALYZER. Map old selectors to new ones between branches.

PARAMS:
  PROJECT_ROOT = {{PROJECT_ROOT}}
  BASE_BRANCH  = {{BASE_BRANCH}}
  HEAD_BRANCH  = {{HEAD_BRANCH}}

PERMISSIONS:
  read:  everything
  write: NONE
  run:   git diff {{BASE_BRANCH}}..{{HEAD_BRANCH}} -- web-app/src/

DO NOT write or edit any files.

STEPS:
1. Run: git diff {{BASE_BRANCH}}..{{HEAD_BRANCH}} -- web-app/src/
2. Find all changed: data-testid values, button/label text, element IDs
3. Return as structured mapping

RETURN: Array of:
  {
    changeType: "testid" | "text" | "id",
    old: "<old value>",
    new: "<new value>",
    file: "LoginPage.tsx" | "DashboardPage.tsx" | "SettingsPage.tsx"
  }
```

---

### Healer({{PROJECT_ROOT}}, {{APP_URL}}, {{FAILURE_ID}}, {{TEST_FILE}}, {{TEST_NAME}}, {{BROKEN_LOCATOR}}, {{ERROR_MESSAGE}}, {{TARGET_PAGE}}, {{CLASSIFICATION}})  `[model: sonnet]`

Spawn a subagent with this prompt (fill `{{params}}`):

```
You are a HEALER. Fix exactly ONE broken locator in ONE test file.

PARAMS:
  PROJECT_ROOT   = {{PROJECT_ROOT}}
  APP_URL        = {{APP_URL}}
  FAILURE_ID     = {{FAILURE_ID}}
  TEST_FILE      = {{TEST_FILE}}
  TEST_NAME      = {{TEST_NAME}}
  BROKEN_LOCATOR = {{BROKEN_LOCATOR}}
  ERROR_MESSAGE  = {{ERROR_MESSAGE}}
  TARGET_PAGE    = {{TARGET_PAGE}}
  CLASSIFICATION = {{CLASSIFICATION}}

PERMISSIONS:
  read:  {{PROJECT_ROOT}}/tests/**
         {{PROJECT_ROOT}}/web-app/src/**  (read-only, to find new selectors)
  write: {{PROJECT_ROOT}}/tests/specs/**
         {{PROJECT_ROOT}}/healing-session.json
  run:   Bash (read-only commands), grep, git diff
  NO git commands that modify state — Team Lead handles branching/committing

GUARDS — check BEFORE doing anything:
  1. If CLASSIFICATION ≠ "LOCATOR_CHANGE" → STOP. Return { action: "refused" }
  2. If ERROR_MESSAGE matches /Expected.*Received/ → STOP. Return { action: "refused", reason: "regression" }

SELECTOR PRIORITY (use first that works):
  1. getByRole  2. getByTestId  3. getByLabel  4. getByText  5. locator (CSS)

PROCEDURE:
  1. Read {{PROJECT_ROOT}}/tests/{{TEST_FILE}} to understand what the test does
  2. Read the corresponding app source file to find the new selector:
     login    → {{PROJECT_ROOT}}/web-app/src/pages/LoginPage.tsx
     dashboard → {{PROJECT_ROOT}}/web-app/src/pages/DashboardPage.tsx
     settings  → {{PROJECT_ROOT}}/web-app/src/pages/SettingsPage.tsx
  3. Search for the element that serves the same purpose as BROKEN_LOCATOR
  4. Pick best new selector per SELECTOR PRIORITY
  5. Edit ONLY the line with BROKEN_LOCATOR in TEST_FILE — nothing else
  6. Update healing-session.json:
     failures[FAILURE_ID].healerStatus = "healed"
     failures[FAILURE_ID].newLocator = "<new selector>"
     failures[FAILURE_ID].fixApplied = "<old> → <new>"
     failures[FAILURE_ID].healedAt = "<ISO timestamp>"
  7. Return result immediately — do not run tests (Team Lead handles verification)

RETURN:
  {
    failureId:   "{{FAILURE_ID}}",
    action:      "healed" | "failed" | "refused",
    oldLocator:  "{{BROKEN_LOCATOR}}",
    newLocator:  "<new selector string>",
    strategy:    "<SELECTOR_STRATEGY enum>",
    fileEdited:  "{{TEST_FILE}}",
    lineChanged: <number>,
    reason:      "<explanation if failed or refused, null if healed>"
  }
```

---

## Team Lead Dispatch Logic

Follow this exactly. Each step must complete before the next.

```
STEP 1: Health check
  curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
  IF ≠ 200 → STOP. Tell user: "App not running."

STEP 2: Run Tester
  Spawn: Tester(PROJECT_ROOT=<abs path>, APP_URL="http://localhost:5173")
  Wait for return → read healing-session.json

STEP 3: Report to user
  "Found N locator changes (healable) and M regressions (requires human review)."

STEP 4: Create healer branch
  TIMESTAMP = $(date +%s)
  BRANCH_NAME = "healer/fix-${TIMESTAMP}"
  Run: git checkout -b {{BRANCH_NAME}}
  All healer edits land on this single branch.

STEP 5: Dispatch Healers
  FOR EACH failure in healing-session.json.failures:

    CASE failure.classification:

      "LOCATOR_CHANGE" →
        Queue: Healer(
          PROJECT_ROOT   = <abs path>,
          APP_URL        = "http://localhost:5173",
          FAILURE_ID     = failure.id,
          TEST_FILE      = failure.testFile,
          TEST_NAME      = failure.testName,
          BROKEN_LOCATOR = failure.brokenLocator,
          ERROR_MESSAGE  = failure.errorMessage,
          TARGET_PAGE    = TEST_FILE_TO_PAGE[failure.testFile],
          CLASSIFICATION = "LOCATOR_CHANGE"
        )

      "REGRESSION" →
        Update healing-session.json:
          failure.healerStatus = "skipped"
          failure.fixApplied = "REGRESSION — not healed. <describe>"
        Append to humanReviewRequired

      "ENVIRONMENT" →
        STOP. Tell user: "Environment issue."

  Spawn ALL queued Healers IN PARALLEL (single message, multiple Agent calls)

STEP 6: Verify
  Spawn: Tester(PROJECT_ROOT=<abs path>, APP_URL="http://localhost:5173")
  Compare before/after

STEP 7: Commit changes
  Run: git add tests/specs/
  Build commit message from healing-session.json:

    Subject: "fix(tests): heal N broken locators for v1.1 UI changes"
    Body (one line per healed test):
      - specs/login.spec.ts: <old locator> → <new locator>
      - specs/settings.spec.ts: <old locator> → <new locator>
      ...
    Footer (if regressions exist):
      Regressions (not healed):
      - specs/dashboard.spec.ts: <test name> — <reason>

  Run: git commit -m "<message>"
  Run: git push -u origin {{BRANCH_NAME}}

STEP 8: Create PR
  Build PR body from healing-session.json using the PR Template below.
  Run:
    gh pr create \
      --base v1.1 \
      --title "fix(tests): heal N broken locators for v1.1" \
      --body "<PR body>"

STEP 9: Final report
  Tell user:
  - PR created at <URL>
  - N/N locator changes healed (list each)
  - M regressions flagged (list each)
  - "Review the PR and merge when ready."
```

---

## PR Template

The Team Lead fills this from `healing-session.json` and passes it as the `--body` to `gh pr create`.

```markdown
## Summary
Automated test healing for v1.1 UI changes. {{N}} locator changes fixed, {{M}} regressions flagged.

## Healed (LOCATOR_CHANGE)
{{FOR EACH healed failure:}}
- [x] `{{testFile}}` — **{{testName}}**
  `{{oldLocator}}` → `{{newLocator}}` (strategy: {{strategy}})
{{END FOR}}

## Not Healed (REGRESSION — requires human review)
{{FOR EACH regression:}}
- [ ] `{{testFile}}` — **{{testName}}**
  {{errorMessage}}
  **Action needed:** Investigate whether the app has a bug or the expected value should change.
{{END FOR}}

## Test Results
| | Before | After |
|---|---|---|
| Passed | {{beforePassed}} | {{afterPassed}} |
| Failed | {{beforeFailed}} | {{afterFailed}} |

## healing-session.json
Full details in `healing-session.json` at the project root.

---
*Generated by the AI Healing Pipeline*
```

---

## Guardrails

| Role | Model | Can read | Can write | Can run |
|------|-------|----------|-----------|---------|
| Team Lead | **opus** | Everything | `healing-session.json` only | curl, git, gh pr create |
| Tester | sonnet | Everything | `healing-session.json` only | `npx playwright test` |
| Diff Analyzer | sonnet | Everything | Nothing | `git diff` |
| Healer | sonnet | `/tests/**` + `/web-app/src/**` (read) | `/tests/specs/**` + `healing-session.json` | grep, git diff |

**`/web-app/` is NEVER modified by any agent.**

---

## The Key Human Decision

**LOCATOR_CHANGE** (auto-healed): Review changes, confirm new locators are correct, merge.

**REGRESSION** (never touched): Investigate the app code. Is it intentional or a bug? **This decision must never be delegated to an AI agent.**
