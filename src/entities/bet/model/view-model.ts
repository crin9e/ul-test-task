import {
  EMPTY_VALUE,
  formatDateTime,
  formatMoney,
  formatNullableValue,
} from "../../auction";
import type { BetItem } from "../../../shared/api/types";

export interface BidRowViewModel {
  id: number | null;
  subscriberId: number | null;
  createdAt: string;
  organizationName: string;
  organizationInn: string;
  contactName: string;
  contactPhone: string;
  priceWithVat: string;
  priceWithoutVat: string;
  paymentType: string;
  vatRate: string;
  rank: string | null;
  isWinner: boolean;
  isRejectedOrCancelled: boolean;
  isCounter: boolean;
  cancellationReason: string | null;
  runNumber: number | null;
}

export function countBidParticipants(bets: readonly BetItem[]): number {
  return new Set(
    bets
      .map((bet) => bet.subscriber_id)
      .filter((subscriberId): subscriberId is number => subscriberId !== undefined),
  ).size;
}

export function shouldShowBidRank(
  hidePlaces: boolean,
  place: number | null | undefined,
): boolean {
  return !hidePlaces && place !== null && place !== undefined;
}

export function mapBidRow(
  bet: BetItem,
  options: {
    currencyCode?: string | number | null;
    hidePlaces?: boolean;
  } = {},
): BidRowViewModel {
  const cancellationReason = bet.cancel_reason?.trim() || null;
  const priceWithVat =
    bet.price_info?.price_with_vat ?? bet.price_with_vat;
  const priceWithoutVat =
    bet.price_info?.price_no_vat ?? bet.price_no_vat;
  const vatRate = bet.price_info?.vat_rate?.trim();

  return {
    id: bet.id ?? null,
    subscriberId: bet.subscriber_id ?? null,
    createdAt: formatDateTime(bet.created_at),
    organizationName: formatNullableValue(bet.organization_name),
    organizationInn: formatNullableValue(bet.organization_inn),
    contactName: formatNullableValue(bet.contact_name),
    contactPhone: formatNullableValue(bet.contact_phone),
    priceWithVat: formatMoney(priceWithVat, options.currencyCode),
    priceWithoutVat: formatMoney(priceWithoutVat, options.currencyCode),
    paymentType: formatNullableValue(bet.price_info?.payment_type),
    vatRate: vatRate ? `${vatRate}%` : EMPTY_VALUE,
    rank: shouldShowBidRank(options.hidePlaces === true, bet.place)
      ? String(bet.place)
      : null,
    isWinner: bet.is_win === true,
    isRejectedOrCancelled:
      bet.is_rejected === true || cancellationReason !== null,
    isCounter: bet.is_counter === true,
    cancellationReason,
    runNumber:
      bet.run_number !== undefined && bet.run_number > 0
        ? bet.run_number
        : null,
  };
}
