# AI Usage

AI assistance was used to setup the project, inspect the OpenAPI contract, implement the Phase 1 MSW seed store and handlers, add focused mock-backend tests and documentation.

## Review decisions

- OpenAPI-generated types remain the response-shape boundary.
- List, detail, and bets use one mutable store rather than duplicate fixtures.
- Successful set-bid returns an empty `200` response because the contract declares no response schema.
- Hidden bid history returns no rows, including when `all=true`.
- The current user's active bid is replaced on a later submission; rejected historical bids remain.
- Ranking direction follows the auction type: `Up` is descending, while `Request`, `Down`, and `FixPrice` are ascending.
- Decimal-safe step validation uses scaled integer arithmetic with the non-null minimum as the base, otherwise zero.
- Pico owns shared component styling; application-specific responsive layout and state variants use CSS Modules.

## Carefully checked areas

- OpenAPI enum values and nullable numeric fields.
- `application/problem+json` content types for `401`, `404`, `422`, and `503`.
- Bid mutation consistency across list, detail, and bets.
- Pagination metadata after filtering.
- Reset behavior between tests.
