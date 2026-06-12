import { createSupabaseServerClient } from "@/lib/supabase/client";

const customerUploadsBucket = "customer-uploads";

type CreateProjectRequest = {
  imageDataUrl?: unknown;
};

type UpdateProjectRequest = {
  projectId?: unknown;
  selectedPreviewUrl?: unknown;
  selectedStyle?: unknown;
  selectedSize?: unknown;
  selectedFrame?: unknown;
  estimatedPrice?: unknown;
};

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function parseImageDataUrl(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Expected an image data URL.");
  }

  return {
    mimeType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
}

function getImageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  return mimeType.split("/")[1]?.replace("+xml", "") ?? "png";
}

export async function POST(request: Request) {
  let body: CreateProjectRequest;

  try {
    body = (await request.json()) as CreateProjectRequest;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  if (!body.imageDataUrl || typeof body.imageDataUrl !== "string") {
    return errorResponse("Missing required imageDataUrl.", 400);
  }

  try {
    const supabase = createSupabaseServerClient();
    const image = parseImageDataUrl(body.imageDataUrl);
    const extension = getImageExtension(image.mimeType);
    const objectPath = `originals/${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage
      .from(customerUploadsBucket)
      .upload(objectPath, image.bytes, {
        contentType: image.mimeType,
        upsert: false,
      });

    if (upload.error) {
      throw upload.error;
    }

    const publicUrl = supabase.storage
      .from(customerUploadsBucket)
      .getPublicUrl(objectPath).data.publicUrl;
    // TODO: Replace public URLs with signed URLs later.
    const insert = await supabase
      .from("artwork_projects")
      .insert({
        original_image_url: publicUrl,
        status: "created",
      })
      .select("id, original_image_url")
      .single();

    if (insert.error) {
      throw insert.error;
    }

    return Response.json({
      projectId: insert.data.id,
      originalImageUrl: insert.data.original_image_url,
    });
  } catch (error) {
    console.error("Failed to create artwork project", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return errorResponse(
      "We could not save this project yet. You can keep using the local demo flow.",
      502,
    );
  }
}

export async function PATCH(request: Request) {
  let body: UpdateProjectRequest;

  try {
    body = (await request.json()) as UpdateProjectRequest;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  if (!body.projectId || typeof body.projectId !== "string") {
    return errorResponse("Missing required projectId.", 400);
  }

  const estimatedPrice =
    typeof body.estimatedPrice === "number" ? body.estimatedPrice : undefined;

  try {
    const supabase = createSupabaseServerClient();
    const update = await supabase
      .from("artwork_projects")
      .update({
        selected_preview_url:
          typeof body.selectedPreviewUrl === "string"
            ? body.selectedPreviewUrl
            : undefined,
        selected_style:
          typeof body.selectedStyle === "string" ? body.selectedStyle : undefined,
        selected_size:
          typeof body.selectedSize === "string" ? body.selectedSize : undefined,
        selected_frame:
          typeof body.selectedFrame === "string" ? body.selectedFrame : undefined,
        estimated_price: estimatedPrice,
      })
      .eq("id", body.projectId)
      .select("*")
      .single();

    if (update.error) {
      throw update.error;
    }

    if (typeof body.selectedPreviewUrl === "string") {
      await supabase
        .from("generated_images")
        .update({ selected: false })
        .eq("project_id", body.projectId);
      await supabase
        .from("generated_images")
        .update({ selected: true })
        .eq("project_id", body.projectId)
        .eq("image_url", body.selectedPreviewUrl);
    }

    // TODO: Add Shopify checkout after this project update succeeds.
    return Response.json({ project: update.data });
  } catch (error) {
    console.error("Failed to update artwork project", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return errorResponse(
      "We could not save that project update. Your local selections still work.",
      502,
    );
  }
}

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");

  if (!projectId) {
    return errorResponse("Missing required projectId.", 400);
  }

  try {
    const supabase = createSupabaseServerClient();
    const project = await supabase
      .from("artwork_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (project.error) {
      throw project.error;
    }

    const images = await supabase
      .from("generated_images")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (images.error) {
      throw images.error;
    }

    return Response.json({
      project: project.data,
      generatedImages: images.data,
    });
  } catch (error) {
    console.error("Failed to load artwork project", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return errorResponse(
      "We could not load the saved project. The local demo state is still available.",
      502,
    );
  }
}
