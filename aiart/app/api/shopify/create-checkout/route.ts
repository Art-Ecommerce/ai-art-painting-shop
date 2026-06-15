import { createShopifyCheckout } from "@/lib/shopify/createCheckout";
import { getShopifyVariantId } from "@/lib/shopify/variants";
import type {
  FrameOption,
  PaintingSize,
  PaintingStyle,
} from "@/app/lib/order-flow";

type CreateCheckoutRequest = {
  projectId?: unknown;
  selectedStyle?: unknown;
  selectedSize?: unknown;
  selectedFrame?: unknown;
  selectedPreviewUrl?: unknown;
};

const validSizes: PaintingSize[] = ["8x10", "12x16", "16x20", "24x36"];
const validFrames: FrameOption[] = ["No frame", "Black frame", "Gold frame"];
const validStyles: PaintingStyle[] = [
  "Classic Oil Portrait",
  "Warm Vintage Oil Painting",
  "Royal Portrait",
  "Impressionist Oil Painting",
];

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function getRequiredString(
  body: CreateCheckoutRequest,
  key: keyof CreateCheckoutRequest,
) {
  const value = body[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: Request) {
  let body: CreateCheckoutRequest;

  try {
    body = (await request.json()) as CreateCheckoutRequest;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const projectId = getRequiredString(body, "projectId");
  const selectedStyle = getRequiredString(body, "selectedStyle");
  const selectedSize = getRequiredString(body, "selectedSize");
  const selectedFrame = getRequiredString(body, "selectedFrame");
  const selectedPreviewUrl = getRequiredString(body, "selectedPreviewUrl");

  if (
    !projectId ||
    !selectedStyle ||
    !selectedSize ||
    !selectedFrame ||
    !selectedPreviewUrl
  ) {
    return errorResponse("Missing required checkout fields.", 400);
  }

  if (!validStyles.includes(selectedStyle as PaintingStyle)) {
    return errorResponse("Invalid selected style.", 400);
  }

  if (!validSizes.includes(selectedSize as PaintingSize)) {
    return errorResponse("Invalid selected size.", 400);
  }

  if (!validFrames.includes(selectedFrame as FrameOption)) {
    return errorResponse("Invalid selected frame.", 400);
  }

  const variantId = getShopifyVariantId(
    selectedSize as PaintingSize,
    selectedFrame as FrameOption,
  );

  if (!variantId) {
    return errorResponse("No Shopify variant is configured for this artwork.", 400);
  }

  try {
    const checkoutUrl = await createShopifyCheckout({
      variantId,
      projectId,
      selectedStyle,
      selectedSize,
      selectedFrame,
      selectedPreviewUrl,
    });

    return Response.json({ checkoutUrl });
  } catch (error) {
    console.error("Failed to create Shopify checkout", {
      message: error instanceof Error ? error.message : "Unknown error",
      projectId,
      selectedSize,
      selectedFrame,
      hasSelectedPreviewUrl: Boolean(selectedPreviewUrl),
    });

    return errorResponse(
      "Checkout could not be started. Please try again in a moment.",
      502,
    );
  }
}
