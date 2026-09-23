---
name: add-test
description: 'Add a new Playwright UI or API test to this repo, following CLAUDE.md conventions: Page Object Model boundaries, locator priority, typed API orchestrators, and strict TypeScript.'
category: testing
risk: safe
tags: [testing, qa, playwright, typescript]
---

# Add Test

## Overview

Add one new test (and, when needed, the Page Object or API orchestrator method
it depends on) to this repo's Playwright suite, matching the structure and
lint/typecheck rules already codified in `CLAUDE.md`. This skill writes real
project code — it does not touch any Agent QA MCP tooling (this repo's
`.mcp.json` does not configure an `agent-qa` server; the `agent-qa-*` skills
in this workspace target a different, unconfigured system).

## When to Use

- The user asks to add, write, or cover a new UI flow or API endpoint with a test.
- A new page/component needs a Page Object before it can be tested.
- A new GoRest resource or endpoint needs API test coverage.

## Preconditions

- Read `CLAUDE.md` at the start of every run — its Rules and Architecture
  sections track the live ESLint/tsconfig config, not a fixed snapshot.
- Determine whether the target is UI (`tests/ui/**`) or API (`tests/api/**`)
  before writing anything; the two have different rules and no shared file
  touches both.
- Never invent selectors, endpoints, or fixtures — inspect the real page or
  API response first (browser MCP tools, `curl`, or reading existing
  Page Objects/orchestrators) rather than guessing.

## Workflow

### UI test

1. Inspect the target page/flow to find real, stable attributes (role, label,
   text, `data-testid`) — do not guess selectors.
2. If no Page Object covers this page yet, create one in `pages/<feature>.page.ts`:
   - Class named `<Feature>Page`, extends `BasePage`.
   - Locators as `readonly`/`private readonly` fields, initialized in the
     constructor — never re-queried inline in a method.
   - Locator priority, in order: `getByRole` > `getByLabel` > `getByText` >
     `getByTestId` > `getByTitle`/`getByAltText` > a relative CSS selector
     scoped to a parent.
   - Expose action/assertion methods (e.g. `addToCart()`, `expectTotal(value)`)
     — never expose raw locators to callers.
3. If the flow needs authentication, rely on the project-wide `storageState`
   (already wired via the `setup` project) rather than re-authenticating
   inline; use the `authenticatedPage` fixture from `fixtures/auth.fixture.ts`
   only when a test explicitly needs an authenticated page outside the
   default project wiring.
4. Write the spec in `tests/ui/<feature>.spec.ts`:
   - Call only Page Object methods — never `page.locator(...)` or
     `page.getBy*(...)` directly (ESLint blocks this in `tests/ui/**`).
   - Name the test after the behavior under test ("adds item to cart and
     updates total"), not the mechanics ("test 1").
   - Assert the specific outcome that matters, not an incidental byproduct.

### API test

1. Check `src/types/gorest.ts` for the relevant DTO; add or extend a type
   there if the endpoint isn't covered yet — no `any`, no untyped payloads.
2. If the orchestrator doesn't already expose the needed call, add a method to
   the relevant `src/api/*` orchestrator (e.g. `GoRestUser`) on top of
   `GoRestClient` — never call `request` directly from a test.
3. Write the spec in `tests/api/<resource>.spec.ts`, calling only the
   orchestrator's methods.
4. Note whether the test requires `GOREST_TOKEN` (create/update/delete) or
   works unauthenticated (reads); don't hardcode a token — read it from
   `process.env`.

## Verification

- Run `npm run typecheck` and `npm run lint` — both must pass; a rule
  violation here fails CI.
- Run the new spec directly: `npx playwright test tests/ui/<file>.spec.ts` or
  `tests/api/<file>.spec.ts`, and `-g "<test name>"` to target just the new
  test while iterating.
- Per the Pre-push checklist in `CLAUDE.md`, before pushing run the new/changed
  spec 3 times in a row (`--repeat-each=3`) and confirm all 3 pass, to catch
  flakiness before it reaches CI.

## Do Not

- Do not call `page.locator`/`page.getBy*` or the `request` fixture directly
  inside a test file — encapsulate in a Page Object or API orchestrator.
- Do not add `any`, implicit `any`, or untyped fixtures/params.
- Do not commit a real `GOREST_TOKEN` or other credential into a spec, fixture,
  or committed `.env`.
- Do not add speculative retries, config flags, or abstractions the new test
  doesn't need — three similar lines beat a premature helper.

## Limitations

- This skill does not run against a locally hosted app — UI tests navigate to
  absolute URLs (BearStore, Playwright's demo site), since `baseURL`/`webServer`
  are commented out in `playwright.config.ts`.
- Does not know application behavior it hasn't inspected; verify selectors and
  API responses against the live target before writing assertions.
- A passing local run does not replace CI; still push through the normal PR flow.
