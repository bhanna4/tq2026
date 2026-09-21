# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Run all tests: `npx playwright test`
- Run a single test file: `npx playwright test tests/example.spec.ts`
- Run a single test by name: `npx playwright test -g "has title"`
- Run tests in a specific browser project: `npx playwright test --project=chromium`
- Run tests in headed mode (visible browser): `npx playwright test --headed`
- View the HTML test report after a run: `npx playwright show-report`
- Install/update Playwright browsers: `npx playwright install`
- Lint (enforces the rules below): `npm run lint`
- Typecheck: `npm run typecheck`

CI (`.github/workflows/playwright.yml`) runs `typecheck` and `lint` before `npx playwright test`, so any rule violation below fails the build, not just this file's guidance.

## Architecture

- `playwright.config.ts` — central Playwright configuration. Tests run against three browser projects (chromium, firefox, webkit) in parallel. `baseURL` and `webServer` are commented out, so tests currently navigate to absolute URLs directly rather than a local app.
- `tests/` — test specs (`testDir: './tests'`), named `*.spec.ts`. Test files call only Page Object methods; they never query `page` locators directly (enforced by ESLint, see Rules).
- `pages/` — Page Object classes, named `*.page.ts`. `pages/base.page.ts` exports `BasePage`, which feature page classes extend. `pages/playwright-home.page.ts` (`PlaywrightHomePage`) is the reference implementation the example test uses.
- `eslint.config.js` — ESLint flat config. Enforces `@typescript-eslint/no-explicit-any`, bans absolute XPath locators, and bans direct `page.locator`/`page.getBy*` calls inside `tests/**/*.ts` via `no-restricted-syntax`.
- `tsconfig.json` — `strict: true` plus `noUncheckedIndexedAccess` and `noImplicitOverride`.
- `.github/workflows/playwright.yml` — CI runs `typecheck`, `lint`, then `npx playwright test` on push/PR to `main`/`master`, and uploads the HTML report as a build artifact.
- `.mcp.json` — configures three MCP servers available in this environment: `github` (GitHub Copilot MCP, for repo/PR/issue operations), `playwright` (browser automation, separate from the `@playwright/test` dependency used for the test suite itself), and `context7` (live library documentation lookup).

## Rules

These are enforced by `npm run lint` / `npm run typecheck` (see Architecture), not just guidance — a violation fails CI.

- Act as a QA Automation expert. All test code is TypeScript with `strict` typing — no `any`, no implicit `any`, no untyped fixtures. (`@typescript-eslint/no-explicit-any`, `tsconfig.json` `strict`)
- Locator priority (use the first that applies, in order): `getByRole` > `getByLabel` > `getByText` > `getByTestId` > `getByTitle`/`getByAltText` > relative CSS selector scoped to a parent (e.g. `page.locator('.card').filter(...)`). Absolute XPath (`//div[3]/span[2]`) is never permitted (ESLint `no-restricted-syntax` rejects any `.locator()` call whose argument starts with `//`). Relative/short XPath is only permitted when no other option works, and must include a comment explaining why.
- Page Object Model is mandatory for any test touching a UI page:
  - One class per page/major component, in `pages/`, named `<Feature>Page` in `<feature>.page.ts` (e.g. `pages/login.page.ts` exports `LoginPage`).
  - Each class extends `BasePage` (`pages/base.page.ts`), which takes `page: Page` in its constructor and stores it as a `protected readonly` field.
  - Locators are `readonly`/`private readonly` class properties initialized in the constructor — never re-queried inline inside test files, and never passed as raw strings between tests and pages.
  - Page classes expose action/assertion methods (e.g. `login(user, pass)`, `expectErrorVisible()`); test files call only these methods. ESLint rejects any `page.locator(...)`/`page.getBy...(...)` call written directly inside `tests/**/*.ts`.
