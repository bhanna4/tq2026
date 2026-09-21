# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Run all tests: `npx playwright test`
- Run a single test file: `npx playwright test tests/ui/search.spec.ts`
- Run a single test by name: `npx playwright test -g "has title"`
- Run only the UI tests: `npx playwright test --project=chromium`
- Run only the API tests: `npx playwright test --project=api`
- Run tests in headed mode (visible browser): `npx playwright test --headed`
- View the HTML test report after a run: `npx playwright show-report`
- Install/update Playwright browsers: `npx playwright install`
- Lint (enforces the rules below): `npm run lint`
- Typecheck: `npm run typecheck`

CI (`.github/workflows/playwright.yml`) runs `typecheck` and `lint` before `npx playwright test`, so any rule violation below fails the build, not just this file's guidance.

## Architecture

- `playwright.config.ts` — central Playwright configuration. Tests run against a single `chromium` browser project, `testMatch: '**/ui/**'`, plus an `api` project (no browser device, `baseURL: 'https://gorest.co.in'`, `testMatch: '**/api/**'`) for REST API tests. `baseURL` and `webServer` for the UI project are commented out, so UI tests currently navigate to absolute URLs directly rather than a local app. There is no global pre-authenticated storage state; tests that need a logged-in session opt into `fixtures/auth.fixture.ts`'s `authenticatedPage` fixture instead, described below.
- `tests/` — test specs (`testDir: './tests'`), named `*.spec.ts`, split by test type:
  - `tests/ui/` — browser tests. Files call only Page Object methods from `pages/`; they never query `page` locators directly (enforced by ESLint, see Rules).
  - `tests/api/` — REST API specs. Files call only `src/api/` orchestrator methods (e.g. `GoRestUser`) — never Playwright's `request` fixture directly.
