import { paintingStylePrompts } from "./styles";
import type {
  GeneratePaintingPreviewsInput,
  PaintingPreview,
} from "./types";
import { replicateComparisonModels, replicatePaintingProvider } from "./replicate";

export async function generatePaintingPreviews(
  input: GeneratePaintingPreviewsInput,
): Promise<PaintingPreview[]> {
  // TODO: Later upload the original image to Supabase Storage before calling AI.
  const firstStylePrompt = paintingStylePrompts[0];
  const previews: PaintingPreview[] = [];

  for (const modelConfig of replicateComparisonModels) {
    const startedAt = performance.now();
    const preview = await replicatePaintingProvider.generatePreview({
      imageDataUrl: input.imageDataUrl,
      stylePrompt: firstStylePrompt,
      slotIndex: modelConfig.slotIndex,
    });
    const durationSeconds = Number(
      ((performance.now() - startedAt) / 1000).toFixed(1),
    );

    previews.push({
      style: firstStylePrompt.style,
      imageUrl: preview.imageUrl,
      provider: modelConfig.provider,
      providerLabel: modelConfig.providerLabel,
      durationSeconds,
      slotIndex: modelConfig.slotIndex,
    });
  }

  // TODO: Later save generated images to Supabase Storage for order recovery and checkout handoff.
  // TODO: Add more Replicate-hosted models here if quality/speed comparisons need a wider field.
  // TODO: Replace Replicate with OpenAI Image API or Nano Banana if quality/speed is better.
  return previews;
}
