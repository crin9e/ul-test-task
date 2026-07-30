import { describe, expect, it } from 'vitest';
import {
  deserializeBoolean,
  deserializeStringArray,
  parseAuctionListSearch,
  serializeBoolean,
  serializeStringArray,
} from './search';
import {
  buildAuctionListRequest,
  normalizeAuctionListRequest,
} from './request';

describe('auction list search parsing', () => {
  it('provides safe defaults for empty and malformed input', () => {
    expect(parseAuctionListSearch({})).toEqual({ page: 1, perPage: 20 });
    expect(parseAuctionListSearch(null)).toEqual({ page: 1, perPage: 20 });
    expect(parseAuctionListSearch({
      page: '-3',
      perPage: 'invalid',
      loadDateFrom: 'tomorrow',
      currentPriceFrom: '-1',
    })).toEqual({ page: 1, perPage: 20 });
  });

  it('caps page size and accepts non-negative prices including zero', () => {
    expect(parseAuctionListSearch({
      page: '2',
      perPage: '500',
      currentPriceFrom: '0',
      currentPriceTo: '150000.5',
    })).toMatchObject({
      page: 2,
      perPage: 100,
      currentPriceFrom: 0,
      currentPriceTo: 150000.5,
    });
  });

  it('discards invalid enum values while preserving valid values', () => {
    expect(parseAuctionListSearch({
      status: 'Leading,FutureStatus,Losing',
      statuses: ['2', '99', '6'],
      aucType: ['Down', 'Unknown', 'FixPrice'],
      sort: 'current_price_desc',
    })).toMatchObject({
      status: ['Leading', 'Losing'],
      statuses: [2, 6],
      aucType: ['Down', 'FixPrice'],
      sort: 'current_price_desc',
    });
  });

  it('validates ISO dates and parses boolean values', () => {
    expect(parseAuctionListSearch({
      loadDateFrom: '2026-05-26T15:30:00+03:00',
      loadDateTo: 'invalid',
      isAvailable: 'true',
      isBidder: '0',
    })).toMatchObject({
      loadDateFrom: '2026-05-26T15:30:00+03:00',
      isAvailable: true,
      isBidder: false,
    });
  });

  it('serializes and deserializes arrays and booleans', () => {
    expect(deserializeStringArray(['Leading', 'Losing,Winner'])).toEqual([
      'Leading',
      'Losing',
      'Winner',
    ]);
    expect(serializeStringArray(['Leading', 'Losing'])).toBe('Leading,Losing');
    expect(deserializeBoolean('1')).toBe(true);
    expect(deserializeBoolean('false')).toBe(false);
    expect(serializeBoolean(true)).toBe('true');
    expect(serializeBoolean(undefined)).toBeUndefined();
  });
});

describe('auction list request building', () => {
  it('maps all required filters to snake_case contract fields', () => {
    expect(buildAuctionListRequest({
      page: '3',
      perPage: '50',
      cargoNum: ' AUC-001 ',
      status: ['Losing', 'Leading'],
      statuses: ['6', '2'],
      aucType: ['FixPrice', 'Down'],
      loadCity: 'Пермь',
      unloadCity: 'Москва',
      loadDateFrom: '2026-05-26T15:30:00+03:00',
      loadDateTo: '2026-05-27T15:30:00+03:00',
      isAvailable: 'true',
      isBidder: 'false',
      currentPriceFrom: '0',
      currentPriceTo: '200000',
      sort: 'price_per_km_asc',
    })).toEqual({
      page: 3,
      per_page: 50,
      cargo_num: 'AUC-001',
      status: ['Leading', 'Losing'],
      statuses: [2, 6],
      auc_type: ['Down', 'FixPrice'],
      load_city: 'Пермь',
      unload_city: 'Москва',
      load_date_from: '2026-05-26T15:30:00+03:00',
      load_date_to: '2026-05-27T15:30:00+03:00',
      is_available: true,
      is_bidder: false,
      current_price_from: 0,
      current_price_to: 200000,
      sort: { price_per_km: 'asc' },
    });
  });

  it('omits empty optional values and normalizes query-key arrays', () => {
    expect(buildAuctionListRequest({
      cargoNum: ' ',
      status: [],
      statuses: [],
      aucType: [],
    })).toEqual({ page: 1, per_page: 20 });

    expect(normalizeAuctionListRequest({
      page: 1,
      per_page: 20,
      status: ['Winner', 'Leading', 'Leading'],
      statuses: [6, 2, 2],
    })).toMatchObject({
      status: ['Leading', 'Winner'],
      statuses: [2, 6],
    });
  });
});
