import { createSupabaseServerClient } from "@/lib/supabase/client";
import { savedDemoProjectId } from "@/lib/ai/savedDemoProject";
import type { PaintingPreview } from "@/lib/ai/types";
import type { PaintingStyle } from "@/lib/ai/types";

const maxImageDataUrlLength = 8_000_000;
const generatedPreviewsBucket = "generated-previews";
const savedPreviewLabels = [
  "OpenAI GPT Image 2 via Replicate",
  "Google Nano Banana via Replicate",
  "Google Nano Banana directly",
  "Google Nano Banana Pro directly",
];

type GeneratePreviewsRequest = {
  imageDataUrl?: unknown;
  projectId?: unknown;
};

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function getPublicStorageUrl(bucket: string, value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const objectPath = value.startsWith(`${bucket}/`)
    ? value.slice(bucket.length + 1)
    : value.replace(/^\/+/, "");
  const supabase = createSupabaseServerClient();

  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

function logImageUrlMetadata(context: string, imageUrl: string) {
  const url = imageUrl.startsWith("data:image/")
    ? "[inline image omitted]"
    : imageUrl;

  console.info(context, {
    isPublicUrl: imageUrl.startsWith("http://") || imageUrl.startsWith("https://"),
    isInlineImage: imageUrl.startsWith("data:image/"),
    extension: imageUrl.split("?")[0]?.split(".").pop(),
    url,
  });
}

function parseInlineImage(imageUrl: string) {
  const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    return undefined;
  }

  return {
    mimeType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
}

function getExtension(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  return mimeType.split("/")[1]?.replace("+xml", "") ?? "png";
}

async function getPreviewBytes(imageUrl: string) {
  const inline = parseInlineImage(imageUrl);

  if (inline) {
    return inline;
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Could not download generated preview.");
  }

  const mimeType = response.headers.get("content-type") ?? "image/png";
  const bytes = Buffer.from(await response.arrayBuffer());

  return {
    mimeType,
    bytes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Re-enable with the paused AI generation block below.
async function saveGeneratedPreviews(projectId: string, previews: PaintingPreview[]) {
  const supabase = createSupabaseServerClient();
  const savedPreviews: PaintingPreview[] = [];

  for (const preview of previews) {
    const image = await getPreviewBytes(preview.imageUrl);
    const extension = getExtension(image.mimeType);
    const objectPath = `${projectId}/${preview.slotIndex}-${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage
      .from(generatedPreviewsBucket)
      .upload(objectPath, image.bytes, {
        contentType: image.mimeType,
        upsert: false,
      });

    if (upload.error) {
      throw upload.error;
    }

    const publicUrl = supabase.storage
      .from(generatedPreviewsBucket)
      .getPublicUrl(objectPath).data.publicUrl;
    // TODO: Replace public URLs with signed URLs later.
    const savedPreview = {
      ...preview,
      imageUrl: publicUrl,
    };
    const insert = await supabase.from("generated_images").insert({
      project_id: projectId,
      image_url: publicUrl,
      style_name: preview.style,
      selected: false,
    });

    if (insert.error) {
      throw insert.error;
    }

    savedPreviews.push(savedPreview);
  }

  return savedPreviews;
}

function getSlotIndexFromUrl(imageUrl: string, fallbackIndex: number) {
  const filename = imageUrl.split("/").pop() ?? "";
  const slotMatch = filename.match(/^(\d+)-/);

  return slotMatch ? Number(slotMatch[1]) : fallbackIndex;
}

async function loadSavedGeneratedPreviews(projectId: string) {
  const supabase = createSupabaseServerClient();
  const images = await supabase
    .from("generated_images")
    .select("image_url, style_name, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (images.error) {
    throw images.error;
  }

  if (images.data.length) {
    console.info("Loaded saved preview rows", {
      projectId,
      count: images.data.length,
    });

    return images.data.map((image, index) => {
      const publicUrl = getPublicStorageUrl(generatedPreviewsBucket, image.image_url);
      const slotIndex = getSlotIndexFromUrl(publicUrl, index);

      logImageUrlMetadata("Loaded saved generated image", publicUrl);

      return {
        style: (image.style_name ?? "Classic Oil Portrait") as PaintingStyle,
        imageUrl: publicUrl,
        provider: "replicate",
        providerLabel: savedPreviewLabels[slotIndex] ?? "Saved Supabase preview",
        durationSeconds: 0,
        slotIndex,
      } satisfies PaintingPreview;
    });
  }

  const files = await supabase.storage
    .from(generatedPreviewsBucket)
    .list(projectId, {
      limit: 20,
      sortBy: { column: "name", order: "asc" },
    });

  if (files.error) {
    throw files.error;
  }

  console.info("Loaded saved preview files from storage fallback", {
    projectId,
    count: files.data.length,
  });

  return files.data.map((file, index) => {
    const objectPath = `${projectId}/${file.name}`;
    const publicUrl = getPublicStorageUrl(generatedPreviewsBucket, objectPath);
    const slotIndex = getSlotIndexFromUrl(publicUrl, index);

    logImageUrlMetadata("Loaded generated image from storage fallback", publicUrl);

    return {
      style: "Classic Oil Portrait",
      imageUrl: publicUrl,
      provider: "replicate",
      providerLabel: savedPreviewLabels[slotIndex] ?? "Saved Supabase preview",
      durationSeconds: 0,
      slotIndex,
    } satisfies PaintingPreview;
  });
}

async function loadSavedGeneratedPreviewsWithFallback(projectId?: string) {
  if (projectId) {
    const savedPreviews = await loadSavedGeneratedPreviews(projectId);

    if (savedPreviews.length) {
      return savedPreviews;
    }
  }

  if (projectId !== savedDemoProjectId) {
    console.info("Falling back to saved demo previews", {
      requestedProjectId: projectId ?? null,
      savedDemoProjectId,
    });

    return loadSavedGeneratedPreviews(savedDemoProjectId);
  }

  return [];
}

export async function POST(request: Request) {
  let body: GeneratePreviewsRequest;

  try {
    body = (await request.json()) as GeneratePreviewsRequest;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  try {
    if (body.projectId && typeof body.projectId === "string") {
      const savedPreviews = await loadSavedGeneratedPreviewsWithFallback(
        body.projectId,
      );

      if (savedPreviews.length) {
        return Response.json({ previews: savedPreviews });
      }
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

    if (process.env.AI_PROVIDER === "gemini" && !process.env.GEMINI_API_KEY) {
      return errorResponse("Gemini image generation is not configured.", 500);
    }

    // Credit-saving mode: AI generation is intentionally paused.
    // To re-enable, restore this block:
    //
    // const previews = await generatePaintingPreviews({
    //   imageDataUrl: body.imageDataUrl,
    // });
    //
    // if (body.projectId && typeof body.projectId === "string") {
    //   try {
    //     const savedPreviews = await saveGeneratedPreviews(body.projectId, previews);
    //
    //     return Response.json({ previews: savedPreviews });
    //   } catch (error) {
    //     console.error("Failed to persist generated previews", {
    //       message: error instanceof Error ? error.message : "Unknown error",
    //     });
    //   }
    // }
    //
    // return Response.json({ previews });

    return errorResponse(
      "No saved previews were found for this project. AI generation is paused to save credits.",
      404,
    );
  } catch (error) {
    console.error("Failed to load saved painting previews", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return errorResponse(
      "AI previews could not be generated. Please try again or continue with placeholders.",
      502,
    );
  }
}
