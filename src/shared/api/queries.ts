import { useQuery } from "@tanstack/react-query";
import { getAuction, getAuctionBets, listAuctions } from "./client";
import { AuctionListRequest } from "./types";

export const auctionQueryKeys = {
  all: ["auctions"] as const,
  list: (request: AuctionListRequest) =>
    [...auctionQueryKeys.all, "list", request] as const,
  detail: (auctionUuid: string) =>
    [...auctionQueryKeys.all, "detail", auctionUuid] as const,
  bets: (auctionUuid: string, all = false) =>
    [...auctionQueryKeys.all, "bets", auctionUuid, all] as const,
};

export function useAuctionList(request: AuctionListRequest) {
  return useQuery({
    queryKey: auctionQueryKeys.list(request),
    queryFn: () => listAuctions(request),
    retry: 1,
  });
}

export function useAuctionDetail(auctionUuid: string) {
  return useQuery({
    queryKey: auctionQueryKeys.detail(auctionUuid),
    queryFn: () => getAuction(auctionUuid),
    retry: 1,
  });
}

export function useAuctionBets(auctionUuid: string, all = false) {
  return useQuery({
    queryKey: auctionQueryKeys.bets(auctionUuid, all),
    queryFn: () => getAuctionBets(auctionUuid, all),
    retry: 1,
  });
}
