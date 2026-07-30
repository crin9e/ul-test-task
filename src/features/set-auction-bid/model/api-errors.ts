import { ApiError } from "../../../shared/api/client";
import type { ValidationProblem } from "../../../shared/api/types";

function isValidationProblem(
  problem: ApiError["problem"],
): problem is ValidationProblem {
  return "errors" in problem && Array.isArray(problem.errors);
}

export function getBidPriceApiError(error: unknown): string | null {
  if (
    !(error instanceof ApiError) ||
    error.status !== 422 ||
    !isValidationProblem(error.problem)
  ) {
    return null;
  }

  return (
    error.problem.errors.find((item) => item.field === "price")?.message ??
    null
  );
}
