import { describe, expect, it } from "vitest";
import type { BetItem } from "../../../shared/api/types";
import {
  countBidParticipants,
  mapBidRow,
  shouldShowBidRank,
} from "./view-model";

describe("bid ViewModels", () => {
  it("counts unique participants and ignores missing IDs", () => {
    const bets: BetItem[] = [
      { subscriber_id: 13 },
      { subscriber_id: 13 },
      { subscriber_id: 21 },
      {},
    ];
    expect(countBidParticipants(bets)).toBe(2);
  });

  it("maps cancelled bids and nullable price information safely", () => {
    const viewModel = mapBidRow(
      {
        id: 1,
        organization_name: "",
        contact_phone: "",
        is_rejected: true,
        cancel_reason: "  Отменена организатором  ",
        place: 2,
        price_info: {
          price_with_vat: null,
          price_no_vat: null,
          payment_type: null,
          vat_rate: null,
        },
      },
      { currencyCode: 643 },
    );

    expect(viewModel.organizationName).toBe("—");
    expect(viewModel.priceWithVat).toBe("—");
    expect(viewModel.isRejectedOrCancelled).toBe(true);
    expect(viewModel.cancellationReason).toBe("Отменена организатором");
  });

  it("hides empty cancellation reasons and optionally hides rank", () => {
    expect(mapBidRow({ cancel_reason: "  " }).cancellationReason).toBeNull();
    expect(shouldShowBidRank(false, 0)).toBe(true);
    expect(shouldShowBidRank(true, 1)).toBe(false);
    expect(mapBidRow({ place: 1 }, { hidePlaces: true }).rank).toBeNull();
  });
});
