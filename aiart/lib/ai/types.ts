export type PaintingStyle =
  | "Classic Oil Portrait"
  | "Warm Vintage Oil Painting"
  | "Royal Portrait"
  | "Impressionist Oil Painting";

export type PaintingPreview = {
  style: PaintingStyle;
  imageUrl: string;
  provider: "replicate" | "openai" | "google" | "gemini";
  providerLabel: string;
  durationSeconds: number;
  slotIndex: number;
};

export type PaintingStylePrompt = {
  style: PaintingStyle;
  prompt: string;
};

export type GeneratePaintingPreviewsInput = {
  imageDataUrl: string;
};

export type AiPaintingProvider = {
  provider: PaintingPreview["provider"];
  providerLabel: string;
  generatePreview(input: {
    imageDataUrl: string;
    stylePrompt: PaintingStylePrompt;
    slotIndex?: number;
  }): Promise<{ imageUrl: string }>;
};
