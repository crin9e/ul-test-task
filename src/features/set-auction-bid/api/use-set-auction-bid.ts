import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { auctionQueryKeys, setBid } from "../../../shared/api";

export async function invalidateAuctionAfterBid(
  queryClient: QueryClient,
  auctionUuid: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: auctionQueryKeys.lists(),
    }),
    queryClient.invalidateQueries({
      queryKey: auctionQueryKeys.detail(auctionUuid),
    }),
    queryClient.invalidateQueries({
      queryKey: auctionQueryKeys.betsByAuction(auctionUuid),
    }),
  ]);
}

export function useSetAuctionBid(auctionUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (price: number) => setBid(auctionUuid, { price }),
    onSuccess: async () => {
      await invalidateAuctionAfterBid(queryClient, auctionUuid);
    },
  });
}
