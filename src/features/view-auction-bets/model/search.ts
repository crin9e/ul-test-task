import { z } from "zod";
import { deserializeBoolean } from "../../filter-auctions";

export const auctionBetsSearchSchema = z.object({
  all: z.preprocess(
    deserializeBoolean,
    z.boolean().optional().default(false),
  ),
}).strip();

export type AuctionBetsSearch = z.infer<typeof auctionBetsSearchSchema>;

export function parseAuctionBetsSearch(value: unknown): AuctionBetsSearch {
  return auctionBetsSearchSchema.parse(
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? value
      : {},
  );
}
