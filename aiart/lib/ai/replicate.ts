import Replicate from "replicate";
import type {
  AiPaintingProvider,
  PaintingPreview,
  PaintingStylePrompt,
} from "./types";

type ReplicateModelIdentifier =
  | `${string}/${string}`
  | `${string}/${string}:${string}`;

type ReplicateComparisonModel = {
  provider: PaintingPreview["provider"];
  providerLabel: string;
  model: ReplicateModelIdentifier;
  slotIndex: number;
  buildInput(input: {
    imageDataUrl: string;
    prompt: string;
  }): Record<string, unknown>;
};

function validateReplicateModel(model: string): ReplicateModelIdentifier {
  if (!model.includes("/")) {
    throw new Error("REPLICATE_IMAGE_TO_IMAGE_MODEL must use owner/model format.");
  }

  return model as ReplicateModelIdentifier;
}

export const replicateComparisonModels: ReplicateComparisonModel[] = [
  {
    provider: "openai",
    providerLabel: "OpenAI GPT Image 2 via Replicate",
    model: validateReplicateModel(
      process.env.REPLICATE_OPENAI_IMAGE_MODEL ?? "openai/gpt-image-2",
    ),
    slotIndex: 0,
    buildInput({ imageDataUrl, prompt }) {
      return {
        prompt,
        input_images: [imageDataUrl],
        aspect_ratio: "2:3",
        quality: "auto",
        background: "auto",
        moderation: "auto",
        output_format: "webp",
        number_of_images: 1,
      };
    },
  },
  {
    provider: "google",
    providerLabel: "Google Nano Banana via Replicate",
    model: validateReplicateModel(
      process.env.REPLICATE_GOOGLE_IMAGE_MODEL ?? "google/nano-banana",
    ),
    slotIndex: 1,
    buildInput({ imageDataUrl, prompt }) {
      return {
        prompt,
        image_input: [imageDataUrl],
        aspect_ratio: "match_input_image",
        output_format: "jpg",
      };
    },
  },
];

function getReplicateClient() {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  return new Replicate({ auth: token });
}

function normalizeReplicateOutput(output: unknown): string {
  const firstOutput = Array.isArray(output) ? output[0] : output;

  if (typeof firstOutput === "string") {
    return firstOutput;
  }

  if (
    firstOutput &&
    typeof firstOutput === "object" &&
    "url" in firstOutput &&
    typeof firstOutput.url === "function"
  ) {
    return String(firstOutput.url());
  }

  throw new Error("Replicate did not return a usable image URL.");
}

function getRateLimitRetryDelayMs(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (!message.includes("429")) {
    return 0;
  }

  const retryAfterMatch = message.match(/"retry_after":(\d+)/);
  const retryAfterSeconds = retryAfterMatch
    ? Number(retryAfterMatch[1])
    : 10;

  return Math.max(retryAfterSeconds, 1) * 1000;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runReplicateImageToImage(
  imageDataUrl: string,
  stylePrompt: PaintingStylePrompt,
  modelConfig: ReplicateComparisonModel,
): Promise<string> {
  const replicate = getReplicateClient();

  // TODO: Test and tune each Replicate-hosted model and input mapping for best oil-painting quality, speed, and cost.
  const input = modelConfig.buildInput({
    imageDataUrl,
    prompt: stylePrompt.prompt,
  });

  try {
    const output = await replicate.run(modelConfig.model, { input });

    return normalizeReplicateOutput(output);
  } catch (error) {
    const retryDelayMs = getRateLimitRetryDelayMs(error);

    if (!retryDelayMs) {
      throw error;
    }

    await wait(retryDelayMs);
    const output = await replicate.run(modelConfig.model, { input });

    return normalizeReplicateOutput(output);
  }
}

export const replicatePaintingProvider: AiPaintingProvider = {
  provider: "replicate",
  providerLabel: "Replicate model",
  async generatePreview({
    imageDataUrl,
    stylePrompt,
    slotIndex = 0,
  }): Promise<Pick<PaintingPreview, "imageUrl">> {
    const modelConfig =
      replicateComparisonModels.find((model) => model.slotIndex === slotIndex) ??
      replicateComparisonModels[0];
    const imageUrl = await runReplicateImageToImage(
      imageDataUrl,
      stylePrompt,
      modelConfig,
    );

    return {
      imageUrl,
    };
  },
};
