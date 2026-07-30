# Implementation Tasks — Cargo Auctions SPA

Tasks are ordered to produce small, reviewable increments. Complete acceptance criteria and required checks before marking a task done.

## Phase 0 — Repository and contract setup

### TASK-001 — Initialize the application

**Dependencies:** none

**Deliverables:**

- Vite React + TypeScript project;
- strict TypeScript configuration;
- TanStack Router and TanStack Query providers;
- base Feature-Sliced Design directories;
- CSS reset/global tokens;
- ESLint, Prettier, Vitest, and React Testing Library;
- scripts for dev, build, lint, typecheck, and test.

**Acceptance criteria:**

- [x] Development server starts.
- [x] Root route renders without errors.
- [x] FSD base folders exist.
- [x] `lint`, `typecheck`, `test`, and `build` pass.

---

### TASK-002 — Add OpenAPI contract types and shared API client

**Dependencies:** TASK-001

**Deliverables:**

- OpenAPI-derived or verified TypeScript contract types;
- shared API base URL configuration for `/api/v1`;
- typed fetch client;
- typed `ProblemDetail` and `ValidationProblem` errors;
- response parsing and error normalization.

**Acceptance criteria:**

- [x] All four required operations have typed request/response boundaries.
- [x] `application/problem+json` is parsed.
- [x] HTTP status, `code`, `message`, and optional `trace_id` remain available.
- [x] `401`, `404`, `422`, and `503` can be distinguished.
- [x] No React component calls `fetch` directly.
- [x] Contract code does not invent fields absent from OpenAPI.

---

### TASK-003 — Add app providers, router shell, and shared UI states

**Dependencies:** TASK-001, TASK-002

**Deliverables:**

- app providers;
- typed TanStack Router setup;
- application shell;
- not-found route;
- shared loading, skeleton, empty, and error components;
- toast provider;
- responsive layout primitives.

**Acceptance criteria:**

- [x] `/auctions` route placeholder resolves.
- [x] unknown routes render a not-found state.
- [x] shared error UI supports retry and optional technical details.
- [x] focus and keyboard behavior are usable.
- [x] layout works at 360px and desktop widths.

## Phase 1 — Stateful mock API

### TASK-004 — Implement MSW store and seed data

**Dependencies:** TASK-002

**Deliverables:**

- dedicated in-memory mock store;
- auction list, detail, and bid entities with consistent IDs/UUIDs;
- city dictionary;
- seeded variants for active, leading, losing, finished, empty bids, hidden history, hidden contacts, hidden cargo price, and nullable fields;
- deterministic reset helper for tests.

**Acceptance criteria:**

- [x] Seed data conforms to OpenAPI response shapes.
- [x] List and detail representations refer to the same auctions.
- [x] At least ten documented UI scenarios exist.
- [x] Nullable values and every important enum branch are represented.
- [x] Mock state can be reset between tests.

---

### TASK-005 — Implement MSW read handlers

**Dependencies:** TASK-004

**Deliverables:**

- `POST /api/v1/auctions/list` handler;
- `GET /api/v1/auctions/:auctionUuid` handler;
- `GET /api/v1/auctions/:auctionUuid/bets` handler;
- filtering, sorting, and pagination logic;
- optional `all` bid-history behavior;
- latency simulation;
- documented `401`, `404`, and `503` triggers.

**Acceptance criteria:**

- [x] List handler accepts OpenAPI `AuctionListRequest` fields.
- [x] Pagination metadata matches returned records.
- [x] Required minimum filters work.
- [x] Supported sort fields and directions work.
- [x] Unknown UUID returns OpenAPI-shaped `404`.
- [x] Error triggers return `application/problem+json`.
- [x] `all=true` can include rejected/cancelled bids.

---

### TASK-006 — Implement stateful set-bid handler

**Dependencies:** TASK-004, TASK-005

**Deliverables:**

- `POST /api/v1/auctions/:auctionUuid/bets` handler;
- positive-price validation;
- min/max/step validation;
- OpenAPI-shaped `422 ValidationProblem`;
- mutation of bid list, detail trading state, list-card trading state, current price, and ranking.

**Acceptance criteria:**

- [x] Valid `{ price }` returns `200`.
- [x] Invalid price returns `422` with `errors[].field === "price"`.
- [x] Bid is blocked when `can_set_bet` is false.
- [x] New/changed bid appears in bid history.
- [x] Current price updates consistently.
- [x] User `your.bet`, last bid, and trading status update.
- [x] Bid places and winner flags remain internally consistent.
- [x] Reset helper restores original state.

## Phase 2 — Domain models and pure logic

### TASK-007 — Implement auction entity mappers and formatters

**Dependencies:** TASK-002

**Deliverables:**

