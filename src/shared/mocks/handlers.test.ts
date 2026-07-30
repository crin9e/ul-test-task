import { describe, expect, it } from 'vitest';
import type {
  AuctionListRequest,
  AuctionListResponseBase,
  AuctionShowResponse,
  BetListResponse,
  ValidationProblem,
} from '../api/types';
import {
  CURRENT_USER_SUBSCRIBER_ID,
  mockStore,
  resetMockStore,
  UNAVAILABLE_AUCTION_UUID,
} from './store';

const API_URL = `${window.location.origin}/api/v1`;

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function listAuctions(request: AuctionListRequest): Promise<AuctionListResponseBase> {
  const response = await postJson('/auctions/list', request);
  expect(response.status).toBe(200);
  return response.json() as Promise<AuctionListResponseBase>;
}

async function getDetail(auctionUuid: string): Promise<AuctionShowResponse> {
  const response = await fetch(`${API_URL}/auctions/${auctionUuid}`);
  expect(response.status).toBe(200);
  return response.json() as Promise<AuctionShowResponse>;
}

async function getBets(auctionUuid: string, includeAll = false): Promise<BetListResponse> {
  const response = await fetch(`${API_URL}/auctions/${auctionUuid}/bets?all=${includeAll}`);
  expect(response.status).toBe(200);
  return response.json() as Promise<BetListResponse>;
}

