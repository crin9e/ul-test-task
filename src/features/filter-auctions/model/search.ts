import { z } from 'zod';

export const AUCTION_LIST_DEFAULT_PAGE = 1;
export const AUCTION_LIST_DEFAULT_PER_PAGE = 20;
export const AUCTION_LIST_MAX_PER_PAGE = 100;

const tradingStatuses = [
  'NotParticipating',
  'Leading',
  'Losing',
  'OnPending',
  'Confirmed',
  'ChoosingWinner',
  'Winner',
  'Accepted',
  'Unknown',
] as const;

const auctionTypes = ['Request', 'Up', 'Down', 'FixPrice'] as const;

export const auctionSortValues = [
  'start_time_asc',
  'start_time_desc',
  'current_price_asc',
  'current_price_desc',
  'price_per_km_asc',
  'price_per_km_desc',
] as const;

export function deserializeStringArray(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => typeof item === 'string' ? item.split(',') : [])
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeStringArray(values: readonly string[] | undefined): string | undefined {
  return values?.length ? values.join(',') : undefined;
}

export function deserializeBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === '1' || value === 1) {
    return true;
  }
  if (value === false || value === 'false' || value === '0' || value === 0) {
    return false;
  }
  return undefined;
}

export function serializeBoolean(value: boolean | undefined): string | undefined {
  return value === undefined ? undefined : String(value);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toEnumArray<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
): TValue[] | undefined {
  const validValues = deserializeStringArray(value).filter(
    (item): item is TValue => allowedValues.includes(item as TValue),
  );
  return validValues.length ? [...new Set(validValues)] : undefined;
}

function toStatusIds(value: unknown): number[] | undefined {
  const values = Array.isArray(value) ? value : deserializeStringArray(value);
  const validValues = values
    .map(toNumber)
    .filter((item): item is number => (
      item !== undefined && Number.isInteger(item) && item >= 1 && item <= 7
    ));
  return validValues.length ? [...new Set(validValues)] : undefined;
}

const pageSchema = z.preprocess((value) => {
  const parsed = toNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) && parsed > 0
    ? parsed
    : AUCTION_LIST_DEFAULT_PAGE;
}, z.number().int().positive());

const perPageSchema = z.preprocess((value) => {
  const parsed = toNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed) || parsed <= 0) {
    return AUCTION_LIST_DEFAULT_PER_PAGE;
  }
  return Math.min(parsed, AUCTION_LIST_MAX_PER_PAGE);
}, z.number().int().positive().max(AUCTION_LIST_MAX_PER_PAGE));

const optionalTextSchema = z.preprocess(toText, z.string().optional());
const optionalBooleanSchema = z.preprocess(deserializeBoolean, z.boolean().optional());
const optionalPriceSchema = z.preprocess(
  (value) => {
    const parsed = toNumber(value);
    return parsed !== undefined && parsed >= 0 ? parsed : undefined;
  },
  z.number().nonnegative().optional(),
);
const optionalDateSchema = z.preprocess(
  toText,
  z.string().datetime({ offset: true }).optional().catch(undefined),
);
const tradingStatusArraySchema = z.preprocess(
  (value) => toEnumArray(value, tradingStatuses),
  z.array(z.enum(tradingStatuses)).optional(),
);
const auctionStatusIdsSchema = z.preprocess(
  toStatusIds,
  z.array(z.number().int().min(1).max(7)).optional(),
);
const auctionTypeArraySchema = z.preprocess(
  (value) => toEnumArray(value, auctionTypes),
  z.array(z.enum(auctionTypes)).optional(),
);
const sortSchema = z.preprocess(
  (value) => {
    const text = toText(value);
    return text && auctionSortValues.includes(text as (typeof auctionSortValues)[number])
      ? text
      : undefined;
  },
  z.enum(auctionSortValues).optional(),
);

export const auctionListSearchSchema = z.object({
  page: pageSchema,
  perPage: perPageSchema,
  cargoNum: optionalTextSchema,
  status: tradingStatusArraySchema,
  statuses: auctionStatusIdsSchema,
  aucType: auctionTypeArraySchema,
  loadCity: optionalTextSchema,
  unloadCity: optionalTextSchema,
  loadDateFrom: optionalDateSchema,
  loadDateTo: optionalDateSchema,
  isAvailable: optionalBooleanSchema,
  isBidder: optionalBooleanSchema,
  currentPriceFrom: optionalPriceSchema,
  currentPriceTo: optionalPriceSchema,
  sort: sortSchema,
}).strip();

export type AuctionListSearch = z.infer<typeof auctionListSearchSchema>;

export function parseAuctionListSearch(value: unknown): AuctionListSearch {
  return auctionListSearchSchema.parse(
    typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {},
  );
}
