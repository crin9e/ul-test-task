# Product Specification — Cargo Auctions SPA

## 1. Product overview

### Product name

Cargo Auctions SPA

### Purpose

Build a production-style single-page application for browsing cargo auctions, inspecting auction details and bid history, and placing or changing the current user's bid.

### Source of truth

`openapi.auctions.v0.json` is the authoritative contract for:

- endpoint paths and HTTP methods;
- request and response structures;
- enum values;
- nullable fields;
- error payloads;
- edge-case behavior represented by the schema.

When this document and the OpenAPI schema disagree, follow the OpenAPI schema and document the discrepancy in `README.md`.

### Target user

An authenticated carrier representative who evaluates cargo auctions and submits transport bids.

### Product language and locale

- UI copy: Russian.
- Date/time formatting: `ru-RU`.
- Currency formatting: derive from ISO 4217 numeric `currency_code`; support `643` as RUB and display a safe fallback for unknown codes.
- Do not assume all monetary values are RUB when a different currency code is provided.

## 2. Required technology stack

### Core

- React
- TypeScript with strict mode
- Vite
- TanStack Router
- TanStack Query
- React Hook Form
- Zod
- MSW
- Feature-Sliced Design
- Zustand for narrowly scoped client-only UI state

### Supporting tools

- CSS Modules for component styling and responsive layouts
- Pico CSS for UI components
- sonner for toasts
- `date-fns` for date formatting
- Vitest for unit tests
- React Testing Library for component/integration tests
- ESLint and Prettier

Do not add a second server-state library, form library, validation library, router, or global-state solution.

## 3. Scope

### Required features

1. Auction list with filters, sorting, pagination, and URL-synchronized state.
2. Auction card with route, cargo, trading, pricing, and primary action.
3. Auction detail page.
4. Bid history page or detail-page section.
5. Link-addressable bid form.
6. Stateful MSW mock backend that updates after bid mutations.
7. Loading, skeleton, empty, error, hidden-data, and permission-restricted states.
8. Minimal tests for critical pure logic and bid validation.
9. `README.md` and `AI_USAGE.md`.

### Out of scope

- Real backend implementation.
- Real authentication or registration UI.
- WebSockets or server-sent events.
- Auction creation/editing.
- Favorite mutation, because no corresponding endpoint exists.
- Admin functionality.
- Production persistence across browser refreshes.

## 4. Routing

Use TanStack Router with typed route params and Zod-validated search params.

### `/auctions`

Auction list.

Search parameters:

- `page`: positive integer, default `1`;
- `perPage`: positive integer, default `20`, capped at a safe UI maximum;
- `cargoNum`: string;
- `status`: array of `TradingStatus` strings;
- `statuses`: array of auction status numeric IDs supported by the API;
- `aucType`: array of `Request | Up | Down | FixPrice`;
- `loadCity`: string from the mock city dictionary;
- `unloadCity`: string from the mock city dictionary;
- `loadDateFrom`: ISO date/time;
- `loadDateTo`: ISO date/time;
- `isAvailable`: boolean;
- `isBidder`: boolean;
- `currentPriceFrom`: positive number;
- `currentPriceTo`: positive number;
- supported sort values for `start_time`, `price_per_km`, and `current_price`.

Invalid search params must be replaced with safe defaults without crashing the route.

### `/auctions/$auctionUuid`

Auction detail.

### `/auctions/$auctionUuid/bets`

Bid history. This may reuse the detail shell but must remain directly linkable.

### `/auctions/$auctionUuid/bid`

Place or edit a bid. This route must be directly linkable and must validate whether bidding is currently allowed.

### Unknown route

Render a user-friendly not-found screen with a link back to `/auctions`.

## 5. API integration

Base path: `/api/v1`.

### List auctions

`POST /auctions/list`

Request body uses `AuctionListRequest`.

Required UI mapping:

- URL search state is mapped to the OpenAPI request field names.
- Omit empty optional fields rather than sending empty strings or empty arrays unless the contract explicitly requires them.
- Reset `page` to `1` whenever a filter or sort value changes.
- Preserve page when only navigating between list and detail.