describe('Phase 1 mock backend', () => {
  it('seeds the required scenarios and enum branches', () => {
    expect(mockStore.auctions).toHaveLength(11);
    expect(new Set(mockStore.auctions.map((entry) => entry.scenario))).toEqual(new Set([
      'active-first-bid',
      'active-leading',
      'active-losing',
      'finished-visible-winner',
      'planning-no-bids',
      'hidden-history',
      'hidden-addresses-contacts',
      'hidden-cargo-price',
      'nullable-fields',
      'canceled-auction',
      'unknown-runtime-safe',
    ]));
    expect(new Set(mockStore.auctions.map((entry) => entry.detail.trading.status))).toEqual(new Set([
      'Planning',
      'Auction',
      'DeterminateWinner',
      'WaitDeal',
      'InProgress',
      'Finished',
      'Stopped',
      'Canceled',
      'Unknown',
    ]));
    expect(new Set(mockStore.auctions.map((entry) => entry.detail.main.auc_type))).toEqual(new Set([
      'Request',
      'Up',
      'Down',
      'FixPrice',
      'Unknown',
    ]));
    expect(new Set(mockStore.auctions.map((entry) => entry.detail.trading.status_mobile))).toEqual(new Set([
      'NotParticipating',
      'Leading',
      'Losing',
      'OnPending',
      'Confirmed',
      'ChoosingWinner',
      'Winner',
      'Accepted',
      'Unknown',
    ]));
    expect(new Set(mockStore.auctions.map((entry) => entry.detail.trading.bid_measurement_type))).toEqual(new Set([
      'PerRoute',
      'PerKm',
      'Unknown',
    ]));
  });

  it('filters by the required fields using the shared store', async () => {
    const leading = mockStore.auctions.find((entry) => entry.scenario === 'active-leading');
    expect(leading).toBeDefined();

    const response = await listAuctions({
      cargo_num: 'auc-002',
      status: ['Leading'],
      statuses: [2],
      auc_type: ['Down'],
      load_city: leading?.listItem.route?.load?.city,
      unload_city: leading?.listItem.route?.unload?.city,
      load_date_from: leading?.listItem.route?.load?.date,
      load_date_to: leading?.listItem.route?.load?.date,
      is_available: true,
      is_bidder: true,
      current_price_from: 70_000,
      current_price_to: 70_000,
    });

    expect(response.data).toHaveLength(1);
    expect(response.data?.[0].main?.cargo_num).toBe('AUC-002');
    expect(response.meta?.total).toBe(1);
  });

  it('sorts and paginates with matching metadata', async () => {
    const response = await listAuctions({
      page: 2,
      per_page: 3,
      sort: { current_price: 'desc' },
    });

    expect(response.data).toHaveLength(3);
    expect(response.meta).toMatchObject({
      current_page: 2,
      from: 4,
      last_page: 4,
      per_page: 3,
      to: 6,
      total: 11,
    });
    const prices = response.data?.map((item) => item.trading?.price?.current);
    expect(prices).toEqual([88_000, 82_000, 70_000]);
  });

  it('returns problem+json for reserved and unknown scenarios', async () => {
    const unauthorized = await postJson('/auctions/list', { cargo_num: 'scenario-401' });
    const unavailable = await fetch(`${API_URL}/auctions/${UNAVAILABLE_AUCTION_UUID}`);
    const notFound = await fetch(`${API_URL}/auctions/cccccccc-cccc-4ccc-8ccc-cccccccccccc`);

    expect(unauthorized.status).toBe(401);
    expect(unavailable.status).toBe(503);
    expect(notFound.status).toBe(404);
    expect(unauthorized.headers.get('content-type')).toContain('application/problem+json');
    expect(unavailable.headers.get('content-type')).toContain('application/problem+json');
    expect(notFound.headers.get('content-type')).toContain('application/problem+json');
  });

  it('supports all=true and does not expose hidden history', async () => {
    const finished = mockStore.auctions.find((entry) => entry.scenario === 'finished-visible-winner');
    const hidden = mockStore.auctions.find((entry) => entry.scenario === 'hidden-history');
    expect(finished).toBeDefined();
    expect(hidden).toBeDefined();

    const activeOnly = await getBets(finished!.uuid);
    const allBets = await getBets(finished!.uuid, true);
    const hiddenBets = await getBets(hidden!.uuid, true);

    expect(activeOnly.bets).toHaveLength(2);
    expect(allBets.bets).toHaveLength(3);
    expect(allBets.bets.some((bet) => bet.is_rejected)).toBe(true);
    expect(hiddenBets.bets).toEqual([]);
  });

  it('returns field validation errors for invalid and blocked bids', async () => {
    const active = mockStore.auctions.find((entry) => entry.scenario === 'active-first-bid');
    const finished = mockStore.auctions.find((entry) => entry.scenario === 'finished-visible-winner');
    expect(active).toBeDefined();
    expect(finished).toBeDefined();

    const invalidBodies = [
      { price: '10000' },
      { price: 9_500 },
      { price: 10_001 },
      { price: 500_500 },
    ];

    for (const body of invalidBodies) {
      const response = await postJson(`/auctions/${active!.uuid}/bets`, body);
      const problem = await response.json() as ValidationProblem;
      expect(response.status).toBe(422);
      expect(response.headers.get('content-type')).toContain('application/problem+json');
      expect(problem.errors[0].field).toBe('price');
    }

    const blocked = await postJson(`/auctions/${finished!.uuid}/bets`, { price: 120_000 });
    const blockedProblem = await blocked.json() as ValidationProblem;
    expect(blocked.status).toBe(422);
    expect(blockedProblem.errors[0]).toMatchObject({ field: 'price', code: 'bidding_unavailable' });
  });

  it('adds a bid and updates list, detail, history, price, status, and ranking', async () => {
    const active = mockStore.auctions.find((entry) => entry.scenario === 'active-first-bid');
    expect(active).toBeDefined();

    const response = await postJson(`/auctions/${active!.uuid}/bets`, { price: 79_500 });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');

    const detail = await getDetail(active!.uuid);
    const bets = await getBets(active!.uuid);
    const list = await listAuctions({ cargo_num: 'AUC-001' });
    const userBet = bets.bets.find((bet) => bet.subscriber_id === CURRENT_USER_SUBSCRIBER_ID);

    expect(detail.trading.status_mobile).toBe('Leading');
    expect(detail.trading.price?.current).toBe(79_500);
    expect(detail.trading.your).toMatchObject({ bet: true, last_bet: 79_500 });
    expect(list.data?.[0].trading).toMatchObject({
      status_mobile: 'Leading',
      is_bidder: true,
      price: { current: 79_500 },
      your: { bet: true, last_bet: 79_500 },
    });
    expect(userBet).toMatchObject({ price_with_vat: 79_500, place: 1, is_win: false });
  });

  it('changes the current user bid without adding a duplicate and reset restores seeds', async () => {
    const leading = mockStore.auctions.find((entry) => entry.scenario === 'active-leading');
    const firstBid = mockStore.auctions.find((entry) => entry.scenario === 'active-first-bid');
    expect(leading).toBeDefined();
    expect(firstBid).toBeDefined();

    const originalCount = leading!.bets.length;
    await postJson(`/auctions/${leading!.uuid}/bets`, { price: 73_500 });
    const changedBets = await getBets(leading!.uuid);
    const changedDetail = await getDetail(leading!.uuid);

    expect(changedBets.bets).toHaveLength(originalCount);
    expect(changedBets.bets.filter((bet) => bet.subscriber_id === CURRENT_USER_SUBSCRIBER_ID)).toHaveLength(1);
    expect(changedDetail.trading.status_mobile).toBe('Losing');
    expect(changedDetail.trading.price?.current).toBe(72_000);

    await postJson(`/auctions/${firstBid!.uuid}/bets`, { price: 79_500 });
    resetMockStore();
    const resetEntry = mockStore.auctions.find((entry) => entry.scenario === 'active-first-bid');
    expect(resetEntry?.detail.trading.your?.bet).toBe(false);
    expect(resetEntry?.bets.some((bet) => bet.subscriber_id === CURRENT_USER_SUBSCRIBER_ID)).toBe(false);
  });
});
