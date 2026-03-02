# Playwright AI Healer

AI agent team that auto-heals broken Playwright test selectors after UI changes — and refuses to heal real regressions.

`main`: 8/8 tests pass. `v1.1`: 5 fail (4 renamed selectors + 1 calculation bug). Agents fix the 4, flag the 1.

## Demo

```bash
# 1. Install
cd web-app && npm install && cd ../tests && npm install && npx playwright install chromium && cd ..

# 2. Start app on broken branch
cd web-app && git checkout v1.1 && npm run dev

# 3. Run tests (separate terminal) — 5 fail, 3 pass
cd tests && npx playwright test

# 4. Heal — MUST run from the project root (not /tests)
cd /path/to/playwright-ai-healer
claude
# > "The web app is running on v1.1. Run the healing pipeline."
```

**Important:** Run `claude` from the project root so it reads `CLAUDE.md`. Running from `/tests` will skip the agent pipeline and guardrails.

The agents will classify failures, spawn parallel healers for the 4 locator breaks, and leave the wrong-total regression for human review.

See [CLAUDE.md](CLAUDE.md) for agent roles, guardrails, and pipeline details.
