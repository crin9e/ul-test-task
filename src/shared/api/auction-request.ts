import type { AuctionListRequest } from "./types";

function sortedUnique<TValue extends string | number>(
  values: TValue[] | undefined,
): TValue[] | undefined {
  if (!values?.length) {
    return undefined;
  }

  return [...new Set(values)].sort((left, right) =>
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right)),
  );
}

export function normalizeAuctionListRequest(
  request: AuctionListRequest,
): AuctionListRequest {
  return {
    page: request.page ?? 1,
    per_page: request.per_page ?? 20,
    ...(request.cargo_num ? { cargo_num: request.cargo_num } : {}),
    ...(request.status?.length ? { status: sortedUnique(request.status) } : {}),
    ...(request.statuses?.length
      ? { statuses: sortedUnique(request.statuses) }
      : {}),
    ...(request.auc_type?.length
      ? { auc_type: sortedUnique(request.auc_type) }
      : {}),
    ...(request.load_city ? { load_city: request.load_city } : {}),
    ...(request.unload_city ? { unload_city: request.unload_city } : {}),
    ...(request.load_date_from
      ? { load_date_from: request.load_date_from }
      : {}),
    ...(request.load_date_to ? { load_date_to: request.load_date_to } : {}),
    ...(request.is_available !== undefined
      ? { is_available: request.is_available }
      : {}),
    ...(request.is_bidder !== undefined
      ? { is_bidder: request.is_bidder }
      : {}),
    ...(request.current_price_from !== undefined &&
    request.current_price_from !== null
      ? { current_price_from: request.current_price_from }
      : {}),
    ...(request.current_price_to !== undefined &&
    request.current_price_to !== null
      ? { current_price_to: request.current_price_to }
      : {}),
    ...(request.sort && Object.keys(request.sort).length
      ? {
          sort: Object.fromEntries(
            Object.entries(request.sort).sort(([left], [right]) =>
              left.localeCompare(right),
            ),
          ),
        }
      : {}),
  };
}
