import type { AuctionListItem, AuctionShowResponse } from '../../../shared/api/types';
import {
  EMPTY_VALUE,
  formatDateTime,
  formatMoney,
  formatNullableValue,
  formatNumber,
  formatQuantity,
  parseNullableNumber,
} from './formatters';
import {
  getAuctionStatusLabel,
  getAuctionTypeLabel,
  getBidMeasurementLabel,
  getPaymentDelayLabel,
  getTradingStatusLabel,
} from './labels';

export type AuctionPrimaryActionKind = 'place-bid' | 'change-bid' | 'view-bids' | 'unavailable';

export interface AuctionPrimaryAction {
  kind: AuctionPrimaryActionKind;
  label: string;
  destination: 'bid' | 'bets' | null;
  disabled: boolean;
}

export interface AuctionListItemViewModel {
  id: number | null;
  uuid: string | null;
  cargoNumber: string;
  auctionType: string;
  auctionStatus: string;
  tradingStatus: string;
  organizerName: string | null;
  organizerHidden: boolean;
  routeSummary: string;
  loadCity: string;
  loadDate: string;
  unloadCity: string;
  unloadDate: string;
  cargoName: string;
  weight: string;
  volume: string;
  bodyType: string;
  truckCount: number | null;
  currentPrice: string;
  pricePerKm: string;
  hasBid: boolean;
  action: AuctionPrimaryAction;
}

export interface AuctionRoutePointViewModel {
  rowNumber: number;
  operation: string;
  date: string;
  city: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
}

export interface AuctionDetailViewModel {
  id: number | null;
  uuid: string | null;
  cargoNumber: string;
  auctionType: string;
  auctionStatus: string;
  tradingStatus: string;
  bidMeasurement: string;
  createdAt: string;
  organizerName: string;
  organizerInn: string;
  organizerKpp: string;
  contacts: AuctionShowResponse['contacts'];
  routes: AuctionRoutePointViewModel[];
  addressesAndContactsHidden: boolean;
  cargoPrice: string | null;
  cargoPriceHidden: boolean;
  currentPrice: string;
  minPrice: string;
  maxPrice: string;
  step: string;
  paymentDelay: string;
  historyHidden: boolean;
  action: AuctionPrimaryAction;
}

export function selectAuctionPrimaryAction(input: {
  canSetBid: boolean | null | undefined;
  hasBid: boolean | null | undefined;
  historyHidden: boolean | null | undefined;
}): AuctionPrimaryAction {
  if (input.canSetBid === true) {
    return input.hasBid === true
      ? { kind: 'change-bid', label: 'Изменить ставку', destination: 'bid', disabled: false }
      : { kind: 'place-bid', label: 'Сделать ставку', destination: 'bid', disabled: false };
  }
  if (input.historyHidden === true) {
    return {
      kind: 'unavailable',
      label: 'История ставок скрыта',
      destination: null,
      disabled: true,
    };
  }
  return {
    kind: 'view-bids',
    label: 'Смотреть ставки',
    destination: 'bets',
    disabled: false,
  };
}

export function getAuctionRouteSummary(route: AuctionListItem['route']): string {
  const loadCity = route?.load?.city?.trim();
  const unloadCity = route?.unload?.city?.trim();
  if (loadCity && unloadCity) {
    return `${loadCity} → ${unloadCity}`;
  }
  return loadCity || unloadCity || EMPTY_VALUE;
}