- enum label maps for auction type, auction status, trading status, bid unit, and payment delay;
- safe runtime fallbacks;
- auction-list-item ViewModel mapper;
- auction-detail ViewModel mapper;
- route-summary helper;
- money, date, quantity, and nullable-value formatters;
- primary-action selector.

**Acceptance criteria:**

- [x] Every OpenAPI enum value is handled.
- [x] Unknown runtime values produce a safe label.
- [x] Numeric zero is not treated as missing.
- [x] Hidden-data flags affect mapped output/actions.
- [x] Primary action matches `can_set_bet`, `your.bet`, and history visibility.
- [x] Unit tests cover key branches.

---

### TASK-008 — Implement list search schema and request builder

**Dependencies:** TASK-002

**Deliverables:**

- Zod schema for `/auctions` search params;
- safe defaults;
- serialization/deserialization helpers for array and boolean params;
- URL state → `AuctionListRequest` mapper;
- removal of empty optional values;
- normalized query-key input.

**Acceptance criteria:**

- [x] Invalid page/per-page values fall back safely.
- [x] Invalid enum values are discarded or replaced safely.
- [x] Date values are validated.
- [x] Price ranges are numeric and non-negative.
- [x] All minimum assignment filters map to correct snake_case fields.
- [x] Tests cover valid, invalid, partial, and empty search states.

---

### TASK-009 — Implement bid validation schema

**Dependencies:** TASK-007

**Deliverables:**

- reusable Zod schema factory using detail price constraints;
- decimal-safe step validator;
- Russian validation messages;
- tests for positive, min, max, step, and nullable constraints.

**Acceptance criteria:**

- [x] Price is required and greater than zero.
- [x] Non-null min/max are enforced.
- [x] Non-null step is enforced using documented base behavior.
- [x] Decimal steps do not fail because of floating-point noise.
- [x] Null constraints do not introduce restrictions.
- [x] Tests pass.

## Phase 3 — Auction list

### TASK-010 — Implement auction query hooks and query keys

**Dependencies:** TASK-002, TASK-008

**Deliverables:**

- centralized auction query-key factory;
- list query hook;
- detail query hook;
- bets query hook;
- prefetch-detail helper;
- intentional retry rules.

**Acceptance criteria:**

- [x] Query keys include normalized request state.
- [x] `401`, `404`, and `422` are not automatically retried.
- [x] recoverable network/`503` failures use limited retry.
- [x] detail can be prefetched by UUID.
- [x] hooks are independent of page JSX.

---

### TASK-011 — Build auction filters and sorting UI

**Dependencies:** TASK-003, TASK-008

**Deliverables:**

- filter form using React Hook Form + Zod;
- fields for all minimum filters;
- searchable city selects backed by mock dictionary;
- sorting controls;
- apply/reset behavior;
- mobile filter dialog controlled by Zustand.

**Acceptance criteria:**

- [x] Applying filters updates URL search params.
- [x] Filter/sort changes reset page to `1`.
- [x] Reset returns to documented defaults.
- [x] Reloading/sharing the URL restores filter state.
- [x] Mobile dialog is keyboard accessible.
- [x] Zustand stores only dialog UI state.

---

### TASK-012 — Build auction card

**Dependencies:** TASK-007

**Deliverables:**

- responsive auction card;
- route/cargo/trading/price sections;
- status badges;
- primary action;
- detail link;
- hover/focus prefetch integration.

**Acceptance criteria:**

- [x] Required assignment fields appear when present.
- [x] Missing nullable values render safely.
- [x] Hidden organization data is not exposed.
- [x] Primary action follows business rules.
- [x] Card contains no invalid nested interactive elements.
- [x] Detail prefetch runs on pointer/focus intent.

---

### TASK-013 — Build auction list page and pagination

**Dependencies:** TASK-010, TASK-011, TASK-012

**Deliverables:**

- `/auctions` page;
- list query integration;
- result count;
- pagination;
- initial skeleton;
- background refresh indication;
- empty and error states.

**Acceptance criteria:**

- [x] Page uses `POST /auctions/list` through TanStack Query.
- [x] Pagination preserves filters and sort.
- [x] previous/next limits are enforced.
- [x] empty state offers reset action.
- [x] retry works after recoverable errors.
- [x] `401` and `503` have distinct messages.
- [x] layout is usable on mobile and desktop.

## Phase 4 — Auction detail

### TASK-014 — Build auction detail page

**Dependencies:** TASK-007, TASK-010

**Deliverables:**

- `/auctions/$auctionUuid` page;
- overview, organizer, route, cargo/vehicle, payment, and trading sections;
- action links to bids and bid form;
- detail loading and error states.

**Acceptance criteria:**

- [x] Page uses `GET /auctions/{auctionUuid}`.
- [x] All route points are ordered and rendered.
- [x] organizer and contacts render when allowed.
- [x] cargo and vehicle requirements render when present.
- [x] payment and trading constraints render correctly.
- [x] `no_view_cargo_price` hides cargo price.
- [x] `hide_points_address_and_contacts` removes protected data.
- [x] `hide_bets_history` suppresses bid-history action.
- [x] `404`, `401`, and `503` states are distinct.