Response uses `AuctionListResponseBase` with `data` and `meta`.

### Auction detail

`GET /auctions/{auctionUuid}`

Response uses `AuctionShowResponse`.

### Bid history

`GET /auctions/{auctionUuid}/bets`

Optional query param:

- `all=true` includes cancelled/rejected bids.

Response uses `BetListResponse` with required `bets` array.

### Set bid

`POST /auctions/{auctionUuid}/bets`

Request body:

```json
{
  "price": 15000
}
```

The request must contain only a numeric `price` greater than `0`.

### Error handling

Handle these response classes consistently:

- `401 application/problem+json`: unauthenticated/invalid token;
- `404 application/problem+json`: auction not found;
- `422 application/problem+json`: validation problem with `errors[]`;
- `503 application/problem+json`: upstream unavailable;
- unexpected network or parsing failures.

Display user-friendly messages while retaining `trace_id` in expandable technical details when present.

For `422`, map a field error with `field: "price"` onto the bid input. Non-field validation errors appear in the form error summary/toast.

## 6. Data and enum behavior

### Auction types

- `Request`
- `Up`
- `Down`
- `FixPrice`
- `Unknown`

Use Russian display labels. `Unknown` must render as a neutral fallback and must never crash a mapper.

### Auction statuses

- `Planning`
- `Auction`
- `DeterminateWinner`
- `WaitDeal`
- `InProgress`
- `Finished`
- `Stopped`
- `Canceled`
- `Unknown`

### User trading statuses

- `NotParticipating`
- `Leading`
- `Losing`
- `OnPending`
- `Confirmed`
- `ChoosingWinner`
- `Winner`
- `Accepted`
- `Unknown`

The UI must support every value present in the OpenAPI schema, even where the assignment gives only examples.

### Bid measurement types

- `PerRoute`
- `PerKm`
- `Unknown`

### Nullable fields

Nullable values must be rendered as one of:

- hidden section when the field is not meaningful;
- em dash (`—`) for an unavailable scalar;
- explicit fallback label for unknown enum values.

Never use truthiness checks for numeric values because `0` can be meaningful.

## 7. Auction list page

### Header

- Page title: `Грузовые аукционы`.
- Active result count from `meta.total`.
- Filter toggle on mobile.

### Filters

Minimum filters:

- request number (`cargo_num`);
- user trading status (`status`);
- auction status (`statuses`);
- auction type (`auc_type`);
- loading city;
- unloading city;
- loading date from/to;
- available for bidding (`is_available`);
- participated by user (`is_bidder`);
- current price from/to.

Behavior:

- Filters synchronize to URL search params.
- Inputs are validated with Zod.
- `Apply` updates the URL and resets page.
- `Reset` removes filter params and returns to defaults.
- Desktop uses a persistent sidebar or toolbar.
- Mobile uses a pico dialog.
- City fields use a local mock dictionary with searchable options.

### Sorting

Support ascending and descending sorting for:

- auction start time;
- current price;
- price per kilometer.

Only send sort keys supported by `AuctionListRequest`.

### Pagination

- Use API `meta.current_page`, `last_page`, `per_page`, and `total`.
- Previous/next controls must be disabled at limits.
- Direct page navigation may be used.
- Preserve filters and sorting during pagination.

### Query behavior

- Fetch via TanStack Query.
- Keep previous page data while the next page loads when practical.
- Prefetch auction detail on card-link hover, focus, or pointer intent.
- Do not prefetch on touch-only intent where it causes excessive requests.

### Visual states

- Initial skeleton.
- Background refresh indicator without replacing visible data.
- Empty state with reset-filters action.
- Recoverable error state with retry.
- `401` state with explanation that the mock session is invalid.
- `503` state with retry guidance.

## 8. Auction card

Each card must show, where available:

- request number;
- auction type;
- auction status;
- current user's trading status;
- organizer name unless hidden;
- loading city and date;
- unloading city and date;
- cargo name;
- weight in tonnes;
- volume in cubic metres;
- body type;
- truck count when greater than one;
- current price;
- price per kilometre;
- bid step where available from detail-prefetched data, otherwise omit it;
- whether the current user has a bid.