- `fixtures/` — shared Playwright fixtures and constants (outside `tests/` so its `testMatch: '**/ui/**'` pattern never picks it up as a spec). `seed-account.ts` exports `generateSeedAccount(workerIndex)`, which builds a unique random `NewAccount` (username/email/password) per worker — no BearStore credentials are read from the environment. `auth.fixture.ts` exports a custom `test` (via `base.extend`) with a worker-scoped `workerStorageState` fixture that registers that seeded account once per worker via `RegisterPage` and captures the resulting `storageState`, and an `authenticatedPage` fixture — a `Page` from a fresh context loaded with that storage state — for tests that want an authenticated page. This replaces logging into a shared BearStore account: each worker gets its own freshly registered account, so parallel workers never share a cart/session.
- `pages/` — Page Object classes for UI tests, named `*.page.ts`. `pages/base.page.ts` exports `BasePage`, which feature page classes extend. `pages/playwright-home.page.ts` (`PlaywrightHomePage`) is a reference implementation; `pages/bear-store-home.page.ts` (`BearStoreHomePage`) backs `tests/ui/search.spec.ts`; `pages/register.page.ts` (`RegisterPage`) backs the seeded-account registration in `fixtures/auth.fixture.ts`; `pages/product.page.ts` (`ProductPage`) and `pages/cart.page.ts` (`CartPage`) back the BearStore product/cart flows.
- `src/types/` — DTOs/interfaces for external APIs, e.g. `src/types/gorest.ts` (GoRest `User`, `Post`, `Comment`, `Todo` and their create/update payload variants).
- `src/api/` — API client layer for the `api` Playwright project. `gorest-client.ts` (`GoRestClient`) wraps Playwright's `APIRequestContext` with the GoRest base path, bearer auth (`GOREST_TOKEN` env var), and response parsing. `gorest-user.ts` (`GoRestUser`) orchestrates `/users` CRUD calls on top of it; tests instantiate `GoRestUser` and call its methods, mirroring the Page Object pattern used for UI. Set `GOREST_TOKEN` (a personal GoRest API access token — never commit it) before running write operations (create/update/delete); reads work without it but are rate-limited more aggressively.
- `eslint.config.js` — ESLint flat config. Enforces `@typescript-eslint/no-explicit-any`, bans absolute XPath locators everywhere, and bans direct `page.locator`/`page.getBy*` calls inside `tests/ui/**/*.ts` via `no-restricted-syntax` (not applied to `tests/api/**/*.ts`, which has no `page` fixture to misuse).
- `tsconfig.json` — `strict: true` plus `noUncheckedIndexedAccess` and `noImplicitOverride`; `include` covers `tests/`, `pages/`, `fixtures/`, and `src/`.
- `.github/workflows/playwright.yml` — CI has two jobs on push/PR to `main`:
  - `test`: runs `typecheck` (no auto-fix — a real code change), then attempts a deterministic auto-fix pass (`eslint --fix`, `prettier --write`) before re-running `lint`/`format:check` as the actual gate. On a same-repo PR, if the auto-fix cleared the violations, the job commits and pushes the fix straight to the PR branch (`git push origin HEAD:${{ github.head_ref }}`) — this only fires for `github.event.pull_request.head.repo.full_name == github.repository`, never for fork PRs, and only ever touches lint/format-fixable issues, never test logic. It then runs `npx playwright test`, retrying with `--last-failed` up to twice more on failure to absorb flakiness (on top of `playwright.config.ts`'s own per-test `retries: 2`) — this is a blind retry, not a code fix, so a consistently-failing test still fails the job. Finally it uploads the HTML report as a build artifact. The only test-run env var is `GOREST_TOKEN`, from `secrets.GOREST_TOKEN` (a real credential — GitHub Actions secret); UI tests no longer read any BearStore credentials from the environment, since `fixtures/auth.fixture.ts` registers its own seeded account per worker instead of logging into a shared one.
  - `notify-self-heal`: runs only if `test` fails, only on a same-repo PR. Posts (or updates) a single PR comment linking the failed run, as the last-resort fallback once the automatic lint/format fix and test retries have already failed to resolve it. It does not fix anything itself — see the `fix-test` skill (`.claude/skills/fix-test/SKILL.md`) for the human-in-the-loop repair flow it points to.
- `.mcp.json` — configures three MCP servers available in this environment: `github` (GitHub Copilot MCP, for repo/PR/issue operations), `playwright` (browser automation, separate from the `@playwright/test` dependency used for the test suite itself), and `context7` (live library documentation lookup).

## Pre-push checklist

- Before pushing to GitHub, determine whether the change could affect test behavior — edits to `tests/`, `pages/`, `src/`, `playwright.config.ts`, or fixtures/config those tests depend on. If so, run the affected test(s) locally at least 3 times in a row (e.g. `npx playwright test --repeat-each=3`) and confirm all 3 runs pass; this catches flaky/timing-dependent tests before they reach CI. Skip this step for changes that cannot affect test behavior (e.g. docs, this file, CI workflow comments unrelated to test execution). This is a workflow practice, not enforced by lint/typecheck/CI.

## Rules

These are enforced by `npm run lint` / `npm run typecheck` (see Architecture), not just guidance — a violation fails CI.

- Act as a QA Automation expert. All test code is TypeScript with `strict` typing — no `any`, no implicit `any`, no untyped fixtures. (`@typescript-eslint/no-explicit-any`, `tsconfig.json` `strict`)
- Locator priority (use the first that applies, in order): `getByRole` > `getByLabel` > `getByText` > `getByTestId` > `getByTitle`/`getByAltText` > relative CSS selector scoped to a parent (e.g. `page.locator('.card').filter(...)`). Absolute XPath (`//div[3]/span[2]`) is never permitted (ESLint `no-restricted-syntax` rejects any `.locator()` call whose argument starts with `//`). Relative/short XPath is only permitted when no other option works, and must include a comment explaining why.
- Page Object Model is mandatory for any test touching a UI page:
  - One class per page/major component, in `pages/`, named `<Feature>Page` in `<feature>.page.ts` (e.g. `pages/register.page.ts` exports `RegisterPage`).
  - Each class extends `BasePage` (`pages/base.page.ts`), which takes `page: Page` in its constructor and stores it as a `protected readonly` field.
  - Locators are `readonly`/`private readonly` class properties initialized in the constructor — never re-queried inline inside test files, and never passed as raw strings between tests and pages.
  - Page classes expose action/assertion methods (e.g. `login(user, pass)`, `expectErrorVisible()`); test files call only these methods. ESLint rejects any `page.locator(...)`/`page.getBy...(...)` call written directly inside `tests/**/*.ts`.
- Env vars read via `process.env` must be classified by sensitivity, both locally (`.env`) and in CI (`.github/workflows/playwright.yml`): real credentials (e.g. `GOREST_TOKEN`) are GitHub Actions **Secrets** (`secrets.*`); non-sensitive values would be GitHub Actions **Variables** (`vars.*`), not secrets — do not default non-sensitive env vars into `secrets.*` just because they're credential-shaped. UI tests must not read BearStore login credentials from the environment; use `fixtures/auth.fixture.ts`'s seeded per-worker account instead.
