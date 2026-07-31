import type { AuctionListItem, AuctionShowResponse } from "../../../shared/api";
import {
  EMPTY_VALUE,
  formatCurrencyCode,
  formatDateTime,
  formatMoney,
  formatNullableValue,
  formatNumber,
  formatQuantity,
  parseNullableNumber,
} from "../../../shared/lib";
import {
  getAuctionStatusLabel,
  getAuctionTypeLabel,
  getBidMeasurementLabel,
  getPaymentDelayLabel,
  getTradingStatusLabel,
} from "./labels";

export type AuctionPrimaryActionKind =
  "place-bid" | "change-bid" | "view-bids" | "unavailable";

export interface AuctionPrimaryAction {
  kind: AuctionPrimaryActionKind;
  label: string;
  destination: "bid" | "bets" | null;
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
  endDate: string;
  city: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  comment: string | null;
  contractor: string | null;
  contractorInn: string | null;
  cargoFields: AuctionDetailField[];
}

export interface AuctionDetailField {
  label: string;
  value: string;
}

export interface AuctionContactViewModel {
  name: string;
  phone: string;
  workPhone: string;
  email: string;
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
  startTime: string;
  stopTime: string;
  overviewFields: AuctionDetailField[];
  organizerFields: AuctionDetailField[];
  contacts: AuctionContactViewModel[];
  routes: AuctionRoutePointViewModel[];
  addressesAndContactsHidden: boolean;
  cargoFields: AuctionDetailField[];
  vehicleFields: AuctionDetailField[];
  cargoPrice: string | null;
  cargoPriceHidden: boolean;
  paymentFields: AuctionDetailField[];
  tradingFields: AuctionDetailField[];
  currentPrice: string;
  minPrice: string;
  maxPrice: string;
  step: string;
  paymentDelay: string;
  historyHidden: boolean;
  action: AuctionPrimaryAction;
}

function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }
  return value ? "Да" : "Нет";
}

function formatStringList(values: string[]): string {
  return values.length ? values.join(", ") : EMPTY_VALUE;
}

function createField(label: string, value: string): AuctionDetailField {
  return { label, value };
}

function mapLoadingTypes(
  value: AuctionShowResponse["cargo"]["loading_types"],
): string {
  if (!value) {
    return EMPTY_VALUE;
  }
  const labels = [
    value.side ? "боковая" : null,
    value.top ? "верхняя" : null,
    value.rear ? "задняя" : null,
    value.full ? "полная растентовка" : null,
  ].filter((item): item is string => item !== null);
  return formatStringList(labels);
}

function mapDocuments(value: AuctionShowResponse["cargo"]["docs"]): string {
  if (!value) {
    return EMPTY_VALUE;
  }
  const labels = [
    value.tir ? "TIR" : null,
    value.cmr ? "CMR" : null,
    value.t1 ? "T1" : null,
    value.med ? "Медкнижка" : null,
  ].filter((item): item is string => item !== null);
  return formatStringList(labels);
}

function formatTemperatureRange(
  from: number | null | undefined,
  to: number | null | undefined,
): string {
  if (from === null || from === undefined) {
    return to === null || to === undefined
      ? EMPTY_VALUE
      : `до ${formatNumber(to)} °C`;
  }
  if (to === null || to === undefined) {
    return `от ${formatNumber(from)} °C`;
  }
  return `${formatNumber(from)}…${formatNumber(to)} °C`;
}

function mapVehicleFields(dto: AuctionShowResponse): AuctionDetailField[] {
  const car = dto.cargo.car;
  return [
    createField("Тип кузова", formatNullableValue(dto.cargo.body_type)),
    createField("Количество машин", formatNumber(dto.cargo.truck_count)),
    createField(
      "Температурный режим",
      formatTemperatureRange(dto.cargo.temp_from, dto.cargo.temp_to),
    ),
    createField("Типы погрузки", mapLoadingTypes(dto.cargo.loading_types)),
    createField("Документы", mapDocuments(dto.cargo.docs)),
    createField("Тип ТС", formatNullableValue(car?.type)),
    createField("Грузоподъёмность ТС", formatQuantity(car?.weight, "т")),
    createField("Объём ТС", formatQuantity(car?.volume, "м³")),
    createField("Ширина ТС", formatQuantity(car?.width, "м")),
    createField("Длина ТС", formatQuantity(car?.length, "м")),
    createField("Высота ТС", formatQuantity(car?.height, "м")),
    createField("Коники", formatNumber(dto.cargo.conics)),
    createField("Ремни", formatNumber(dto.cargo.belts)),
    createField("ADR", formatNumber(dto.cargo.adr)),
    createField("Сцепка", formatBoolean(dto.cargo.coupling)),
    createField("Пневмоход", formatBoolean(dto.cargo.air_pass)),
    createField("Низкорамник", formatBoolean(dto.cargo.low_loader)),
    createField("Догруз", formatBoolean(dto.cargo.additional_load)),
    createField("Контейнер", formatBoolean(dto.cargo.containered)),
    createField(
      "Тип контейнера",
      formatNullableValue(dto.cargo.container_type),
    ),
    createField(
      "Размер контейнера",
      formatNullableValue(dto.cargo.container_size),
    ),
  ];
}

