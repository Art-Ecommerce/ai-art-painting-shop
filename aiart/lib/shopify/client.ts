const storefrontApiVersion = "2026-04";

type ShopifyGraphqlResponse<TData> = {
  data?: TData;
  errors?: {
    message: string;
  }[];
};

function getShopifyEndpoint() {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!storeDomain) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN.");
  }

  const normalizedDomain = storeDomain
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  return `https://${normalizedDomain}/api/${storefrontApiVersion}/graphql.json`;
}

export async function shopifyStorefrontRequest<TData>(
  query: string,
  variables: Record<string, unknown>,
) {
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN.");
  }

  const response = await fetch(getShopifyEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = (await response.json()) as ShopifyGraphqlResponse<TData>;

  if (!response.ok) {
    throw new Error(`Shopify Storefront API failed with ${response.status}.`);
  }

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("; "));
  }

  if (!result.data) {
    throw new Error("Shopify Storefront API returned no data.");
  }

  return result.data;
}
