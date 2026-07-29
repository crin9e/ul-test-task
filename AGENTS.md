# AGENTS.md

## Mission

Build the Cargo Auctions SPA described in `PRODUCT_SPEC.md` and implemented against `openapi.auctions.v0.json`.

The OpenAPI schema is the contract source of truth. Do not invent API fields, enum values, endpoints, or response shapes.

Read these files before changing code:

1. `AGENTS.md`
2. `PRODUCT_SPEC.md`
3. `TASKS.md`
4. `openapi.auctions.v0.json` for the affected operation and schemas

## Non-negotiable stack

- React
- TypeScript strict mode
- Vite
- TanStack Router
- TanStack Query
- React Hook Form + Zod
- MSW
- Feature-Sliced Design
- Zustand only for small client-only UI state
- Vitest + React Testing Library
- CSS Modules
- Pico CSS for UI components
- sonner for toasts

Do not replace or duplicate these tools without explicit instruction.

## Architecture rules

Use Feature-Sliced Design layers:

```text
app → pages → widgets → features → entities → shared
```

Imports may point only to the same layer or a lower layer. Do not import from a higher layer.

Rules:

- expose slice APIs through `index.ts` where useful;
- do not import another slice's internal files directly;
- API DTOs belong near `shared/api` or generated contract types;
- domain display models and mappers belong in the relevant entity;
- page components compose widgets/features and contain little business logic;
- reusable UI primitives belong in `shared/ui`;
- MSW handlers and mock store belong in `shared/mocks`;
- route definitions belong in `app/router` or colocated route modules consistent with TanStack Router.

## OpenAPI discipline

For every API operation:

1. Inspect the exact OpenAPI request and response schemas.
2. Preserve snake_case fields at the network boundary.
3. Do not silently coerce malformed responses into valid domain data.
4. Support every enum value declared by the schema, including `Unknown` and less-obvious trading statuses.
5. Treat nullable numeric fields distinctly from zero.
6. Respect declared content types, especially `application/problem+json` errors.
7. Keep endpoint paths under `/api/v1`.

Prefer generated TypeScript types from the OpenAPI file when the generation setup remains simple and checked into the project. Otherwise create narrowly scoped hand-written contract types and verify them against the schema.

## API client rules

- Use one shared fetch-based API client.
- Throw a typed API error containing HTTP status and parsed problem payload.
- Do not call `fetch` directly from React components.
- Use `AbortSignal` from TanStack Query where supported.
- Centralize query-key factories.
- Normalize list requests before using them in query keys.

## TanStack Query rules

Use TanStack Query for all server state.

- Do not copy API data into Zustand.
- Prefetch detail by hover/focus intent from the list.
- Invalidate list, detail, and bets after a successful bid.
- Preserve visible list data during page transitions when appropriate.
- Configure retries intentionally: do not retry `401`, `404`, or `422`; use limited retry for network/`503` failures.

## Router and search-param rules

- Use TanStack Router typed params and search validation.
- Validate auction UUID route params before API use.
- Validate list search params with Zod and provide safe defaults.
- Keep filters, sorting, and pagination in the URL.
- Reset page to `1` after filter or sort changes.
- All detail, bets, and bid states must be directly linkable.

## Form rules

- Use React Hook Form with a Zod resolver.
- Bid `price` must be a number greater than zero.
- Apply non-null min, max, and step constraints from detail DTO.
- Use decimal-safe step validation.
- Map `422 errors[]` with `field === "price"` to the price field.
- Disable submission while pending.
- Do not submit when `trading.can_set_bet` is false.

## UI and accessibility rules

- UI text is Russian.
- Format dates and numbers for `ru-RU`.
- Use semantic elements and accessible labels.
- Ensure keyboard access and visible focus styles.
- Never use color as the only status indicator.
- Implement responsive behavior from 360px.
- Every data view must cover loading, empty, error, and success states where applicable.
- Hidden-data flags must remove protected content rather than merely visually blur it.

## DTO-to-ViewModel rules

Do not scatter display logic through JSX.

Create pure mappers for:

- auction type labels;
- auction status labels;
- trading status labels;
- route summary;
- price display;
- primary action selection;
- nullable field display;
- bid row display.

Mappers must use exhaustive handling with a safe fallback for unknown runtime strings.

## MSW rules

- MSW handlers must match OpenAPI methods and paths.
- Keep mutable data in a dedicated in-memory store, not inside component state.
- Seed scenarios that cover active, finished, hidden, empty, nullable, and error states.
- Successful bid mutation must update list, detail, and bets representations consistently.
- Return OpenAPI-shaped `ProblemDetail` and `ValidationProblem` bodies.
- Do not introduce mock-only response fields that production code depends on.

## Zustand rules

Zustand is allowed only for client UI concerns such as:

- optional development mock-scenario selector;
- dismissible UI preferences.

Do not store query results, forms, pagination, filters, or route state in Zustand.

## Code quality rules

- Keep TypeScript strict.
- Avoid `any`; use `unknown` and narrow it.
- Prefer pure functions for mapping and validation.
- Keep components focused and reasonably small.
- Avoid premature generic abstractions.
- Reuse existing primitives and patterns before adding new ones.
- Do not add dependencies for trivial utilities.
- Do not leave `console.log`, dead code, commented-out code, or untracked TODOs.
- Do not modify unrelated files.

## Testing rules

At minimum, add tests for:

- search param parsing;
- list request building;
- ViewModel mappers;
- bid validation including min/max/step;
- participant counting.

When changing a tested behavior, update the corresponding tests.

Do not delete or weaken tests to make the suite pass.

## Required validation commands

Use the package manager selected during initialization consistently.

Before completing a task, run the available equivalents of:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

When a command fails:

- fix failures caused by the change;
- report pre-existing failures separately;
- never claim a check passed unless it was executed successfully.

## Working method

Before implementation:

1. Read the task and acceptance criteria.
2. Inspect related routes, slices, types, handlers, and tests.
3. Inspect the exact OpenAPI operation and referenced schemas.
4. State a concise implementation plan.
5. Identify assumptions or contract ambiguities.

During implementation:

1. Work only within the current task scope.
2. Follow existing project patterns.
3. Add tests alongside pure logic.
4. Keep mock data and API behavior consistent.

After implementation:

1. Review the complete diff.
2. Run required checks.
3. Validate each acceptance criterion.
4. Summarize changed files and behavior.
5. Report remaining risks and unverified scenarios.

## Documentation rules

Maintain:

- `README.md` for setup, architecture, verification, mock scenarios, and limitations;
- `AI_USAGE.md` for AI-assisted work and review decisions;
- `TASKS.md` checkboxes only after acceptance criteria are verified.

Do not claim full OpenAPI compliance without checking the affected schemas and error cases.
