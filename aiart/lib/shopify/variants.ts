import type { FrameOption, PaintingSize } from "@/app/lib/order-flow";

export type ShopifyVariantKey = `${PaintingSize}|${FrameOption}`;

// TODO: Keep these ProductVariant GIDs in sync with Shopify if product variants change.
// The keys must stay in `${selectedSize}|${selectedFrame}` format.
export const shopifyVariantByConfiguration: Record<ShopifyVariantKey, string> = {
  "8x10|No frame": "gid://shopify/ProductVariant/52587873173785",
  "8x10|Black frame": "gid://shopify/ProductVariant/52587873206553",
  "8x10|Gold frame": "gid://shopify/ProductVariant/52587873239321",
  "12x16|No frame": "gid://shopify/ProductVariant/52587873272089",
  "12x16|Black frame": "gid://shopify/ProductVariant/52587873304857",
  "12x16|Gold frame": "gid://shopify/ProductVariant/52587873337625",
  "16x20|No frame": "gid://shopify/ProductVariant/52587873468697",
  "16x20|Black frame": "gid://shopify/ProductVariant/52587873501465",
  "16x20|Gold frame": "gid://shopify/ProductVariant/52587873534233",
  "24x36|No frame": "gid://shopify/ProductVariant/52587873567001",
  "24x36|Black frame": "gid://shopify/ProductVariant/52587873599769",
  "24x36|Gold frame": "gid://shopify/ProductVariant/52587873632537",
};

export function getShopifyVariantId(
  selectedSize: PaintingSize,
  selectedFrame: FrameOption,
) {
  const key: ShopifyVariantKey = `${selectedSize}|${selectedFrame}`;

  return shopifyVariantByConfiguration[key];
}
