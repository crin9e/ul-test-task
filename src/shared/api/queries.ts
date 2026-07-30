import {
  keepPreviousData,
  type QueryClient,
  useQuery,
} from "@tanstack/react-query";
import { normalizeAuctionListRequest } from "./auction-request";
import { ApiError, getAuction, getAuctionBets, listAuctions } from "./client";
import type { AuctionListRequest } from "./types";

export const auctionQueryKeys = {
  all: ["auctions"] as const,
  lists: () => [...auctionQueryKeys.all, "list"] as const,
  list: (request: AuctionListRequest) =>
    [
      ...auctionQueryKeys.lists(),
      normalizeAuctionListRequest(request),
    ] as const,
  details: () => [...auctionQueryKeys.all, "detail"] as const,
  detail: (auctionUuid: string) =>
    [...auctionQueryKeys.details(), auctionUuid] as const,
  betsRoot: () => [...auctionQueryKeys.all, "bets"] as const,
  betsByAuction: (auctionUuid: string) =>
    [...auctionQueryKeys.betsRoot(), auctionUuid] as const,
  bets: (auctionUuid: string, all = false) =>
    [...auctionQueryKeys.betsByAuction(auctionUuid), { all }] as const,
};

export function shouldRetryAuctionQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiError) {
    return error.status === 503 && failureCount < 1;
  }

  return failureCount < 1;
}

export function useAuctionList(request: AuctionListRequest) {
  const normalizedRequest = normalizeAuctionListRequest(request);

  return useQuery({
    queryKey: auctionQueryKeys.list(normalizedRequest),
    queryFn: ({ signal }) => listAuctions(normalizedRequest, signal),
    placeholderData: keepPreviousData,
    retry: shouldRetryAuctionQuery,
  });
}

export function useAuctionDetail(
  auctionUuid: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: auctionQueryKeys.detail(auctionUuid),
    queryFn: ({ signal }) => getAuction(auctionUuid, signal),
    enabled: options.enabled ?? true,
    retry: shouldRetryAuctionQuery,
  });
}

export function useAuctionBets(
  auctionUuid: string,
  all = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: auctionQueryKeys.bets(auctionUuid, all),
    queryFn: ({ signal }) => getAuctionBets(auctionUuid, all, signal),
    enabled: options.enabled ?? true,
    retry: shouldRetryAuctionQuery,
  });
}

export function prefetchAuctionDetail(
  queryClient: QueryClient,
  auctionUuid: string,
): Promise<void> {
  return queryClient.prefetchQuery({
    queryKey: auctionQueryKeys.detail(auctionUuid),
    queryFn: ({ signal }) => getAuction(auctionUuid, signal),
    retry: shouldRetryAuctionQuery,
    staleTime: 30_000,
  });
}
