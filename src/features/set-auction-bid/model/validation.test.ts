import { describe, expect, it } from "vitest";
import {
  createBidSchema,
  getBidPriceConstraints,
  getBidStepBase,
  isBidStepAligned,
} from "./validation";

describe("bid validation", () => {
  it("requires a numeric price greater than zero", () => {
    const schema = createBidSchema({ min: null, max: null, step: null });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ price: "100" }).success).toBe(false);
    expect(schema.safeParse({ price: 0 }).success).toBe(false);
    expect(schema.safeParse({ price: -1 }).success).toBe(false);
    expect(schema.safeParse({ price: 1 }).success).toBe(true);
  });

  it("enforces non-null minimum and maximum values", () => {
    const schema = createBidSchema({ min: 100, max: 200, step: null });
    expect(schema.safeParse({ price: 99 }).success).toBe(false);
    expect(schema.safeParse({ price: 100 }).success).toBe(true);
    expect(schema.safeParse({ price: 200 }).success).toBe(true);
    expect(schema.safeParse({ price: 201 }).success).toBe(false);
  });

  it("uses minimum as the step base and otherwise uses zero", () => {
    expect(getBidStepBase({ min: 10.05, max: null, step: 0.1 })).toBe(10.05);
    expect(getBidStepBase({ min: null, max: null, step: 0.1 })).toBe(0);

    const withMinimum = createBidSchema({ min: 10.05, max: null, step: 0.1 });
    expect(withMinimum.safeParse({ price: 10.15 }).success).toBe(true);
    expect(withMinimum.safeParse({ price: 10.1 }).success).toBe(false);
  });

  it("validates decimal steps without floating-point noise", () => {
    expect(isBidStepAligned(0.3, 0.1)).toBe(true);
    expect(isBidStepAligned(0.30000000000000004, 0.1)).toBe(true);
    expect(isBidStepAligned(0.35, 0.1)).toBe(false);
  });

  it("does not add restrictions for nullable constraints", () => {
    const schema = createBidSchema({ min: null, max: null, step: null });
    expect(schema.safeParse({ price: 0.01 }).success).toBe(true);
    expect(schema.safeParse({ price: 999_999_999 }).success).toBe(true);
  });

  it("extracts constraints from detail DTO prices", () => {
    expect(getBidPriceConstraints({ min: 100, max: 200, step: 10 })).toEqual({
      min: 100,
      max: 200,
      step: 10,
    });
    expect(getBidPriceConstraints(undefined)).toEqual({
      min: null,
      max: null,
      step: null,
    });
  });
});