### Primary action rules

Determine action from DTO data, not from hard-coded route assumptions:

1. `can_set_bet === true` and `your.bet === false`: `Сделать ставку` → bid route.
2. `can_set_bet === true` and `your.bet === true`: `Изменить ставку` → bid route.
3. Bidding unavailable and history visible: `Смотреть ставки` → bets route.
4. Bidding unavailable and history hidden: disabled action with an explanatory label or tooltip.

The card itself links to the detail page without nesting interactive controls incorrectly.

## 9. Auction detail page

### Required sections

#### Overview

- request number;
- auction type and status;
- created date;
- start and stop times;
- current user trading status.

#### Organizer

- organization name;
- INN/KPP;
- contacts only when not restricted and values are present.

#### Route

- all route points ordered by `row_num`;
- operation type;
- start/end date;
- city/address;
- contractor details where present;
- cargo information per route point where present;
- contacts only when permitted.

When `hide_points_address_and_contacts` is true, hide exact addresses and contacts and display a clear privacy notice.

#### Cargo and vehicle requirements

- cargo value where allowed;
- international shipment flag;
- distance;
- truck count;
- body type;
- temperature range;
- loading types;
- document requirements;
- vehicle dimensions/capacity;
- ADR, belts, conics, coupling, air pass, low loader, additional load, container fields when present.

When `no_view_cargo_price` is true, cargo price must not be shown.

#### Payment

- payment form;
- payment condition;
- delay and delay type;
- currency;
- prepayment.

#### Trading

- bid measurement type;
- current and current-no-VAT price;
- available and available-no-VAT price;
- min/max/step with and without VAT;
- price per kilometre;
- counter-bid setting;
- prolongation and winner settings when present;
- current user's last bid and winner state.

### Detail actions

- Bid action follows the same rules as the card.
- Bid-history action is hidden or disabled when `hide_bets_history` is true.
- Refresh/retry is available after recoverable failures.

### Detail states

- skeleton;
- `404` not found;
- `401` unauthorized;
- `503` unavailable;
- generic malformed-response/network error.

## 10. Bid history

### Visibility

Before loading or showing bid history, use detail data to evaluate `hide_bets_history`.

When hidden:

- do not expose bid rows;
- render a dedicated `История ставок скрыта организатором` state;
- do not offer an `all=true` override in the UI.

### Bid list fields

For each bid, show:

- creation date/time;
- carrier organization name and INN;
- contact name when present;
- price with VAT;
- price without VAT;
- payment type and VAT rate when present;
- ranking place unless `hide_places` is true;
- winner indicator;
- rejected/cancelled indicator;
- cancellation reason when non-empty;
- counter-bid indicator;
- run number when greater than zero.

### Participant count

Display the count of unique `subscriber_id` values, not simply the number of bid rows.

### States

- loading skeleton;
- empty state;
- hidden-history state;
- API error with retry.

## 11. Bid form

### Access rules

- The route is directly linkable.
- Fetch detail before rendering the enabled form.
- When `trading.can_set_bet` is false, render a blocked state and do not submit.
- The form may represent either a new bid or changing the user's existing bid.

### Fields

#### Price

- Required.
- Numeric.
- Greater than `0`.
- Respect `trading.price.min` when non-null.
- Respect `trading.price.max` when non-null.
- Respect `trading.price.step` when non-null.
- Show available price and step hints.
- Show the applicable measurement unit (`за рейс` or `за км`).

Step validation should use a decimal-safe calculation and a documented base. Use `min` as the base when present; otherwise use `0`.

### Submission

- Submit `{ price: number }` to `POST /auctions/{auctionUuid}/bets`.
- Disable repeated submission while pending.
- Show success toast after completion.
- Show error toast for non-field failures.
- Map `422` field errors to React Hook Form.
- After success, invalidate auction list, auction detail, and auction bets queries.
- Navigate back to detail or keep the user on the form with updated detail; choose one behavior and document it in `README.md`.

## 12. MSW mock backend

### General requirements

