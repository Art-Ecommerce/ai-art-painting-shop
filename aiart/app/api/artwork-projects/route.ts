import { createSupabaseServerClient } from "@/lib/supabase/client";

const customerUploadsBucket = "customer-uploads";
const generatedPreviewsBucket = "generated-previews";

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

function getPublicStorageUrl(bucket: string, value?: string | null) {
  if (!value) {
    return value;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const objectPath = value.startsWith(`${bucket}/`)
    ? value.slice(bucket.length + 1)
    : value.replace(/^\/+/, "");
  const supabase = createSupabaseServerClient();

  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

function logImageUrlMetadata(context: string, imageUrl?: string | null) {
  if (!imageUrl) {
    console.info(context, { hasImageUrl: false });
    return;
  }

  console.info(context, {
    hasImageUrl: true,
    isPublicUrl: imageUrl.startsWith("http://") || imageUrl.startsWith("https://"),
    extension: imageUrl.split("?")[0]?.split(".").pop(),
    url: imageUrl,
  });
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
    const selectedPreviewUrl =
      typeof body.selectedPreviewUrl === "string"
        ? getPublicStorageUrl(generatedPreviewsBucket, body.selectedPreviewUrl)
        : undefined;
    const update = await supabase
      .from("artwork_projects")
      .update({
        selected_preview_url: selectedPreviewUrl,
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

    if (selectedPreviewUrl) {
      await supabase
        .from("generated_images")
        .update({ selected: false })
        .eq("project_id", body.projectId);
      await supabase
        .from("generated_images")
        .update({ selected: true })
        .eq("project_id", body.projectId)
        .eq("image_url", selectedPreviewUrl);
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

    const normalizedProject = {
      ...project.data,
      original_image_url: getPublicStorageUrl(
        customerUploadsBucket,
        project.data.original_image_url,
      ),
      selected_preview_url: getPublicStorageUrl(
        generatedPreviewsBucket,
        project.data.selected_preview_url,
      ),
    };
    let normalizedImages = images.data.map((image) => ({
      ...image,
      image_url: getPublicStorageUrl(generatedPreviewsBucket, image.image_url),
    }));

    if (!normalizedImages.length) {
      const files = await supabase.storage
        .from(generatedPreviewsBucket)
        .list(projectId, {
          limit: 20,
          sortBy: { column: "name", order: "asc" },
        });

      if (files.error) {
        throw files.error;
      }

      normalizedImages = files.data.map((file) => ({
        id: file.id ?? file.name,
        project_id: projectId,
        image_url: getPublicStorageUrl(
          generatedPreviewsBucket,
          `${projectId}/${file.name}`,
        ),
        style_name: "Classic Oil Portrait",
        selected: false,
        created_at: file.created_at ?? null,
      }));
    }

    logImageUrlMetadata(
      "Loaded artwork original image",
      normalizedProject.original_image_url,
    );
    logImageUrlMetadata(
      "Loaded artwork selected preview",
      normalizedProject.selected_preview_url,
    );
    console.info("Loaded artwork generated images", {
      projectId,
      count: normalizedImages.length,
      imageUrlKinds: normalizedImages.map((image) => ({
        isPublicUrl: image.image_url?.startsWith("http"),
        extension: image.image_url?.split("?")[0]?.split(".").pop(),
      })),
    });

    return Response.json({
      project: normalizedProject,
      generatedImages: normalizedImages,
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
