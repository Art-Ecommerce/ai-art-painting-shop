import { GoogleGenAI } from "@google/genai";
import type { AiPaintingProvider, PaintingPreview } from "./types";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
}

function getGeminiImageModel() {
  return process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
}

function getGeminiProImageModel() {
  return process.env.GEMINI_PRO_IMAGE_MODEL ?? "gemini-3-pro-image";
}

function getGeminiModel(slotIndex?: number) {
  if (slotIndex === 3) {
    return getGeminiProImageModel();
  }

  return getGeminiImageModel();
}

function parseImageDataUrl(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Gemini image input must be a base64 image data URL.");
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function getInlineImageDataUrl(response: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>) {
  const parts = response.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType ?? "image/png";

      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Gemini did not return an image.");
}

export const geminiPaintingProvider: AiPaintingProvider = {
  provider: "gemini",
  providerLabel: "Google Nano Banana directly",
  async generatePreview({
    imageDataUrl,
    stylePrompt,
    slotIndex,
  }): Promise<Pick<PaintingPreview, "imageUrl">> {
    const ai = getGeminiClient();
    const image = parseImageDataUrl(imageDataUrl);
    const response = await ai.models.generateContent({
      model: getGeminiModel(slotIndex),
      contents: [
        {
          text: stylePrompt.prompt,
        },
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        },
      ],
    });

    return {
      imageUrl: getInlineImageDataUrl(response),
    };
  },
};
