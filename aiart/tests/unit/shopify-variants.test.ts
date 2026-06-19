import { describe, expect, it } from "vitest";
import { frames, sizes } from "@/app/lib/order-flow";
import {
  getShopifyVariantId,
  shopifyVariantByConfiguration,
} from "@/lib/shopify/variants";

describe("Shopify variant mapping", () => {
  it.each(sizes.flatMap((size) => frames.map((frame) => [size, frame] as const)))(
    "returns a ProductVariant GID for %s with %s",
    (size, frame) => {
      const variantId = getShopifyVariantId(size, frame);

      expect(variantId).toBe(shopifyVariantByConfiguration[`${size}|${frame}`]);
      expect(variantId).toMatch(/^gid:\/\/shopify\/ProductVariant\/\d+$/);
    },
  );

  it("fails clearly for an unsupported size", () => {
    expect(() => getShopifyVariantId("10x12", "No frame")).toThrow(
      'No Shopify variant configured for "10x12|No frame".',
    );
  });

  it("fails clearly for an unsupported frame", () => {
    expect(() => getShopifyVariantId("16x20", "Silver frame")).toThrow(
      'No Shopify variant configured for "16x20|Silver frame".',
    );
  });
});