- Handlers match the OpenAPI paths, methods, content types, and status codes.
- Maintain mutable in-memory state in a dedicated mock store.
- Seed enough auction variants to exercise all important UI states.
- Simulate realistic latency.

### Seed scenarios

Include at minimum:

1. Active auction where the user can place a first bid.
2. Active auction where the user is `Leading` and can change a bid.
3. Active auction where the user is `Losing`.
4. Finished auction with visible history and a winner.
5. Auction with no bids.
6. Auction with hidden bid history.
7. Auction with hidden addresses/contacts.
8. Auction with hidden cargo price.
9. Auction containing nullable optional fields.
10. Auction that returns `404` for an unknown UUID.

Provide a documented mechanism to trigger `401`, `422`, and `503` scenarios in development, such as reserved UUIDs, request values, or a dev-only scenario switch.

### Mutation behavior

On a successful bid:

- validate `price > 0`;
- validate min/max/step when present;
- append a new `BetItem` or replace the current user's active bid according to the chosen mock rule;
- update current and current-no-VAT price;
- update `trading.your.bet` and last-bid values;
- update user trading status (`Leading` or `Losing`) consistently;
- recalculate ranking places;
- update corresponding list-card data;
- return `200`.

Invalid bid values return `422 ValidationProblem` with an `errors` item for `price`.

## 13. Architecture

Use Feature-Sliced Design layers:

```text
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
```

Suggested slices:

```text
app/
  providers/
  router/
  styles/

pages/
  auctions-list/
  auction-detail/
  auction-bets/
  auction-bid/
  not-found/

widgets/
  auctions-filter-panel/
  auction-details/
  auction-bets-list/

features/
  filter-auctions/
  paginate-auctions/
  sort-auctions/
  set-auction-bid/

entities/
  auction/
  bet/
  city/

shared/
  api/
  config/
  lib/
  mocks/
  ui/
```

Each slice may expose a public API through `index.ts`. Avoid cross-importing internals between slices.

## 14. Query conventions

Use centralized query-key factories.

Example conceptual keys:

- `auctionKeys.all`;
- `auctionKeys.list(request)`;
- `auctionKeys.detail(uuid)`;
- `auctionKeys.bets(uuid, includeAll)`.

Request objects used in query keys must be normalized and serializable.

## 15. Accessibility and responsive behavior

- All controls are keyboard accessible.
- Focus states are visible.
- Dialogs trap focus and restore it on close.
- Form labels and errors are programmatically associated.
- Status is not communicated by color alone.
- Tables transform into readable cards or horizontally scroll on small screens.
- Minimum supported viewport width: 360px.
- Respect reduced-motion preferences.

## 16. Testing

### Required unit tests

- search param parsing and safe fallbacks;
- URL search state → `AuctionListRequest` builder;
- enum/DTO → display ViewModel mappers;
- money/date/nullable formatting edge cases;
- bid Zod schema for positive, min, max, and step constraints;
- participant-count calculation.

### Recommended integration tests

- list filters update URL and request body;
- successful bid updates mock state and invalidates queries;
- `422` error appears on price field;
- hidden bid history does not render bid rows;
- `can_set_bet=false` blocks submission.

## 17. Documentation deliverables

### `README.md`

Must include:

- prerequisites;
- install and run commands;
- mock API behavior;
- routes;
- architecture overview;
- important implementation decisions;
- test/check commands;
- scenarios manually verified;
- known limitations.

### `AI_USAGE.md`

Must include:

- which parts were produced with AI assistance;
- areas checked especially carefully;
- remaining risks (fill in after the completion of the final phase);
- improvements planned with one additional day (fill in after the completion of the final phase);

## 18. Definition of done

The project is complete when:

- all four required API operations are represented;
- routes are directly linkable;
- filters and pagination work and are URL-synchronized;
- OpenAPI enums and nullable fields are handled safely;
- MSW mutation changes list/detail/bets state;
- bid constraints and `422` errors are handled;
- hidden-data flags are respected;
- desktop and mobile layouts are usable;
- required loading/empty/error states exist;
- tests for critical pure logic pass;
- lint, typecheck, tests, and production build pass;
- `README.md` and `AI_USAGE.md` are complete;
