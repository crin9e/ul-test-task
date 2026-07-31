import type {
  AuctionStatus,
  AuctionType,
  BidMeasurementType,
  PaymentDelayType,
  TradingStatus,
} from "../../../shared/api";

const auctionTypeLabels = {
  Request: "Заявочный",
  Up: "На повышение",
  Down: "На понижение",
  FixPrice: "Фиксированная цена",
  Unknown: "Неизвестный тип",
} satisfies Record<AuctionType, string>;

const auctionStatusLabels = {
  Planning: "Планирование",
  Auction: "Идут торги",
  DeterminateWinner: "Определение победителя",
  WaitDeal: "Ожидание сделки",
  InProgress: "В работе",
  Finished: "Завершён",
  Stopped: "Остановлен",
  Canceled: "Отменён",
  Unknown: "Неизвестный статус",
} satisfies Record<AuctionStatus, string>;

const tradingStatusLabels = {
  NotParticipating: "Не участвуете",
  Leading: "Лидируете",
  Losing: "Ставка перебита",
  OnPending: "На рассмотрении",
  Confirmed: "Подтверждено",
  ChoosingWinner: "Выбор победителя",
  Winner: "Победитель",
  Accepted: "Принято",
  Unknown: "Неизвестный статус участия",
} satisfies Record<TradingStatus, string>;

const bidMeasurementLabels = {
  PerRoute: "За рейс",
  PerKm: "За км",
  Unknown: "Неизвестная единица",
} satisfies Record<BidMeasurementType, string>;

type NonNullPaymentDelayType = Exclude<PaymentDelayType, null>;

const paymentDelayLabels = {
  CalendarDays: "Календарные дни",
  WorkDays: "Рабочие дни",
  Unknown: "Неизвестный тип отсрочки",
} satisfies Record<NonNullPaymentDelayType, string>;

function getRuntimeLabel<TValue extends string>(
  labels: Record<TValue, string>,
  value: string | null | undefined,
  fallback: string,
): string {
  return value !== null &&
    value !== undefined &&
    Object.prototype.hasOwnProperty.call(labels, value)
    ? labels[value as TValue]
    : fallback;
}

export function getAuctionTypeLabel(
  value: AuctionType | string | null | undefined,
): string {
  return getRuntimeLabel(auctionTypeLabels, value, "Неизвестный тип");
}

export function getAuctionStatusLabel(
  value: AuctionStatus | string | null | undefined,
): string {
  return getRuntimeLabel(auctionStatusLabels, value, "Неизвестный статус");
}

export function getTradingStatusLabel(
  value: TradingStatus | string | null | undefined,
): string {
  return getRuntimeLabel(
    tradingStatusLabels,
    value,
    "Неизвестный статус участия",
  );
}

export function getBidMeasurementLabel(
  value: BidMeasurementType | string | null | undefined,
): string {
  return getRuntimeLabel(bidMeasurementLabels, value, "Неизвестная единица");
}

export function getPaymentDelayLabel(
  value: PaymentDelayType | string | undefined,
): string {
  if (value === null || value === undefined) {
    return "Не указано";
  }
  return getRuntimeLabel(paymentDelayLabels, value, "Неизвестный тип отсрочки");
}