## Phase 5 — Bid history

### TASK-015 — Build bid ViewModels and participant logic

**Dependencies:** TASK-002, TASK-007

**Deliverables:**

- bid-row ViewModel mapper;
- unique participant-count helper;
- rejected/cancelled/winner/counter flags;
- rank visibility helper;
- tests.

**Acceptance criteria:**

- [ ] Participant count uses unique `subscriber_id` values.
- [ ] Empty strings and nullable price-info fields render safely.
- [ ] cancellation reason renders only when meaningful.
- [ ] rank can be hidden without removing other bid data.
- [ ] tests cover duplicate participants and cancelled bids.

---

### TASK-016 — Build bid history route and list

**Dependencies:** TASK-010, TASK-014, TASK-015

**Deliverables:**

- `/auctions/$auctionUuid/bets` route;
- bid query integration;
- participant summary;
- responsive bid list/table;
- optional include-cancelled control when appropriate;
- loading, empty, hidden, and error states.

**Acceptance criteria:**

- [ ] Page uses `GET /auctions/{auctionUuid}/bets`.
- [ ] Hidden history renders no bid rows.
- [ ] Required bid fields are displayed.
- [ ] rank is hidden when detail `hide_places` is true.
- [ ] empty `bets` array renders empty state.
- [ ] `all=true` behavior is supported without bypassing hidden history.
- [ ] mobile layout remains readable.

## Phase 6 — Set bid

### TASK-017 — Build set-bid mutation hook

**Dependencies:** TASK-006, TASK-010

**Deliverables:**

- typed set-bid mutation;
- error normalization;
- query invalidation for list/detail/bets;
- success and error callbacks suitable for toast/UI integration.

**Acceptance criteria:**

- [ ] Mutation sends only `{ price: number }`.
- [ ] Success invalidates all affected query families.
- [ ] `422` field errors remain accessible to the form.
- [ ] unrelated query data is not invalidated unnecessarily.

---

### TASK-018 — Build link-addressable bid form page

**Dependencies:** TASK-009, TASK-014, TASK-017

**Deliverables:**

- `/auctions/$auctionUuid/bid` route;
- detail-gated form;
- new/change-bid title and current-bid context;
- available price, min/max/step, VAT, and unit hints;
- React Hook Form + Zod integration;
- success/error toasts;
- blocked state.

**Acceptance criteria:**

- [ ] Direct URL load fetches detail and renders correctly.
- [ ] `can_set_bet=false` prevents submission.
- [ ] local validation covers positive/min/max/step.
- [ ] pending state prevents duplicate submissions.
- [ ] `422 price` error appears on the field.
- [ ] success updates visible data after invalidation.
- [ ] success navigation behavior is documented.

## Phase 7 — Quality, documentation, and final verification

### TASK-019 — Add integration tests for critical flows

**Dependencies:** TASK-013, TASK-014, TASK-016, TASK-018

**Deliverables:**

- list URL/request integration test;
- successful bid mutation test;
- bid `422` form-error test;
- hidden-history test;
- blocked-bid test.

**Acceptance criteria:**

- [ ] Tests use MSW and reset mock state.
- [ ] Tests assert observable user behavior.
- [ ] Tests do not depend on arbitrary timeouts.
- [ ] Critical flows pass reliably in repeated runs.

---

### TASK-020 — Complete README and AI usage disclosure

**Dependencies:** all implementation tasks

**Deliverables:**

- complete `README.md`;
- complete `AI_USAGE.md`;
- route and mock-scenario documentation;
- manual verification checklist;
- limitations and trade-offs.

**Acceptance criteria:**

- [ ] A reviewer can install and run the project from README alone.
- [ ] README lists all verification commands.
- [ ] README explains FSD architecture and API/mock design.
- [ ] README documents error-scenario triggers.
- [ ] AI_USAGE answers every item required by the assignment.
- [ ] Remaining risks are stated honestly.

---

### TASK-021 — Final audit

**Dependencies:** TASK-019, TASK-020

**Deliverables:**

- OpenAPI contract audit;
- component-filename audit;
- responsive and accessibility review;
- final automated checks;
- final manual scenario run.

**Acceptance criteria:**

- [ ] All four API operations are used.
- [ ] Required enums and nullable fields are handled.
- [ ] `401`, `404`, `422`, and `503` are demonstrable.
- [ ] hidden-data flags do not leak protected information.
- [ ] list, detail, bids, and bid form work by direct URL.
- [ ] mutation changes MSW state across all affected views.
- [ ] mobile and desktop layouts are verified.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] repository contains no secrets, debug logs, or unrelated files.
