import { describe, expect, it } from "vitest";
import { CURRENT_USER_SUBSCRIBER_ID, mockStore, resetMockStore } from "./store";

describe("mock store", () => {
  it("contains unique required scenarios and enum branches", () => {
    const scenarios = mockStore.auctions.map((entry) => entry.scenario);
    const auctionStatuses = mockStore.auctions.map(
      (entry) => entry.detail.trading.status,
    );
    const auctionTypes = mockStore.auctions.map(
      (entry) => entry.detail.main.auc_type,
    );
    const tradingStatuses = mockStore.auctions.map(
      (entry) => entry.detail.trading.status_mobile,
    );
    const bidMeasurementTypes = mockStore.auctions.map(
      (entry) => entry.detail.trading.bid_measurement_type,
    );

    expect(new Set(scenarios).size).toBe(scenarios.length);
    expect(scenarios).toEqual(
      expect.arrayContaining([
        "active-first-bid",
        "active-leading",
        "active-losing",
        "finished-visible-winner",
        "planning-no-bids",
        "hidden-history",
        "hidden-addresses-contacts",
        "hidden-cargo-price",
        "nullable-fields",
        "canceled-auction",
        "unknown-runtime-safe",
      ]),
    );
    expect(auctionStatuses).toEqual(
      expect.arrayContaining([
        "Planning",
        "Auction",
        "DeterminateWinner",
        "WaitDeal",
        "InProgress",
        "Finished",
        "Stopped",
        "Canceled",
        "Unknown",
      ]),
    );
    expect(auctionTypes).toEqual(
      expect.arrayContaining(["Request", "Up", "Down", "FixPrice", "Unknown"]),
    );
    expect(tradingStatuses).toEqual(
      expect.arrayContaining([
        "NotParticipating",
        "Leading",
        "Losing",
        "OnPending",
        "Confirmed",
        "ChoosingWinner",
        "Winner",
        "Accepted",
        "Unknown",
      ]),
    );
    expect(bidMeasurementTypes).toEqual(
      expect.arrayContaining(["PerRoute", "PerKm", "Unknown"]),
    );
  });

  it("restores the deterministic seed state", () => {
    const entry = mockStore.auctions.find(
      (auction) => auction.scenario === "active-first-bid",
    );
    expect(entry).toBeDefined();

    entry!.detail.trading.status_mobile = "Leading";
    entry!.detail.trading.your!.bet = true;
    entry!.detail.trading.your!.last_bet = 79_500;

    resetMockStore();

    const resetEntry = mockStore.auctions.find(
      (auction) => auction.scenario === "active-first-bid",
    );
    expect(resetEntry?.detail.trading.status_mobile).toBe("NotParticipating");
    expect(resetEntry?.detail.trading.your).toMatchObject({
      bet: false,
      last_bet: null,
    });
    expect(
      resetEntry?.bets.some(
        (bet) => bet.subscriber_id === CURRENT_USER_SUBSCRIBER_ID,
      ),
    ).toBe(false);
  });

  it("keeps multi-point list summaries consistent with detail routes", () => {
    const entry = mockStore.auctions.find(
      (auction) => auction.scenario === "active-first-bid",
    );
    expect(entry).toBeDefined();

    expect(entry?.listItem.route?.load?.points_count).toBe(2);
    expect(entry?.listItem.route?.unload?.points_count).toBe(2);
    expect(entry?.detail.routes.map((route) => route.op_type)).toEqual([
      "Loading",
      "Loading",
      "Unloading",
      "Unloading",
    ]);
  });
});
