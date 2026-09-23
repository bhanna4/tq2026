---
name: fix-test
description: 'Debug and repair a failing Playwright test in this repo from real evidence (local test output/trace/report, or a failing GitHub Actions workflow run), making the smallest change that fixes the actual cause without hiding a real defect.'
category: testing
risk: safe
tags: [testing, qa, playwright, typescript, debugging, ci, github-actions]
---

# Fix Test

## Overview

Repair a failing UI or API Playwright test in this repo using the actual
failure evidence — local test output/trace/report, or the logs and uploaded
`playwright-report` artifact from a failing GitHub Actions run — rather than
guessing. Distinguish a test/Page-Object defect from a real application, API,
or CI-config defect before changing anything, and keep the fix to the smallest
change the evidence supports. This skill works on this repo's native
Playwright suite; it does not use Agent QA MCP tooling (no `agent-qa` server
is configured in this repo's `.mcp.json`).

## When to Use

- A Playwright test is failing locally or in CI and needs a root-cause fix.
- A test is flaky (passes/fails inconsistently across reruns).
- A specific GitHub Actions workflow run (run URL, run ID, or "the CI run on
  PR #N") failed and needs diagnosis and a fix — not just a locally reproduced
  failure.
- The `notify-self-heal` job in `.github/workflows/playwright.yml` posted a PR
  comment linking a failed run — that comment is a same-repo-branch-only
  trigger to bring the linked run into this session via Entry Point B, not an
  instruction to fix or push anything unattended.
- CI is red on `typecheck`, `lint`, `format:check`, or `npx playwright test`
  for an existing spec, Page Object, or API orchestrator.

## Preconditions

- Read `CLAUDE.md`'s Rules section before patching — a fix that reintroduces a
  rule violation (raw locators in a test, `any`) will pass the
  test but fail CI.
- When the failure is CI-only, pull the real run evidence (Entry Point B)
  before assuming it reproduces locally — CI runs on `ubuntu-latest` with
  `workers: 1` and `retries: 2` (`playwright.config.ts`), so a run can fail or
  pass differently than a local run.
- Confirm whether the fix might touch a test that mutates real state (GoRest
  create/update/delete) before rerunning it repeatedly.
- Never print or persist the value of `secrets.GOREST_TOKEN` even if it leaks
  into a log line — redact it in any report back to the user.

## Entry Point A: local reproduction

1. Reproduce and collect evidence:
   - `npx playwright test <file> -g "<test name>"` to isolate the failing test.
   - `npx playwright show-report` for the HTML report (trace, video, screenshots
     are captured for every run per `playwright.config.ts`).
   - Read the actual error: assertion mismatch, selector timeout, network/API
     error, or a TypeScript/lint failure blocking the run entirely.
2. Classify the failure before touching code:
   - **Selector/UI drift** — the app changed and a Page Object locator no
     longer matches. Fix: update the locator in the Page Object, following
     locator priority (`getByRole` > `getByLabel` > `getByText` >
     `getByTestId` > `getByTitle`/`getByAltText` > scoped CSS).
   - **Timing/flakiness** — intermittent failures across reruns. Prefer
     Playwright's built-in auto-waiting/web-first assertions over an added
     `waitForTimeout`; only add an explicit wait if the evidence shows a real
     race the framework's auto-waiting doesn't cover.
   - **Wrong assertion** — the test asserts something other than the behavior
     it claims to cover. Fix the assertion, not the app.
   - **Real product/API defect** — the app or GoRest response genuinely
     changed behavior. Do not rewrite the test to paper over it; report the
     defect and ask before "fixing" the test to match broken behavior.
   - **Lint/typecheck failure** — fix the actual violation (see CLAUDE.md
     Rules) rather than suppressing it (`// eslint-disable`, `as any`, etc.).
3. Apply the smallest change that accounts for the evidence, then verify per
   the shared **Apply and Verify** section below.

## Entry Point B: failing GitHub Actions run

Use this when the user points at a specific run (a run URL, run ID, or "the
CI run on PR #N") rather than a local failure. Prefer the `gh` CLI when
available; the `github` MCP tools (`mcp__github__get_commit`,
`mcp__github__list_workflow_runs`/run-log tools if listed, or `gh` under the
hood) work identically — use whichever surface is available in the session.

1. Identify the run: from a pasted URL/ID directly, or resolve it —
   `gh run list --workflow=playwright.yml --branch <branch>` or
   `gh pr checks <PR number>`.
2. Pull the job-level result and logs, without dumping the entire log blindly:
   - `gh run view <run-id>` for step-by-step pass/fail per job.
   - `gh run view <run-id> --log-failed` to get only the failing step's log —
     this is almost always `Typecheck`, `Lint (enforces locator and Page
Object Model rules)`, `Format check`, or `Run Playwright tests (UI + API
projects)` (see `.github/workflows/playwright.yml`).
3. If the failing step is `Run Playwright tests`, download the uploaded HTML
   report artifact for trace/video/screenshot evidence instead of guessing
   from the log alone:
   - `gh run download <run-id> -n playwright-report -D <scratch-dir>`, then
     inspect its contents (or `npx playwright show-report <scratch-dir>`
     locally) for the same trace/video/screenshot evidence a local run would
     produce.
4. Map the failing step to a category. Note that the `test` job in
   `.github/workflows/playwright.yml` already auto-fixes what it safely can
   before you're ever notified — it runs `eslint --fix` and `prettier --write`
   and pushes the result back to the PR branch when that clears lint/format,
   and it retries a failing `npx playwright test` up to twice more with
   `--last-failed` to absorb flakiness. If `notify-self-heal` fired at all,
   those mechanisms already failed to resolve it, so treat the failure as
   real, not as something a formatter or a retry would have caught:
   - `Typecheck` failing → this step has no auto-fix in CI; if a local
     `npm run typecheck` passes, the branch pushed to CI differs from the
     local working tree (uncommitted change, stale branch) — reconcile before
     treating it as a code defect.
   - `Lint` / `Format check` failing after CI already attempted
     `eslint --fix` / `prettier --write` → the remaining violation is
     unfixable by tooling (e.g. `no-explicit-any`, a raw locator in a test
     file) and needs an actual code change, not another format pass.
   - `Run Playwright tests` failing after CI already retried with
     `--last-failed` twice → this is a consistent failure, not flakiness;
     classify exactly as in Entry Point A step 2, using the downloaded
     report/trace instead of a local one.
   - A failure only under CI's `workers: 1`/`retries: 2` config that never
     reproduces locally with default settings → try
     `npx playwright test --workers=1 --retries=2 <file>` to match CI
     conditions before concluding it's environment-specific.
5. Reproduce locally with the same spec/project once the failing test is
   identified, then continue with the shared **Apply and Verify** section
   below.

## Apply and Verify

1. Apply the smallest change that accounts for the evidence:
   - Keep changes inside the failing test, its Page Object, or its API
     orchestrator method — don't refactor unrelated code.
   - Preserve Page Object Model boundaries and locator priority even when
     patching under time pressure.
   - If Entry Point B step 4 pointed at `.github/workflows/playwright.yml`
     itself (e.g. a misconfigured env var source — `secrets.*` vs `vars.*`
     per CLAUDE.md's env-var classification rule) rather than test code, fix
     the workflow file instead of the test.
2. Verify narrowly, then broadly:
   - Re-run the single fixed test: `npx playwright test <file> -g "<test name>"`.
   - Run `npm run typecheck` and `npm run lint` (and `npm run format:check` if
     the CI failure was there).
   - Per the Pre-push checklist in `CLAUDE.md`, run the fixed spec 3 times in a
     row (`--repeat-each=3`) and confirm all 3 pass before considering it fixed.

## Fix Rules

- Do not invent selectors, error messages, or log lines not present in the
  actual test output/trace/report, or in the pulled CI job log/artifact.
- Do not rewrite an assertion merely to make a test pass when the evidence
  shows a real application or API defect — report it instead.
- Do not reach for `--no-verify`, disabling a lint rule, or `as any` as a
  shortcut past a CI failure; fix the underlying issue.
- Do not touch unrelated tests, Page Objects, or config while fixing one
  failure.
- Always show the diff and get the user's explicit confirmation before
  pushing a fix commit — every time, not just once per session. Pulling
  logs/artifacts is read-only and safe by default; committing and pushing
  never is. This applies even when a fix was triggered by the
  `notify-self-heal` PR comment — that comment surfaces a failure, it does not
  pre-authorize a push.
- Do not re-run a downloaded CI job to re-trigger the workflow without the
  user's confirmation either.
- Never echo `secrets.GOREST_TOKEN` or other credential values from a pulled
  log into your report, even redacted-looking fragments.

## Verification

- The single previously-failing test passes.
- `npm run typecheck` and `npm run lint` pass (and `npm run format:check` when
  that was the failing CI step).
- The fixed spec passes 3 consecutive runs (`--repeat-each=3`) before pushing,
  per the Pre-push checklist.
- Report: root cause, files changed, verification command used, and any
  remaining uncertainty (e.g. "still intermittent under `--repeat-each=10`",
  or "only reproduces under CI's `workers: 1`").

## Limitations

- Entry Point A requires being able to reproduce the failure locally.
  Entry Point B requires `gh` (or equivalent GitHub API access) with
  permission to read the run's logs and artifacts for this repo.
- A CI-only failure that never reproduces locally, even matching CI's
  `workers: 1`/`retries: 2`, may be runner-specific (OS, browser version
  pinned by `npx playwright install --with-deps`, timing) — say so rather
  than guessing at a fix.
- Does not authorize changing production-facing GoRest data; treat
  create/update/delete reruns as state-mutating and confirm before repeating
  them.
- Does not authorize re-running the GitHub Actions workflow or pushing a fix
  on its own initiative — confirm with the user first.
- A passing narrow rerun does not replace the full suite or human review —
  this does not skip the Pre-push checklist in `CLAUDE.md`.
