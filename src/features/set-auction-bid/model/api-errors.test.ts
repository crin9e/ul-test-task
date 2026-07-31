import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { ApiError, auctionQueryKeys } from "../../../shared/api";
import { invalidateAuctionAfterBid } from "../api/use-set-auction-bid";
import { getBidPriceApiError } from "./api-errors";

describe("set-bid API integration", () => {
  it("keeps a 422 price error accessible to the form", () => {
    const error = new ApiError(422, {
      code: "validation_failed",
      title: "Ошибка",
      message: "Некорректная ставка",
      errors: [{ field: "price", message: "Цена отклонена." }],
    });

    expect(getBidPriceApiError(error)).toBe("Цена отклонена.");
    expect(
      getBidPriceApiError(
        new ApiError(503, {
          code: "unavailable",
          title: "Ошибка",
          message: "Недоступно",
        }),
      ),
    ).toBeNull();
  });

  it("invalidates only affected auction query families", async () => {
    const queryClient = new QueryClient();
    const auctionUuid = "11111111-1111-4111-8111-111111111111";
    const otherUuid = "22222222-2222-4222-8222-222222222222";
    const listKey = auctionQueryKeys.list({ page: 1, per_page: 20 });
    const detailKey = auctionQueryKeys.detail(auctionUuid);
    const betsKey = auctionQueryKeys.bets(auctionUuid, false);
    const allBetsKey = auctionQueryKeys.bets(auctionUuid, true);
    const otherDetailKey = auctionQueryKeys.detail(otherUuid);
    const unrelatedKey = ["cities"] as const;

    [
      listKey,
      detailKey,
      betsKey,
      allBetsKey,
      otherDetailKey,
      unrelatedKey,
    ].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

    await invalidateAuctionAfterBid(queryClient, auctionUuid);

    [listKey, detailKey, betsKey, allBetsKey].forEach((queryKey) => {
      expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    });
    [otherDetailKey, unrelatedKey].forEach((queryKey) => {
      expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false);
    });
  });
});