export function mapAuctionListItem(
  dto: AuctionListItem,
  options: { historyHidden?: boolean } = {},
): AuctionListItemViewModel {
  const organizerHidden = dto.organizer?.is_hide_organization === true;
  const currencyCode = dto.payment?.currency_code;
  const formattedPricePerKm = formatMoney(dto.main?.price_per_km, currencyCode);

  return {
    id: dto.main?.id ?? null,
    uuid: dto.main?.order_uid ?? null,
    cargoNumber: formatNullableValue(dto.main?.cargo_num),
    auctionType: getAuctionTypeLabel(dto.main?.auc_type),
    auctionStatus: getAuctionStatusLabel(dto.trading?.status),
    tradingStatus: getTradingStatusLabel(dto.trading?.status_mobile),
    organizerName: organizerHidden
      ? null
      : formatNullableValue(dto.organizer?.organization_name),
    organizerHidden,
    routeSummary: getAuctionRouteSummary(dto.route),
    loadCity: formatNullableValue(dto.route?.load?.city),
    loadDate: formatDateTime(dto.route?.load?.date),
    unloadCity: formatNullableValue(dto.route?.unload?.city),
    unloadDate: formatDateTime(dto.route?.unload?.date),
    cargoName: formatNullableValue(dto.cargo?.name),
    weight: formatQuantity(dto.cargo?.weight, 'т'),
    volume: formatQuantity(dto.cargo?.volume, 'м³'),
    bodyType: formatNullableValue(dto.cargo?.body_type),
    truckCount: dto.cargo?.truck_count ?? null,
    currentPrice: formatMoney(dto.trading?.price?.current, currencyCode),
    pricePerKm: formattedPricePerKm === EMPTY_VALUE
      ? EMPTY_VALUE
      : `${formattedPricePerKm}/км`,
    hasBid: dto.trading?.your?.bet === true,
    action: selectAuctionPrimaryAction({
      canSetBid: dto.trading?.can_set_bet,
      hasBid: dto.trading?.your?.bet,
      historyHidden: options.historyHidden,
    }),
  };
}

function getOperationLabel(value: string | null | undefined): string {
  switch (value) {
    case 'Loading':
      return 'Погрузка';
    case 'Unloading':
      return 'Выгрузка';
    case 'Unknown':
    case null:
    case undefined:
      return 'Неизвестная операция';
    default:
      return 'Неизвестная операция';
  }
}

export function mapAuctionDetail(dto: AuctionShowResponse): AuctionDetailViewModel {
  const addressesAndContactsHidden = dto.trading.hide_points_address_and_contacts === true;
  const cargoPriceHidden = dto.trading.no_view_cargo_price === true;
  const historyHidden = dto.trading.hide_bets_history === true || dto.hide_bets_history === true;
  const currencyCode = dto.payment.currency_code ?? dto.cargo.currency;
  const price = dto.trading.price;

  return {
    id: dto.main.id ?? null,
    uuid: dto.main.order_uid ?? null,
    cargoNumber: formatNullableValue(dto.main.cargo_num),
    auctionType: getAuctionTypeLabel(dto.main.auc_type),
    auctionStatus: getAuctionStatusLabel(dto.trading.status),
    tradingStatus: getTradingStatusLabel(dto.trading.status_mobile),
    bidMeasurement: getBidMeasurementLabel(dto.trading.bid_measurement_type),
    createdAt: formatDateTime(dto.main.created_at),
    organizerName: formatNullableValue(dto.organizer.organization_name),
    organizerInn: formatNullableValue(dto.organizer.organization_inn),
    organizerKpp: formatNullableValue(dto.organizer.organization_kpp),
    contacts: addressesAndContactsHidden ? [] : dto.contacts,
    routes: [...dto.routes]
      .sort((left, right) => (left.row_num ?? 0) - (right.row_num ?? 0))
      .map((route) => ({
        rowNumber: route.row_num ?? 0,
        operation: getOperationLabel(route.op_type),
        date: formatDateTime(route.start_date),
        city: formatNullableValue(route.location?.city_name),
        address: addressesAndContactsHidden ? null : route.location?.loading_address || null,
        contactName: addressesAndContactsHidden ? null : route.contact?.name || null,
        contactPhone: addressesAndContactsHidden ? null : route.contact?.phone || null,
      })),
    addressesAndContactsHidden,
    cargoPrice: cargoPriceHidden
      ? null
      : formatMoney(parseNullableNumber(dto.cargo.price), dto.cargo.currency),
    cargoPriceHidden,
    currentPrice: formatMoney(price?.current, currencyCode),
    minPrice: formatMoney(price?.min, currencyCode),
    maxPrice: formatMoney(price?.max, currencyCode),
    step: formatMoney(price?.step, currencyCode),
    paymentDelay: dto.payment.delay === null || dto.payment.delay === undefined
      ? getPaymentDelayLabel(dto.payment.delay_type)
      : `${formatNumber(dto.payment.delay)} · ${getPaymentDelayLabel(dto.payment.delay_type)}`,
    historyHidden,
    action: selectAuctionPrimaryAction({
      canSetBid: dto.trading.can_set_bet,
      hasBid: dto.trading.your?.bet,
      historyHidden,
    }),
  };
}
