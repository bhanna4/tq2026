# TQ2026

Playwright test automation project covering two systems:

- **BearStore** (`https://bearstore-testsite.smartbear.com/`) — a live demo
  e-commerce site, exercised through UI tests (search, cart, checkout).
- **GoRest** (`https://gorest.co.in/public/v2`) — a public REST API, exercised
  through API tests (users, posts, comments).

UI tests follow the Page Object Model; API tests go through typed
orchestrator classes. Both patterns are enforced by ESLint and TypeScript, not
just convention — see [CLAUDE.md](CLAUDE.md) for the full rule set and
architecture notes (that file is written for AI coding agents but is equally
useful as a deeper reference for humans).

## Prerequisites

- Node.js (a recent LTS release; CI uses `lts/*`)
- npm

## Setup

```bash
npm install
npx playwright install --with-deps
```

Copy `.env.example` to `.env` and fill in `GOREST_TOKEN` if you need to run
write operations (create/update/delete) against the GoRest API. Read-only API
tests and all UI tests work without it. `GOREST_TOKEN` is a personal GoRest
API access token — never commit it.

## Running tests

```bash
npx playwright test                        # everything
npx playwright test --project=chromium      # one UI browser (also: firefox, webkit)
npx playwright test --project=api           # API tests only
npx playwright test tests/ui/search.spec.ts # a single file
npx playwright test -g "has title"          # a single test by name
npx playwright test --headed                # visible browser
npx playwright show-report                  # view the last HTML report
```

UI tests run against three browser projects (chromium, firefox, webkit); API
tests run in their own project against the live GoRest API. There's no local
app under test — UI tests navigate directly to the live BearStore site.

## Linting and type checking

```bash
npm run typecheck
npm run lint
npm run format:check
```

These also run in CI (`.github/workflows/playwright.yml`) and as pre-commit /
pre-push hooks (`.husky/`); a rule violation fails the build, not just local
tooling.

## Project layout

```
tests/ui/      UI specs — call only Page Object methods, never page.locator() directly
tests/api/     API specs — call only src/api/ orchestrator methods
pages/         Page Object classes (one per page/component)
src/api/       Typed API orchestrator classes (GoRestUser, GoRestPost, GoRestComment)
src/types/     DTOs/interfaces for external APIs
fixtures/      Shared Playwright fixtures (per-worker seeded account, authenticated page)
```

Each UI test that needs a logged-in session uses `fixtures/auth.fixture.ts`'s
`authenticatedPage` fixture, which registers a fresh, randomly-seeded BearStore
account per worker — no shared login, no BearStore credentials in the
environment.

## Contributing

See [CLAUDE.md](CLAUDE.md) for the full architecture reference, locator
priority rules, Page Object Model conventions, and the pre-push checklist
(run a changed test 3× in a row before pushing, to catch flakiness before CI
does).
