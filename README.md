# Cargo Auctions SPA

React SPA for cargo auctions, implemented against `openapi/openapi.auctions.v0.json`.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Development

```bash
npm install
npm run dev
```

The development build starts an MSW browser worker and serves the mock API under `/api/v1`.

## Routes

| Route                         | Purpose                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `/`                           | Application landing page                                                         |
| `/auctions`                   | URL-driven auction list, filters, sorting, and pagination                        |
| `/auctions/:auctionUuid`      | Auction detail                                                                   |
| `/auctions/:auctionUuid/bets` | Bid history; `all=true` includes cancelled/rejected bids when history is visible |
| `/auctions/:auctionUuid/bid`  | Directly linkable set/change-bid form                                            |

Auction path parameters are UUIDs, not database IDs. Invalid UUIDs are rejected before an API request, and unknown valid UUIDs demonstrate the `404` state.

## Architecture

The source follows Feature-Sliced Design with downward-only dependencies:

```text
app → pages → features → entities → shared
```

- `app` owns the entrypoint, providers, global styles, TanStack Router configuration, and full-router integration tests.
- `pages` own complete route screens and their one-off page sections.
- `features` own reusable or central business interactions such as auction filtering and bid submission.
- `entities` own auction/bid ViewModels, pure mappers, and entity UI.
- `shared` owns the fetch client, OpenAPI types, query definitions, MSW backend, utilities, and reusable UI states.

Every slice and Shared segment exposes a curated public `index.ts`; external code does not import slice internals. Production imports point only to strictly lower layers, while App composes all domains. The optional Widgets layer is omitted because the detail and bid-history blocks are each used by only one page.

TanStack Query is the only server-state store. Zustand contains only the mobile filter-dialog state. Network DTOs preserve OpenAPI field names and are mapped to display models before rendering.

## Styling

Pico CSS is loaded globally before application styles. `src/app/styles/global.css` contains only Pico design-token overrides and global accessibility behavior. Component-specific layout and visual variants use CSS Modules so they do not override Pico's shared `.container`, `.grid`, or card styles.

## Domain Logic

Auction DTOs remain unchanged at the API boundary and are converted to display ViewModels in `entities/auction`. Enum labels have safe runtime fallbacks, hidden-data flags remove protected values, and numeric zero remains distinct from missing data.

The `/auctions` search parser accepts URL strings or typed values, replaces malformed values with safe defaults, discards invalid enum members, and maps valid state to a normalized `AuctionListRequest`. Array filters use readable comma-separated URL values such as `status=Winner,Accepted`; previously generated JSON-array URLs remain compatible. Supported sort values are `start_time_asc`, `start_time_desc`, `current_price_asc`, `current_price_desc`, `price_per_km_asc`, and `price_per_km_desc`.

The auction list keeps filters, sorting, and pagination in the URL. Desktop uses a persistent Pico filter panel; mobile uses a native modal dialog whose open state is the only value stored in Zustand. TanStack Query retains visible page data while the next page loads and prefetches auction detail on mouse or keyboard intent.

The `/auctions/$auctionUuid` detail route validates the UUID before API use and renders mapped overview, organizer, ordered route, cargo/vehicle, payment, and trading sections. Protected contacts, exact addresses, cargo prices, and bid-history actions are removed according to the detail DTO flags. `401`, `404`, and `503` responses have distinct states, with `trace_id` available in expandable technical details.

The `/auctions/$auctionUuid/bets` route loads detail before bid history, so hidden history never renders rows or exposes the `all=true` control. Visible history shows unique participant counts, optional cancelled/rejected bids, rank visibility from `hide_places`, and responsive bid cards.

Bid step validation uses the non-null minimum as its base, otherwise zero. Decimal values are compared with scaled integer arithmetic to avoid floating-point noise.

The `/auctions/$auctionUuid/bid` route is gated by detail `can_set_bet`, uses React Hook Form with the Zod bid schema, maps API `422 errors[field=price]` to the input, and prevents duplicate pending submissions. Success invalidates list, detail, and both bid-history query variants, shows a toast, and navigates back to the refreshed auction detail.

## Verification

```bash
npm run lint
npm run check:fsd
npm run typecheck
npm run test
npm run build
```

The critical integration suite can be run separately:

```bash
npm run test -- --run src/app/tests/auctions-page.test.tsx src/app/tests/bid-page.test.tsx src/app/tests/bets-page.test.tsx src/shared/mocks/handlers.test.ts
```

It covers URL-to-request filtering, successful stateful mutation, server-side `422` field errors, blocked bidding, hidden history, and list/detail/bets consistency. MSW and its mutable store reset after every test.

## Stateful mock API

The mock backend keeps list, detail, and bid-history data in one in-memory store. Reloading the browser or calling `resetMockStore()` restores the deterministic seed state.

Implemented operations:

