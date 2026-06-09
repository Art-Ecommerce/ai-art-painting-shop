import type { PaintingPreview } from "@/lib/ai/types";

let transientGeneratedPreviews: PaintingPreview[] = [];

export function setTransientGeneratedPreviews(previews: PaintingPreview[]) {
  transientGeneratedPreviews = previews;
}

export function getTransientGeneratedPreviews() {
  return transientGeneratedPreviews;
}
