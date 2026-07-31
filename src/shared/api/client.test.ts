import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  ApiResponseError,
  getAuction,
  getErrorToastContent,
  setBid,
} from "./client";

describe("API client response parsing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["wrong content type", "not-json", "text/plain"],
    ["malformed JSON", "{not-json}", "application/json"],
    ["a null JSON body", "null", "application/json"],
  ])(
    "rejects a successful detail response with %s",
    async (_, body, contentType) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { "Content-Type": contentType },
        }),
      );

      await expect(
        getAuction("11111111-1111-4111-8111-111111111111"),
      ).rejects.toBeInstanceOf(ApiResponseError);
    },
  );

  it("accepts the contract-defined empty successful bid response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await expect(
      setBid("11111111-1111-4111-8111-111111111111", { price: 79_500 }),
    ).resolves.toBeUndefined();
  });

  it("formats validation errors with HTTP and trace details", () => {
    const content = getErrorToastContent(
      new ApiError(422, {
        code: "validation_failed",
        title: "Ошибка валидации",
        message: "Запрос содержит некорректные поля.",
        trace_id: "request-422",
        errors: [
          {
            field: "price",
            message: "Цена отклонена.",
          },
        ],
      }),
    );

    expect(content).toEqual({
      title: "Ошибка валидации",
      description:
        "Запрос содержит некорректные поля. HTTP 422 · trace_id: request-422",
    });
  });
});
