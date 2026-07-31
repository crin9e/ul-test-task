import type { AuctionListRequest } from "../../../shared/api";
import { normalizeAuctionListRequest } from "../../../shared/api";
import { parseAuctionListSearch, type AuctionListSearch } from "./search";

export { normalizeAuctionListRequest } from "../../../shared/api";

type AuctionSortField = "start_time" | "current_price" | "price_per_km";
type AuctionSortDirection = "asc" | "desc";

function mapSortValue(
  value: AuctionListSearch["sort"],
): Partial<Record<AuctionSortField, AuctionSortDirection>> | undefined {
  if (!value) {
    return undefined;
  }
  const separatorIndex = value.lastIndexOf("_");
  const field = value.slice(0, separatorIndex) as AuctionSortField;
  const direction = value.slice(separatorIndex + 1) as AuctionSortDirection;
  return { [field]: direction };
}

export function buildAuctionListRequest(value: unknown): AuctionListRequest {
  const search = parseAuctionListSearch(value);
  return normalizeAuctionListRequest({
    page: search.page,
    per_page: search.perPage,
    cargo_num: search.cargoNum,
    status: search.status,
    statuses: search.statuses,
    auc_type: search.aucType,
    load_city: search.loadCity,
    unload_city: search.unloadCity,
    load_date_from: search.loadDateFrom,
    load_date_to: search.loadDateTo,
    is_available: search.isAvailable,
    is_bidder: search.isBidder,
    current_price_from: search.currentPriceFrom,
    current_price_to: search.currentPriceTo,
    sort: mapSortValue(search.sort),
  });
}
