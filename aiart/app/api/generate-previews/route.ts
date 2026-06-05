import { generatePaintingPreviews } from "@/lib/ai/generatePaintingPreviews";

const maxImageDataUrlLength = 8_000_000;

type GeneratePreviewsRequest = {
  imageDataUrl?: unknown;
};

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: GeneratePreviewsRequest;

  try {
    body = (await request.json()) as GeneratePreviewsRequest;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  if (!body.imageDataUrl || typeof body.imageDataUrl !== "string") {
    return errorResponse("Missing required imageDataUrl.", 400);
  }

  if (!body.imageDataUrl.startsWith("data:image/")) {
    return errorResponse("imageDataUrl must be an image data URL.", 400);
  }

  if (body.imageDataUrl.length > maxImageDataUrlLength) {
    return errorResponse(
      "Image is too large for preview generation. Please upload a smaller image.",
      413,
    );
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return errorResponse("AI image generation is not configured.", 500);
  }

  try {
    const previews = await generatePaintingPreviews({
      imageDataUrl: body.imageDataUrl,
    });

    return Response.json({ previews });
  } catch (error) {
    console.error("Failed to generate painting previews", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return errorResponse(
      "AI previews could not be generated. Please try again or continue with placeholders.",
      502,
    );
  }
}
