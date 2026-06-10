import type { PaintingStylePrompt } from "./types";

export const paintingStylePrompts: PaintingStylePrompt[] = [
  {
    style: "Classic Oil Portrait",
    prompt:
      "Transform this image into a high-quality classical oil portrait while preserving the original subject, facial likeness, pose, composition, and overall expression. Create the result as a refined, realistic hand-painted oil painting with elegant, visible brushwork, rich layered texture, and a timeless fine-art appearance. Use warm studio lighting, Rembrandt-inspired depth and shadow, soft but detailed rendering, and a tasteful, elegant background.\n\nThe painting should feel like a professionally commissioned traditional portrait, with natural skin tones, subtle impasto texture, realistic proportions, and a premium canvas look. Enhance depth, lighting, and atmosphere while keeping the subject realistic, dignified, and visually flattering. The final result should look like a museum-quality or gallery-quality oil painting suitable for printing and framing.\n\nAvoid cartoon style, anime style, watercolor, acrylic look, sketch style, digital illustration, flat shading, exaggerated features, distorted face, inaccurate likeness, extra fingers, malformed hands, unnatural pose, blurry details, plastic skin, over-smoothed textures, messy brushstrokes, low-resolution appearance, overly dark shadows, harsh lighting, washed-out colors, unrealistic colors, background clutter, and obvious AI artifacts.",
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
