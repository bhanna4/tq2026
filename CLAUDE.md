# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Run all tests: `npx playwright test`
- Run a single test file: `npx playwright test tests/example.spec.ts`
- Run a single test by name: `npx playwright test -g "has title"`
- Run tests in a specific browser project: `npx playwright test --project=chromium`
- Run only the API tests: `npx playwright test --project=api`
- Run tests in headed mode (visible browser): `npx playwright test --headed`
- View the HTML test report after a run: `npx playwright show-report`
- Install/update Playwright browsers: `npx playwright install`
- Lint (enforces the rules below): `npm run lint`
- Typecheck: `npm run typecheck`

CI (`.github/workflows/playwright.yml`) runs `typecheck` and `lint` before `npx playwright test`, so any rule violation below fails the build, not just this file's guidance.

## Architecture

- `playwright.config.ts` — central Playwright configuration. Tests run against three browser projects (chromium, firefox, webkit) in parallel, plus an `api` project (no browser device, `baseURL: 'https://gorest.co.in'`) for REST API tests; browser projects ignore `**/api/**`, the `api` project matches only it. `baseURL` and `webServer` for the UI projects are commented out, so UI tests currently navigate to absolute URLs directly rather than a local app.
- `tests/` — test specs (`testDir: './tests'`), named `*.spec.ts`. UI test files call only Page Object methods; they never query `page` locators directly (enforced by ESLint, see Rules). `tests/api/` holds REST API specs, which call only `src/api/` orchestrator methods (e.g. `GoRestUser`) — never Playwright's `request` fixture directly.
- `pages/` — Page Object classes, named `*.page.ts`. `pages/base.page.ts` exports `BasePage`, which feature page classes extend. `pages/playwright-home.page.ts` (`PlaywrightHomePage`) is the reference implementation the example test uses.
- `src/types/` — DTOs/interfaces for external APIs, e.g. `src/types/gorest.ts` (GoRest `User`, `Post`, `Comment`, `Todo` and their create/update payload variants).
- `src/api/` — API client layer for the `api` Playwright project. `gorest-client.ts` (`GoRestClient`) wraps Playwright's `APIRequestContext` with the GoRest base path, bearer auth (`GOREST_TOKEN` env var), and response parsing. `gorest-user.ts` (`GoRestUser`) orchestrates `/users` CRUD calls on top of it; tests instantiate `GoRestUser` and call its methods, mirroring the Page Object pattern used for UI. Set `GOREST_TOKEN` (a personal GoRest API access token — never commit it) before running write operations (create/update/delete); reads work without it but are rate-limited more aggressively.
- `eslint.config.js` — ESLint flat config. Enforces `@typescript-eslint/no-explicit-any`, bans absolute XPath locators, and bans direct `page.locator`/`page.getBy*` calls inside `tests/**/*.ts` via `no-restricted-syntax`.
- `tsconfig.json` — `strict: true` plus `noUncheckedIndexedAccess` and `noImplicitOverride`; `include` covers `tests/`, `pages/`, and `src/`.
- `.github/workflows/playwright.yml` — CI runs `typecheck`, `lint`, then `npx playwright test` on push/PR to `main`/`master`, and uploads the HTML report as a build artifact.
- `.mcp.json` — configures three MCP servers available in this environment: `github` (GitHub Copilot MCP, for repo/PR/issue operations), `playwright` (browser automation, separate from the `@playwright/test` dependency used for the test suite itself), and `context7` (live library documentation lookup).

## Pre-push checklist

- Before pushing to GitHub, run the affected test(s) locally at least 3 times in a row (e.g. `npx playwright test --repeat-each=3`) and confirm all 3 runs pass. This catches flaky/timing-dependent tests before they reach CI. This is a workflow practice, not enforced by lint/typecheck/CI.

## Rules

These are enforced by `npm run lint` / `npm run typecheck` (see Architecture), not just guidance — a violation fails CI.

- Act as a QA Automation expert. All test code is TypeScript with `strict` typing — no `any`, no implicit `any`, no untyped fixtures. (`@typescript-eslint/no-explicit-any`, `tsconfig.json` `strict`)
- Locator priority (use the first that applies, in order): `getByRole` > `getByLabel` > `getByText` > `getByTestId` > `getByTitle`/`getByAltText` > relative CSS selector scoped to a parent (e.g. `page.locator('.card').filter(...)`). Absolute XPath (`//div[3]/span[2]`) is never permitted (ESLint `no-restricted-syntax` rejects any `.locator()` call whose argument starts with `//`). Relative/short XPath is only permitted when no other option works, and must include a comment explaining why.
- Page Object Model is mandatory for any test touching a UI page:
  - One class per page/major component, in `pages/`, named `<Feature>Page` in `<feature>.page.ts` (e.g. `pages/login.page.ts` exports `LoginPage`).
  - Each class extends `BasePage` (`pages/base.page.ts`), which takes `page: Page` in its constructor and stores it as a `protected readonly` field.
  - Locators are `readonly`/`private readonly` class properties initialized in the constructor — never re-queried inline inside test files, and never passed as raw strings between tests and pages.
  - Page classes expose action/assertion methods (e.g. `login(user, pass)`, `expectErrorVisible()`); test files call only these methods. ESLint rejects any `page.locator(...)`/`page.getBy...(...)` call written directly inside `tests/**/*.ts`.
