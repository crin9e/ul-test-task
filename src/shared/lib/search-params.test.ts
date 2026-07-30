import { describe, expect, it } from "vitest";
import { parseAppSearch, stringifyAppSearch } from "./search-params";

describe("application search serialization", () => {
  it("serializes arrays as readable comma-separated values", () => {
    expect(
      stringifyAppSearch({
        page: 1,
        perPage: 20,
        status: ["Winner", "Accepted"],
      }),
    ).toBe("?page=1&perPage=20&status=Winner,Accepted");
  });

  it("parses readable arrays through the route search schema", () => {
    expect(
      parseAppSearch(
        "?page=1&perPage=20&status=Winner,Accepted&isAvailable=true",
      ),
    ).toEqual({
      page: "1",
      perPage: "20",
      status: "Winner,Accepted",
      isAvailable: "true",
    });
  });

  it("keeps existing JSON-array links compatible", () => {
    expect(
      parseAppSearch(
        '?status=%5B%22Winner%22%2C%22Accepted%22%5D',
      ),
    ).toEqual({
      status: ["Winner", "Accepted"],
    });
  });
});
