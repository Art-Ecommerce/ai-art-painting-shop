import { describe, expect, it } from "vitest";
import { getEstimatedPrice } from "@/app/lib/order-flow";

const priceCases = [
  ["8x10", "No frame", 149],
  ["8x10", "Black frame", 228],
  ["8x10", "Gold frame", 268],
  ["12x16", "No frame", 219],
  ["12x16", "Black frame", 298],
  ["12x16", "Gold frame", 338],
  ["16x20", "No frame", 299],
  ["16x20", "Black frame", 378],
  ["16x20", "Gold frame", 418],
  ["24x36", "No frame", 489],
  ["24x36", "Black frame", 568],
  ["24x36", "Gold frame", 608],
] as const;

describe("getEstimatedPrice", () => {
  it.each(priceCases)(
    "returns $%i for %s with %s",
    (size, frame, expectedPrice) => {
      expect(getEstimatedPrice(size, frame)).toBe(expectedPrice);
    },
  );
});