- `POST /api/v1/auctions/list`
- `GET /api/v1/auctions/:auctionUuid`
- `GET /api/v1/auctions/:auctionUuid/bets`
- `POST /api/v1/auctions/:auctionUuid/bets`

The list operation supports the required filters, supported sorting keys, and pagination. Bid history excludes rejected or cancelled rows by default and includes them when `all=true`. Hidden history always returns an empty list.

### Mock scenarios

| Scenario           | UUID                                   | Purpose                                   |
| ------------------ | -------------------------------------- | ----------------------------------------- |
| Active, first bid  | `11111111-1111-4111-8111-111111111111` | User may place an initial bid             |
| Active, leading    | `22222222-2222-4222-8222-222222222222` | User may change a leading bid             |
| Active, losing     | `33333333-3333-4333-8333-333333333333` | User may change a losing bid              |
| Finished, winner   | `44444444-4444-4444-8444-444444444444` | Visible history, winner, and rejected bid |
| Planning, no bids  | `55555555-5555-4555-8555-555555555555` | Empty bid history                         |
| Hidden history     | `66666666-6666-4666-8666-666666666666` | Protected bid history                     |
| Hidden contacts    | `77777777-7777-4777-8777-777777777777` | Hidden addresses and contacts             |
| Hidden cargo price | `88888888-8888-4888-8888-888888888888` | Cargo price and places restrictions       |
| Nullable fields    | `99999999-9999-4999-8999-999999999999` | Null and zero-value coverage              |
| Cancelled auction  | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | Cancelled and unknown trading status      |
| Unknown enums      | `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb` | Contract `Unknown` enum branches          |

The seed set covers every `AuctionStatus`, every `AuctionType`, every `TradingStatus` across list/detail representations, and every `BidMeasurementType`.

### Error scenarios

- List `401`: send `{ "cargo_num": "scenario-401" }`.
- List `503`: send `{ "cargo_num": "scenario-503" }`.
- Detail, bets, or bid `401`: use UUID `00000000-0000-0000-0000-000000000401`.
- Detail, bets, or bid `503`: use UUID `00000000-0000-0000-0000-000000000503`.
- `404`: use any unknown UUID.
- Bid `422`: send a non-numeric/non-positive price, violate min/max/step, or bid on an auction where `can_set_bet` is false.
- Bid form server-field `422`: submit the valid-looking reserved price `499500`.

All mock errors use `application/problem+json` and preserve a deterministic `trace_id`.

### Bid mutation rule

The mock keeps one active bid for the current user (`subscriber_id=13`). A later submission replaces that active bid; rejected historical rows are retained. Ranking is ascending for `Request`, `Down`, and `FixPrice`, and descending for `Up`. A successful mutation updates:

- bid history and places;
- detail and list current prices;
- current-user bid and last-bid fields;
- `Leading` or `Losing` trading status;
- price-per-kilometre derived from the no-VAT price.

The mock derives no-VAT values using a 20% VAT rate. A successful set-bid response has an empty `200` body, matching the OpenAPI operation.

## Manual verification checklist

Use the UUIDs and triggers above after `npm run dev`:

- [ ] Open `/auctions`, apply multiple filters, paginate, reload, and confirm the URL restores the same state.
- [ ] Hover or focus a card detail link, then open it and confirm the detail route renders directly.
- [ ] Place a bid on the active first-bid scenario and confirm the refreshed detail shows the new price and status.
- [ ] Open that auction's history and confirm the current user's bid is present.
- [ ] Submit `499500` and confirm the server `422` message appears on the price field.
- [ ] Open the finished scenario's bid route and confirm submission is unavailable.
- [ ] Open the hidden-history scenario with and without `?all=true` and confirm no bid rows or protected controls appear.
- [ ] Trigger list/detail `401`, unknown-UUID `404`, and `503`, then confirm distinct Russian error states and technical details.
- [ ] Check list, detail, history, filters, and bid form at 360px and desktop width using keyboard-only navigation.

The automated suite verifies the corresponding data and navigation behavior. Responsive CSS, semantic structure, labels, focus behavior, and reduced-motion rules were additionally reviewed in code; a physical-device/browser matrix was not available in this environment.

## Limitations and trade-offs

- MSW state is intentionally in-memory; a full browser reload resets bids to deterministic seed data.
- The app has no real authentication, persistence, or production backend connection.
- Runtime handling rejects missing or malformed JSON response bodies, but does not perform full Zod validation of every successful OpenAPI response field.
- Mock latency and failures are deterministic and cannot represent every production network race.
- Responsive behavior is covered by component tests and CSS review, not a physical-device/browser compatibility matrix.

## Current scope

Phases 1–7 are implemented: the stateful mock API, domain ViewModels and validation, URL-driven auction list, detail page, gated bid history, link-addressable set/change-bid form, critical integration coverage, and final quality/documentation audit.