export function selectAuctionPrimaryAction(input: {
  canSetBid: boolean | null | undefined;
  hasBid: boolean | null | undefined;
  historyHidden: boolean | null | undefined;
}): AuctionPrimaryAction {
  if (input.canSetBid === true) {
    return input.hasBid === true
      ? {
          kind: "change-bid",
          label: "Изменить ставку",
          destination: "bid",
          disabled: false,
        }
      : {
          kind: "place-bid",
          label: "Сделать ставку",
          destination: "bid",
          disabled: false,
        };
  }
  if (input.historyHidden === true) {
    return {
      kind: "unavailable",
      label: "История ставок скрыта",
      destination: null,
      disabled: true,
    };
  }
  return {
    kind: "view-bids",
    label: "Смотреть ставки",
    destination: "bets",
    disabled: false,
  };
}

export function getAuctionRouteSummary(
  route: AuctionListItem["route"],
): string {
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
    weight: formatQuantity(dto.cargo?.weight, "т"),
    volume: formatQuantity(dto.cargo?.volume, "м³"),
    bodyType: formatNullableValue(dto.cargo?.body_type),
    truckCount: dto.cargo?.truck_count ?? null,
    currentPrice: formatMoney(dto.trading?.price?.current, currencyCode),
    pricePerKm:
      formattedPricePerKm === EMPTY_VALUE
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
    case "Loading":
      return "Погрузка";
    case "Unloading":
      return "Выгрузка";
    case "Unknown":
    case null:
    case undefined:
      return "Неизвестная операция";
    default:
      return "Неизвестная операция";
  }
}

