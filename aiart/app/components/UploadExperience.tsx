"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaintingPreview,
  readOrderDraft,
  writeOrderDraft,
} from "@/app/lib/order-flow";

const maxImageDataUrlLength = 8_000_000;

export function UploadExperience() {
  const router = useRouter();
  const [preview, setPreview] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      const draft = readOrderDraft();
      setPreview(draft.uploadedImage ?? "");
      setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const uploadedImage = String(reader.result);

      if (uploadedImage.length > maxImageDataUrlLength) {
        setError(
          "That image is too large for this prototype. Please choose a smaller photo.",
        );
        // TODO: Add client-side image compression before calling AI.
        return;
      }

      setError("");
      setPreview(uploadedImage);
      // TODO: Store the original photo and draft metadata in Supabase.
      writeOrderDraft({
        ...readOrderDraft(),
        uploadedImage,
        generatedPreviews: undefined,
        previewError: undefined,
      });
    };

    reader.readAsDataURL(file);
  }

  async function handleGeneratePreviews() {
    if (!preview) {
      setError("Upload a photo before generating previews.");
      return;
    }

    if (preview.length > maxImageDataUrlLength) {
      setError(
        "That image is too large for this prototype. Please choose a smaller photo.",
      );
      // TODO: Add client-side image compression before calling AI.
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-previews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl: preview }),
      });

      const result = (await response.json()) as {
        previews?: PaintingPreview[];
        error?: string;
      };

      if (!response.ok || !result.previews?.length) {
        throw new Error(result.error ?? "AI preview generation failed.");
      }

      writeOrderDraft({
        ...readOrderDraft(),
        uploadedImage: preview,
        generatedPreviews: result.previews,
        previewError: undefined,
      });
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : "AI previews could not be generated.";

      writeOrderDraft({
        ...readOrderDraft(),
        uploadedImage: preview,
        generatedPreviews: undefined,
        previewError: `${message} Placeholder previews are still available.`,
      });
    } finally {
      setIsGenerating(false);
      router.push("/preview");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase text-amber-800">
          Step 1
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-stone-950">
          Upload the photo you want painted.
        </h1>
        <p className="mt-4 leading-7 text-stone-600">
          Choose a clear portrait, pet photo, family moment, or wedding image.
          This prototype keeps the file locally in your browser session.
        </p>

        <label className="mt-8 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center transition hover:border-amber-700 hover:bg-amber-50">
          <span className="font-semibold text-stone-950">Select image</span>
          <span className="mt-2 text-sm text-stone-500">
            JPG, PNG, or WebP
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageChange}
          />
        </label>

        <button
          type="button"
          onClick={handleGeneratePreviews}
          disabled={!preview || isGenerating}
          className="mt-6 w-full rounded-full bg-stone-950 px-6 py-4 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isGenerating ? "Generating previews..." : "Generate previews"}
        </button>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg bg-stone-950 p-4 shadow-xl">
        <div className="flex min-h-[520px] items-center justify-center overflow-hidden rounded-md bg-[#211711]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Uploaded painting reference"
              className="h-full max-h-[620px] w-full object-contain"
            />
          ) : (
            <div className="max-w-sm px-8 text-center text-stone-300">
              <p className="font-serif text-3xl text-white">
                Your photo preview appears here.
              </p>
              <p className="mt-4 text-sm leading-6 text-stone-400">
                Once selected, the same browser-only preview carries through
                the prototype flow.
              </p>
            </div>
          )}
        </div>
        {isReady ? null : (
          <p className="mt-3 text-center text-sm text-stone-400">
            Loading draft...
          </p>
        )}
      </section>
    </div>
  );
}
