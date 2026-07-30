import { z } from 'zod';
import type { AuctionShowTradingPrice } from '../../../shared/api/types';

export interface BidPriceConstraints {
  min: number | null;
  max: number | null;
  step: number | null;
}

function decimalPlaces(value: number): number {
  const [coefficient, exponentText] = value.toString().toLowerCase().split('e');
  const fractionLength = coefficient.split('.')[1]?.length ?? 0;
  const exponent = exponentText ? Number(exponentText) : 0;
  return Math.max(0, fractionLength - exponent);
}

export function isBidStepAligned(price: number, step: number, base = 0): boolean {
  if (!Number.isFinite(price) || !Number.isFinite(step) || !Number.isFinite(base) || step <= 0) {
    return false;
  }
  const precision = Math.min(8, Math.max(
    decimalPlaces(price),
    decimalPlaces(step),
    decimalPlaces(base),
  ));
  const scale = 10 ** precision;
  const priceUnits = Math.round(price * scale);
  const stepUnits = Math.round(step * scale);
  const baseUnits = Math.round(base * scale);
  return (priceUnits - baseUnits) % stepUnits === 0;
}

export function getBidStepBase(constraints: BidPriceConstraints): number {
  return constraints.min ?? 0;
}

export function getBidPriceConstraints(
  price: AuctionShowTradingPrice | null | undefined,
): BidPriceConstraints {
  return {
    min: price?.min ?? null,
    max: price?.max ?? null,
    step: price?.step ?? null,
  };
}

export function createBidSchema(constraints: BidPriceConstraints) {
  const priceSchema = z.number({
    required_error: 'Укажите цену.',
    invalid_type_error: 'Цена должна быть числом.',
  })
    .finite('Цена должна быть конечным числом.')
    .positive('Цена должна быть больше нуля.')
    .superRefine((price, context) => {
      if (constraints.min !== null && price < constraints.min) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Цена должна быть не меньше ${constraints.min}.`,
        });
      }
      if (constraints.max !== null && price > constraints.max) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Цена должна быть не больше ${constraints.max}.`,
        });
      }
      if (
        constraints.step !== null
        && !isBidStepAligned(price, constraints.step, getBidStepBase(constraints))
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Цена должна соответствовать шагу ${constraints.step}.`,
        });
      }
    });

  return z.object({ price: priceSchema });
}

export type BidFormValues = z.infer<ReturnType<typeof createBidSchema>>;
