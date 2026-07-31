import { describe, expect, it } from "vitest";
import {
  EMPTY_VALUE,
  formatDateTime,
  formatMoney,
  formatNullableValue,
  formatQuantity,
} from "./formatters";

describe("shared formatters", () => {
  it("keeps numeric zero distinct from a missing value", () => {
    expect(formatNullableValue(0)).toBe("0");
    expect(formatMoney(0, 643)).not.toBe(EMPTY_VALUE);
    expect(formatQuantity(0, "т")).toBe("0 т");
    expect(formatNullableValue(null)).toBe(EMPTY_VALUE);
  });

  it("formats known currencies and safely falls back for unknown codes", () => {
    expect(formatMoney(1_500, 643)).toContain("₽");
    expect(formatMoney(1_500, 999)).toContain("код валюты 999");
    expect(formatMoney(1_500, null)).toContain("ден. ед.");
  });

  it("formats valid dates and rejects malformed dates", () => {
    expect(formatDateTime("2026-05-25T16:03:00")).toBe("25.05.2026, 16:03");
    expect(formatDateTime("not-a-date")).toBe(EMPTY_VALUE);
  });
});
