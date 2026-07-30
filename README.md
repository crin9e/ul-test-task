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

## Styling

Pico CSS is loaded globally before application styles. `src/styles.css` contains only Pico design-token overrides and global accessibility behavior. Component-specific layout and visual variants use CSS Modules so they do not override Pico's shared `.container`, `.grid`, or card styles.

## Domain Logic

Auction DTOs remain unchanged at the API boundary and are converted to display ViewModels in `entities/auction`. Enum labels have safe runtime fallbacks, hidden-data flags remove protected values, and numeric zero remains distinct from missing data.

The `/auctions` search parser accepts URL strings or typed values, replaces malformed values with safe defaults, discards invalid enum members, and maps valid state to a normalized `AuctionListRequest`. Array filters use readable comma-separated URL values such as `status=Winner,Accepted`; previously generated JSON-array URLs remain compatible. Supported sort values are `start_time_asc`, `start_time_desc`, `current_price_asc`, `current_price_desc`, `price_per_km_asc`, and `price_per_km_desc`.

The auction list keeps filters, sorting, and pagination in the URL. Desktop uses a persistent Pico filter panel; mobile uses a native modal dialog whose open state is the only value stored in Zustand. TanStack Query retains visible page data while the next page loads and prefetches auction detail on mouse or keyboard intent.

Bid step validation uses the non-null minimum as its base, otherwise zero. Decimal values are compared with scaled integer arithmetic to avoid floating-point noise.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

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

All mock errors use `application/problem+json` and preserve a deterministic `trace_id`.

### Bid mutation rule

The mock keeps one active bid for the current user (`subscriber_id=13`). A later submission replaces that active bid; rejected historical rows are retained. Ranking is ascending for `Request`, `Down`, and `FixPrice`, and descending for `Up`. A successful mutation updates:

- bid history and places;
- detail and list current prices;
- current-user bid and last-bid fields;
- `Leading` or `Losing` trading status;
- price-per-kilometre derived from the no-VAT price.

The mock derives no-VAT values using a 20% VAT rate. A successful set-bid response has an empty `200` body, matching the OpenAPI operation.

## Current scope

Phases 1–3 are implemented: the stateful mock API, domain ViewModels and formatters, pure validation logic, and the complete URL-driven auction list with filters, sorting, pagination, responsive cards, prefetching, and loading/empty/error states. Later phases build the complete detail, history, and bid-form UI.
