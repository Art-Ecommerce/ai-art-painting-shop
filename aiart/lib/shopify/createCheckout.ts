import { shopifyStorefrontRequest } from "@/lib/shopify/client";

export type CreateShopifyCheckoutInput = {
  variantId: string;
  projectId: string;
  selectedStyle: string;
  selectedSize: string;
  selectedFrame: string;
  selectedPreviewUrl: string;
};

type CartCreateResponse = {
  cartCreate: {
    cart?: {
      checkoutUrl?: string | null;
    } | null;
    userErrors: {
      field?: string[] | null;
      message: string;
    }[];
  };
};

const cartCreateMutation = `
  mutation cartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function createShopifyCheckout(input: CreateShopifyCheckoutInput) {
  const data = await shopifyStorefrontRequest<CartCreateResponse>(
    cartCreateMutation,
    {
      input: {
        lines: [
          {
            merchandiseId: input.variantId,
            quantity: 1,
            attributes: [
              { key: "Project ID", value: input.projectId },
              { key: "Selected Style", value: input.selectedStyle },
              { key: "Selected Size", value: input.selectedSize },
              { key: "Selected Frame", value: input.selectedFrame },
              { key: "Selected Preview URL", value: input.selectedPreviewUrl },
            ],
          },
        ],
      },
    },
  );

  const userErrors = data.cartCreate.userErrors;

  if (userErrors.length) {
    throw new Error(userErrors.map((error) => error.message).join("; "));
  }

  const checkoutUrl = data.cartCreate.cart?.checkoutUrl;

  if (!checkoutUrl) {
    throw new Error("Shopify did not return a checkout URL.");
  }

  // TODO: Add Shopify order-created webhook to update the Supabase project.
  // TODO: Update Supabase artwork_projects.shopify_order_id after paid order.
  // TODO: Add production/artist workflow after paid order.
  return checkoutUrl;
}
