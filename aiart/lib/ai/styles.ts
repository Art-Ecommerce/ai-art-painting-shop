import type { PaintingStylePrompt } from "./types";

export const paintingStylePrompts: PaintingStylePrompt[] = [
  {
    style: "Classic Oil Portrait",
    prompt:
      "Transform the reference image into a classic museum-quality oil portrait. Preserve the subject identity, pose, facial structure, and important details. Use refined brushwork, realistic skin tones, canvas texture, and timeless studio lighting.",
  },
  {
    style: "Warm Vintage Oil Painting",
    prompt:
      "Transform the reference image into a warm vintage oil painting. Preserve the subject identity and composition. Use amber light, soft aged pigments, subtle canvas grain, elegant brush texture, and a nostalgic heirloom portrait mood.",
  },
  {
    style: "Royal Portrait",
    prompt:
      "Transform the reference image into a regal royal oil portrait. Preserve the subject identity and likeness. Use dramatic studio lighting, rich classical colors, ornate fine-art detail, confident posture, and a premium commissioned portrait finish.",
  },
  {
    style: "Impressionist Oil Painting",
    prompt:
      "Transform the reference image into an impressionist oil painting. Preserve the subject identity and broad composition. Use expressive visible brushstrokes, luminous color, painterly texture, soft edges, and an elegant gallery-ready finish.",
  },
];

export const paintingStyles = paintingStylePrompts.map(({ style }) => style);
