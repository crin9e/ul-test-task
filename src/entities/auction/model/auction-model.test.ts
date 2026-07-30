import { describe, expect, it } from 'vitest';
import { mockStore } from '../../../shared/mocks/store';
import {
  EMPTY_VALUE,
  formatDateTime,
  formatMoney,
  formatNullableValue,
  formatQuantity,
} from './formatters';
import {
  getAuctionStatusLabel,
  getAuctionTypeLabel,
  getBidMeasurementLabel,
  getPaymentDelayLabel,
  getTradingStatusLabel,
} from './labels';
import {
  getAuctionRouteSummary,
  mapAuctionDetail,
  mapAuctionListItem,
  selectAuctionPrimaryAction,
} from './view-model';

describe('auction labels', () => {
  it('handles every declared enum value', () => {
    ['Request', 'Up', 'Down', 'FixPrice', 'Unknown'].forEach((value) => {
      expect(getAuctionTypeLabel(value)).not.toContain('undefined');
    });
    [
      'Planning',
      'Auction',
      'DeterminateWinner',
      'WaitDeal',
      'InProgress',
      'Finished',
      'Stopped',
      'Canceled',
      'Unknown',
    ].forEach((value) => {
      expect(getAuctionStatusLabel(value)).not.toContain('undefined');
    });
    [
      'NotParticipating',
      'Leading',
      'Losing',
      'OnPending',
      'Confirmed',
      'ChoosingWinner',
      'Winner',
      'Accepted',
      'Unknown',
    ].forEach((value) => {
      expect(getTradingStatusLabel(value)).not.toContain('undefined');
    });
    ['PerRoute', 'PerKm', 'Unknown'].forEach((value) => {
      expect(getBidMeasurementLabel(value)).not.toContain('undefined');
    });
    ['CalendarDays', 'WorkDays', 'Unknown', null].forEach((value) => {
      expect(getPaymentDelayLabel(value)).not.toContain('undefined');
    });
  });

  it('uses safe fallbacks for unexpected runtime strings', () => {
    expect(getAuctionTypeLabel('FutureType')).toBe('Неизвестный тип');
    expect(getAuctionStatusLabel('FutureStatus')).toBe('Неизвестный статус');
    expect(getTradingStatusLabel('FutureStatus')).toBe('Неизвестный статус участия');
    expect(getBidMeasurementLabel('FutureUnit')).toBe('Неизвестная единица');
    expect(getPaymentDelayLabel('FutureDelay')).toBe('Неизвестный тип отсрочки');
  });
});

describe('auction formatters', () => {
  it('keeps numeric zero distinct from a missing value', () => {
    expect(formatNullableValue(0)).toBe('0');
    expect(formatMoney(0, 643)).not.toBe(EMPTY_VALUE);
    expect(formatQuantity(0, 'т')).toBe('0 т');
    expect(formatNullableValue(null)).toBe(EMPTY_VALUE);
  });

  it('formats known currencies and safely falls back for unknown codes', () => {
    expect(formatMoney(1_500, 643)).toContain('₽');
    expect(formatMoney(1_500, 999)).toContain('код валюты 999');
    expect(formatMoney(1_500, null)).toContain('ден. ед.');
  });

  it('formats valid dates and rejects malformed dates', () => {
    expect(formatDateTime('2026-05-25T16:03:00')).toBe('25.05.2026, 16:03');
    expect(formatDateTime('not-a-date')).toBe(EMPTY_VALUE);
  });
});

describe('auction ViewModels', () => {
  it('builds route summaries with partial-data fallbacks', () => {
    expect(getAuctionRouteSummary({
      load: { city: 'Пермь' },
      unload: { city: 'Москва' },
    })).toBe('Пермь → Москва');
    expect(getAuctionRouteSummary({ load: { city: 'Пермь' } })).toBe('Пермь');
    expect(getAuctionRouteSummary(undefined)).toBe(EMPTY_VALUE);
  });

  it('selects every primary-action branch', () => {
    expect(selectAuctionPrimaryAction({
      canSetBid: true,
      hasBid: false,
      historyHidden: false,
    }).kind).toBe('place-bid');
    expect(selectAuctionPrimaryAction({
      canSetBid: true,
      hasBid: true,
      historyHidden: false,
    }).kind).toBe('change-bid');
    expect(selectAuctionPrimaryAction({
      canSetBid: false,
      hasBid: true,
      historyHidden: false,
    }).kind).toBe('view-bids');
    expect(selectAuctionPrimaryAction({
      canSetBid: false,
      hasBid: false,
      historyHidden: true,
    })).toMatchObject({ kind: 'unavailable', disabled: true, destination: null });
  });

  it('removes hidden organizer data from list ViewModels', () => {
    const source = mockStore.auctions[0].listItem;
    const dto = structuredClone(source);
    dto.organizer = {
      ...dto.organizer,
      is_hide_organization: true,
      organization_name: 'Скрытая организация',
    };

    const viewModel = mapAuctionListItem(dto);
    expect(viewModel.organizerHidden).toBe(true);
    expect(viewModel.organizerName).toBeNull();
  });

  it('removes protected detail data and sorts route points', () => {
    const source = mockStore.auctions.find(
      (entry) => entry.scenario === 'hidden-addresses-contacts',
    );
    expect(source).toBeDefined();
    const dto = structuredClone(source!.detail);
    dto.routes.reverse();

    const viewModel = mapAuctionDetail(dto);
    expect(viewModel.addressesAndContactsHidden).toBe(true);
    expect(viewModel.contacts).toEqual([]);
    expect(viewModel.routes.map((route) => route.rowNumber)).toEqual([1, 2]);
    expect(viewModel.routes.every((route) => (
      route.address === null && route.contactName === null && route.contactPhone === null
    ))).toBe(true);
  });

  it('does not expose hidden cargo prices or hidden-history actions', () => {
    const cargoHidden = mockStore.auctions.find(
      (entry) => entry.scenario === 'hidden-cargo-price',
    );
    const historyHidden = mockStore.auctions.find(
      (entry) => entry.scenario === 'hidden-history',
    );
    expect(cargoHidden).toBeDefined();
    expect(historyHidden).toBeDefined();

    expect(mapAuctionDetail(cargoHidden!.detail).cargoPrice).toBeNull();
    expect(mapAuctionDetail(historyHidden!.detail).action).toMatchObject({
      kind: 'unavailable',
      disabled: true,
    });
  });
});
