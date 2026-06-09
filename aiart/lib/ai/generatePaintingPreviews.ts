import { paintingStylePrompts } from "./styles";
import type {
  GeneratePaintingPreviewsInput,
  PaintingPreview,
} from "./types";
import { geminiPaintingProvider } from "./gemini";
import { replicateComparisonModels, replicatePaintingProvider } from "./replicate";

function shouldGenerateDirectGeminiPreview() {
  return process.env.AI_PROVIDER === "gemini";
}

async function generateTimedPreview(input: {
  imageDataUrl: string;
  slotIndex: number;
  provider: PaintingPreview["provider"];
  providerLabel: string;
  generatePreview: () => Promise<{ imageUrl: string }>;
  style: PaintingPreview["style"];
}): Promise<PaintingPreview> {
  const startedAt = performance.now();
  const preview = await input.generatePreview();
  const durationSeconds = Number(
    ((performance.now() - startedAt) / 1000).toFixed(1),
  );

  return {
    style: input.style,
    imageUrl: preview.imageUrl,
    provider: input.provider,
    providerLabel: input.providerLabel,
    durationSeconds,
    slotIndex: input.slotIndex,
  };
}

async function tryGenerateTimedPreview(input: {
  imageDataUrl: string;
  slotIndex: number;
  provider: PaintingPreview["provider"];
  providerLabel: string;
  generatePreview: () => Promise<{ imageUrl: string }>;
  style: PaintingPreview["style"];
}) {
  try {
    return await generateTimedPreview(input);
  } catch (error) {
    console.error("Preview provider failed", {
      providerLabel: input.providerLabel,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return undefined;
  }
}

export async function generatePaintingPreviews(
  input: GeneratePaintingPreviewsInput,
): Promise<PaintingPreview[]> {
  // TODO: Later upload the original image to Supabase Storage before calling AI.
  const firstStylePrompt = paintingStylePrompts[0];
  const previews: PaintingPreview[] = [];

  for (const modelConfig of replicateComparisonModels) {
    const preview = await tryGenerateTimedPreview({
      imageDataUrl: input.imageDataUrl,
      slotIndex: modelConfig.slotIndex,
      provider: modelConfig.provider,
      providerLabel: modelConfig.providerLabel,
      style: firstStylePrompt.style,
      generatePreview: () =>
        replicatePaintingProvider.generatePreview({
          imageDataUrl: input.imageDataUrl,
          stylePrompt: firstStylePrompt,
          slotIndex: modelConfig.slotIndex,
        }),
    });

    if (preview) {
      previews.push(preview);
    }
  }

  if (shouldGenerateDirectGeminiPreview()) {
    const preview = await tryGenerateTimedPreview({
      imageDataUrl: input.imageDataUrl,
      slotIndex: 2,
      provider: geminiPaintingProvider.provider,
      providerLabel: geminiPaintingProvider.providerLabel,
      style: firstStylePrompt.style,
      generatePreview: () =>
        geminiPaintingProvider.generatePreview({
          imageDataUrl: input.imageDataUrl,
          stylePrompt: firstStylePrompt,
          slotIndex: 2,
        }),
    });

    if (preview) {
      previews.push(preview);
    }
  }

  if (!previews.length) {
    throw new Error("No AI providers returned a preview.");
  }

  // TODO: Later save generated images to Supabase Storage for order recovery and checkout handoff.
  // TODO: Add more Replicate-hosted models here if quality/speed comparisons need a wider field.
  // TODO: Replace Replicate with OpenAI Image API or Nano Banana if quality/speed is better.
  return previews;
}
