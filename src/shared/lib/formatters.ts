import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export const EMPTY_VALUE = "—";

const currencyByNumericCode: Readonly<Record<string, string>> = {
  "643": "RUB",
  "840": "USD",
  "978": "EUR",
};

export function formatNullableValue(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return EMPTY_VALUE;
  }
  return String(value);
}

export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE;
  }
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatQuantity(
  value: number | null | undefined,
  unit: string,
  options?: Intl.NumberFormatOptions,
): string {
  const formattedValue = formatNumber(value, options);
  return formattedValue === EMPTY_VALUE
    ? EMPTY_VALUE
    : `${formattedValue} ${unit}`;
}

export function formatMoney(
  value: number | null | undefined,
  currencyCode: string | number | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE;
  }

  const normalizedCode =
    currencyCode === null || currencyCode === undefined
      ? undefined
      : String(currencyCode);
  const currency = normalizedCode
    ? currencyByNumericCode[normalizedCode]
    : undefined;

  if (currency) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const formattedValue = formatNumber(value);
  return normalizedCode
    ? `${formattedValue} (код валюты ${normalizedCode})`
    : `${formattedValue} ден. ед.`;
}

export function formatCurrencyCode(
  currencyCode: string | number | null | undefined,
): string {
  if (
    currencyCode === null ||
    currencyCode === undefined ||
    currencyCode === ""
  ) {
    return EMPTY_VALUE;
  }

  const normalizedCode = String(currencyCode);
  const currency = currencyByNumericCode[normalizedCode];
  return currency
    ? `${currency} (${normalizedCode})`
    : `Код валюты ${normalizedCode}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return EMPTY_VALUE;
  }
  const date = parseISO(value);
  return isValid(date)
    ? format(date, "dd.MM.yyyy, HH:mm", { locale: ru })
    : EMPTY_VALUE;
}

export function parseNullableNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
