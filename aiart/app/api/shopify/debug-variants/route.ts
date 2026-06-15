import { shopifyStorefrontRequest } from "@/lib/shopify/client";

type ProductsResponse = {
  products: {
    nodes: {
      title: string;
      handle: string;
      variants: {
        nodes: {
          id: string;
          title: string;
          availableForSale: boolean;
          price: {
            amount: string;
            currencyCode: string;
          };
        }[];
      };
    }[];
  };
};

const productsQuery = `
  query DebugProductsAndVariants {
    products(first: 25) {
      nodes {
        title
        handle
        variants(first: 50) {
          nodes {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isLocalRequest(request: Request) {
  const host = request.headers.get("host") ?? "";

  return (
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:") ||
    host.startsWith("[::1]:")
  );
}

export async function GET(request: Request) {
  // TODO: Delete or protect this debug route before production.
  if (!isLocalRequest(request)) {
    return errorResponse("Not found.", 404);
  }

  try {
    const data = await shopifyStorefrontRequest<ProductsResponse>(
      productsQuery,
      {},
    );

    const variants = data.products.nodes.flatMap((product) =>
      product.variants.nodes.map((variant) => ({
        productTitle: product.title,
        productHandle: product.handle,
        variantTitle: variant.title,
        variantId: variant.id,
        price: `${variant.price.amount} ${variant.price.currencyCode}`,
        availableForSale: variant.availableForSale,
      })),
    );

    return Response.json({ variants });
  } catch (error) {
    console.error("Failed to load Shopify debug variants", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return errorResponse("Could not load Shopify variants.", 502);
  }
}
