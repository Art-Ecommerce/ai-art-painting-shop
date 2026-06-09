import { paintingStyles } from "@/lib/ai/styles";
import type { PaintingPreview, PaintingStyle } from "@/lib/ai/types";

export type { PaintingPreview, PaintingStyle };

export type PaintingSize = "8x10" | "12x16" | "16x20" | "24x36";

export type FrameOption = "No frame" | "Black frame" | "Gold frame";

export type OrderDraft = {
  uploadedImage?: string;
  generatedPreviews?: PaintingPreview[];
  previewError?: string;
  style?: PaintingStyle;
  size?: PaintingSize;
  frame?: FrameOption;
};

export const orderDraftKey = "atelier-ai-order-draft";

export const styles: PaintingStyle[] = paintingStyles;

export const sizes: PaintingSize[] = ["8x10", "12x16", "16x20", "24x36"];

export const frames: FrameOption[] = ["No frame", "Black frame", "Gold frame"];

export const basePrices: Record<PaintingSize, number> = {
  "8x10": 149,
  "12x16": 219,
  "16x20": 299,
  "24x36": 489,
};

export const framePrices: Record<FrameOption, number> = {
  "No frame": 0,
  "Black frame": 79,
  "Gold frame": 119,
};

export function getEstimatedPrice(size?: PaintingSize, frame?: FrameOption) {
  const selectedSize = size ?? "12x16";
  const selectedFrame = frame ?? "No frame";

  return basePrices[selectedSize] + framePrices[selectedFrame];
}

export function readOrderDraft(): OrderDraft {
  if (typeof window === "undefined") {
    return {};
  }

  const rawDraft = window.sessionStorage.getItem(orderDraftKey);

  if (!rawDraft) {
    return {};
  }

  try {
    return JSON.parse(rawDraft) as OrderDraft;
  } catch {
    return {};
  }
}

export function writeOrderDraft(draft: OrderDraft) {
  window.sessionStorage.setItem(orderDraftKey, JSON.stringify(draft));
}

export function isLargeInlineImage(imageUrl: string) {
  return imageUrl.startsWith("data:image/");
}

export function getStorageSafePreviews(previews?: PaintingPreview[]) {
  return previews?.filter((preview) => !isLargeInlineImage(preview.imageUrl));
}