export function mapAuctionDetail(
  dto: AuctionShowResponse,
): AuctionDetailViewModel {
  const addressesAndContactsHidden =
    dto.trading.hide_points_address_and_contacts === true;
  const cargoPriceHidden = dto.trading.no_view_cargo_price === true;
  const historyHidden =
    dto.trading.hide_bets_history === true || dto.hide_bets_history === true;
  const currencyCode = dto.payment.currency_code ?? dto.cargo.currency;
  const price = dto.trading.price;
  const startTime = formatDateTime(dto.trading.start_time);
  const stopTime = formatDateTime(dto.trading.stop_time);
  const organizerContacts = addressesAndContactsHidden
    ? []
    : dto.contacts.map((contact) => ({
        name: formatNullableValue(contact.name),
        phone: formatNullableValue(contact.phone),
        workPhone: formatNullableValue(contact.work_phone),
        email: formatNullableValue(contact.email),
      }));
  const cargoPrice = cargoPriceHidden
    ? null
    : formatMoney(parseNullableNumber(dto.cargo.price), dto.cargo.currency);
  const paymentDelay =
    dto.payment.delay === null || dto.payment.delay === undefined
      ? getPaymentDelayLabel(dto.payment.delay_type)
      : `${formatNumber(dto.payment.delay)} · ${getPaymentDelayLabel(dto.payment.delay_type)}`;
  const overviewFields = [
    createField("Тип аукциона", getAuctionTypeLabel(dto.main.auc_type)),
    createField("Статус аукциона", getAuctionStatusLabel(dto.trading.status)),
    createField("Ваш статус", getTradingStatusLabel(dto.trading.status_mobile)),
    createField("Создан", formatDateTime(dto.main.created_at)),
    createField("Начало торгов", startTime),
    createField("Окончание торгов", stopTime),
    createField("Дата заявки", formatDateTime(dto.main.cargo_date)),
    createField("Сборная заявка", formatNullableValue(dto.assembly.num)),
    createField("Дата сборки", formatDateTime(dto.assembly.date)),
  ];
  const organizerFields = [
    createField(
      "Организация",
      formatNullableValue(dto.organizer.organization_name),
    ),
    createField("ИНН", formatNullableValue(dto.organizer.organization_inn)),
    createField("КПП", formatNullableValue(dto.organizer.organization_kpp)),
  ];
  const cargoFields = [
    ...(cargoPrice === null
      ? []
      : [createField("Стоимость груза", cargoPrice)]),
    createField(
      "Международная перевозка",
      formatBoolean(dto.cargo.is_international),
    ),
    createField("Расстояние", formatQuantity(dto.cargo.distance, "км")),
  ];
  const paymentFields = [
    createField("Форма оплаты", formatNullableValue(dto.payment.form)),
    createField("Условие оплаты", formatNullableValue(dto.payment.condition)),
    createField("Отсрочка", paymentDelay),
    createField("Валюта", formatCurrencyCode(dto.payment.currency_code)),
    createField("Предоплата", formatNullableValue(dto.payment.prepay)),
  ];
  const tradingFields = [
    createField(
      "Единица ставки",
      getBidMeasurementLabel(dto.trading.bid_measurement_type),
    ),
    createField(
      "Текущая цена с НДС",
      formatMoney(price?.current, currencyCode),
    ),
    createField(
      "Текущая цена без НДС",
      formatMoney(price?.current_no_vat, currencyCode),
    ),
    createField(
      "Доступная цена с НДС",
      formatMoney(price?.available, currencyCode),
    ),
    createField(
      "Доступная цена без НДС",
      formatMoney(price?.available_no_vat, currencyCode),
    ),
    createField("Минимум с НДС", formatMoney(price?.min, currencyCode)),
    createField(
      "Минимум без НДС",
      formatMoney(price?.min_no_vat, currencyCode),
    ),
    createField("Максимум с НДС", formatMoney(price?.max, currencyCode)),
    createField(
      "Максимум без НДС",
      formatMoney(price?.max_no_vat, currencyCode),
    ),
    createField("Шаг с НДС", formatMoney(price?.step, currencyCode)),
    createField("Шаг без НДС", formatMoney(price?.step_no_vat, currencyCode)),
    createField("Цена за км", formatMoney(price?.price_per_km, currencyCode)),
    createField(
      "Встречные ставки",
      formatBoolean(dto.trading.allow_counter_bets),
    ),
    createField(
      "Продление после ставки",
      formatQuantity(dto.trading.settings?.prolong_after_bet, "мин"),
    ),
    createField(
      "Подтверждение победителя",
      formatNumber(dto.trading.settings?.winner_confirm),
    ),
    createField(
      "Режим встречного предложения",
      formatNumber(dto.trading.settings?.winner_counter_mode),
    ),
    createField(
      "Время на передачу",
      formatQuantity(dto.trading.settings?.transmission_time_in, "ч"),
    ),
    createField("Коэффициент", formatNumber(dto.trading.settings?.coefficient)),
    createField("Ваша ставка", formatBoolean(dto.trading.your?.bet)),
    createField(
      "Последняя ставка",
      formatMoney(
        dto.trading.your?.last_bet_with_vat ?? dto.trading.your?.last_bet,
        currencyCode,
      ),
    ),
    createField("Победа", formatBoolean(dto.trading.your?.win)),
  ];

  return {
    id: dto.main.id ?? null,
    uuid: dto.main.order_uid ?? null,
    cargoNumber: formatNullableValue(dto.main.cargo_num),
    auctionType: getAuctionTypeLabel(dto.main.auc_type),
    auctionStatus: getAuctionStatusLabel(dto.trading.status),
    tradingStatus: getTradingStatusLabel(dto.trading.status_mobile),
    bidMeasurement: getBidMeasurementLabel(dto.trading.bid_measurement_type),
    createdAt: formatDateTime(dto.main.created_at),
    startTime,
    stopTime,
    overviewFields,
    organizerName: formatNullableValue(dto.organizer.organization_name),
    organizerInn: formatNullableValue(dto.organizer.organization_inn),
    organizerKpp: formatNullableValue(dto.organizer.organization_kpp),
    organizerFields,
    contacts: organizerContacts,
    routes: [...dto.routes]
      .sort((left, right) => (left.row_num ?? 0) - (right.row_num ?? 0))
      .map((route) => ({
        rowNumber: route.row_num ?? 0,
        operation: getOperationLabel(route.op_type),
        date: formatDateTime(route.start_date),
        endDate: formatDateTime(route.end_date),
        city: formatNullableValue(route.location?.city_name),
        address: addressesAndContactsHidden
          ? null
          : route.location?.loading_address || null,
        contactName: addressesAndContactsHidden
          ? null
          : route.contact?.name || null,
        contactPhone: addressesAndContactsHidden
          ? null
          : route.contact?.phone || null,
        comment: route.comment?.trim() || null,
        contractor: route.contractor?.trim() || null,
        contractorInn: route.contractor_inn?.trim() || null,
        cargoFields: [
          createField("Груз", formatNullableValue(route.cargo?.name)),
          createField(
            "Упаковка",
            formatNullableValue(route.cargo?.package_name),
          ),
          createField(
            "Вес",
            formatQuantity(parseNullableNumber(route.cargo?.weight), "т"),
          ),
          createField(
            "Объём",
            formatQuantity(parseNullableNumber(route.cargo?.volume), "м³"),
          ),
          createField(
            "Количество мест",
            formatNumber(route.cargo?.package_amount),
          ),
          createField(
            "Негабаритный груз",
            formatBoolean(route.cargo?.oversized),
          ),
        ],
      })),
    addressesAndContactsHidden,
    cargoFields,
    vehicleFields: mapVehicleFields(dto),
    cargoPrice,
    cargoPriceHidden,
    paymentFields,
    tradingFields,
    currentPrice: formatMoney(price?.current, currencyCode),
    minPrice: formatMoney(price?.min, currencyCode),
    maxPrice: formatMoney(price?.max, currencyCode),
    step: formatMoney(price?.step, currencyCode),
    paymentDelay,
    historyHidden,
    action: selectAuctionPrimaryAction({
      canSetBid: dto.trading.can_set_bet,
      hasBid: dto.trading.your?.bet,
      historyHidden,
    }),
  };
}
