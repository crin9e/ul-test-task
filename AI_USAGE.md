# AI Usage

AI assistance was used to setup the project, inspect the OpenAPI contract; implement the Phase 1 MSW seed store and handlers, add focused mock-backend tests and documentation; implement Phase 2 domain mapping, search parsing, request normalization, and bid validation; implement the Phase 3 query layer, filters, auction cards, pagination, responsive states, and integration tests; implement the Phase 4 detail ViewModel, responsive detail sections, privacy rules, UUID gating, and API-state tests; and implement the Phase 5–6 bid ViewModels, gated history, mutation invalidation, RHF/Zod bid form, toasts, and critical-flow tests.

## Review decisions

- OpenAPI-generated types remain the response-shape boundary.
- List, detail, and bets use one mutable store rather than duplicate fixtures.
- Successful set-bid returns an empty `200` response because the contract declares no response schema.
- Hidden bid history returns no rows, including when `all=true`.
- The current user's active bid is replaced on a later submission; rejected historical bids remain.
- Ranking direction follows the auction type: `Up` is descending, while `Request`, `Down`, and `FixPrice` are ascending.
- Decimal-safe step validation uses scaled integer arithmetic with the non-null minimum as the base, otherwise zero.
- Pico owns shared component styling; application-specific responsive layout and state variants use CSS Modules.
- Auction DTOs are mapped through pure ViewModel functions, URL search values are parsed defensively, and decimal bid steps use scaled integer validation.

## Carefully checked areas

- OpenAPI enum values and nullable numeric fields.
- `application/problem+json` content types for `401`, `404`, `422`, and `503`.
- Bid mutation consistency across list, detail, and bets.
- Pagination metadata after filtering.
- Reset behavior between tests.
- Every contract enum branch, hidden-data mapping, malformed search fallback, and bid constraint branch.
- Query-key normalization, retry exclusions, detail prefetching, URL filter updates, pagination state preservation, and responsive list semantics.
- Detail route ordering, nullable contract fields, protected-data removal, action visibility, UUID validation, and distinct `401`/`404`/`503` behavior.
- Unique participant counting, hidden-history request gating, rank suppression, exact bid payloads, scoped invalidation, pending submission locks, and `422` field-error mapping.
