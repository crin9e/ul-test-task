import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import {
  auctionQueryKeys,
  prefetchAuctionDetail,
  shouldRetryAuctionQuery,
} from "./queries";

describe("auction queries", () => {
  it("normalizes list request state in query keys", () => {
    const left = auctionQueryKeys.list({
      page: 1,
      per_page: 20,
      status: ["Losing", "Leading", "Losing"],
      statuses: [3, 2, 3],
    });
    const right = auctionQueryKeys.list({
      statuses: [2, 3],
      status: ["Leading", "Losing"],
      per_page: 20,
      page: 1,
    });

    expect(left).toEqual(right);
  });

  it("retries only recoverable failures once", () => {
    const problem = {
      code: "test",
      title: "Test",
      message: "Test error",
    };

    expect(shouldRetryAuctionQuery(0, new ApiError(401, problem))).toBe(false);
    expect(shouldRetryAuctionQuery(0, new ApiError(404, problem))).toBe(false);
    expect(shouldRetryAuctionQuery(0, new ApiError(422, problem))).toBe(false);
    expect(shouldRetryAuctionQuery(0, new ApiError(503, problem))).toBe(true);
    expect(shouldRetryAuctionQuery(1, new ApiError(503, problem))).toBe(false);
    expect(shouldRetryAuctionQuery(0, new TypeError("Network error"))).toBe(
      true,
    );
    expect(shouldRetryAuctionQuery(1, new TypeError("Network error"))).toBe(
      false,
    );
  });

  it("prefetches detail by auction UUID", async () => {
    const queryClient = new QueryClient();
    const auctionUuid = "11111111-1111-4111-8111-111111111111";

    await prefetchAuctionDetail(queryClient, auctionUuid);

    expect(
      queryClient.getQueryData<{
        main: { order_uid?: string };
      }>(auctionQueryKeys.detail(auctionUuid))?.main.order_uid,
    ).toBe(auctionUuid);
  });
});
