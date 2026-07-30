import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, setBid } from "../../../shared/api/client";
import { auctionQueryKeys } from "../../../shared/api/queries";

interface UseSetAuctionBidOptions {
  onSuccess?: () => void;
  onError?: (error: ApiError | Error) => void;
}

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

export function useSetAuctionBid(
  auctionUuid: string,
  options: UseSetAuctionBidOptions = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (price: number) => setBid(auctionUuid, { price }),
    onSuccess: async () => {
      await invalidateAuctionAfterBid(queryClient, auctionUuid);
      options.onSuccess?.();
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
}
