"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearPersistedProject,
  FrameOption,
  frames,
  getEstimatedPrice,
  getStorageSafePreviews,
  PaintingPreview,
  PaintingSize,
  PaintingStyle,
  readOrderDraft,
  sizes,
  writePersistedProject,
  writeOrderDraft,
} from "@/app/lib/order-flow";
import {
  getTransientGeneratedPreviews,
  setTransientGeneratedPreviews,
} from "@/app/lib/transient-preview-store";

const maxImageDataUrlLength = 8_000_000;
const styleCards = [
  {
    name: "Classic Oil",
    style: "Classic Oil Portrait",
    imageUrl:
      "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/ca9496aa-3ac1-41e9-95ac-314e759384d5/0-d333f97f-93a6-4946-b28f-4b794ad0867f.webp",
  },
  {
    name: "Impressionist",
    style: "Impressionist Oil Painting",
    imageUrl:
      "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/ca9496aa-3ac1-41e9-95ac-314e759384d5/2-91594503-4c1e-4377-a165-6e8da61f845b.png",
  },
  {
    name: "Warm Vintage",
    style: "Warm Vintage Oil Painting",
    imageUrl:
      "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/ca9496aa-3ac1-41e9-95ac-314e759384d5/1-54a5003d-6f7f-4c96-bec1-026fe3c5550a.jpg",
  },
  {
    name: "Royal Portrait",
    style: "Royal Portrait",
    imageUrl:
      "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/ca9496aa-3ac1-41e9-95ac-314e759384d5/3-555940b1-58a8-468a-a5ae-9fb987eab945.jpg",
  },
] satisfies {
  name: string;
  style: PaintingStyle;
  imageUrl: string;
}[];

function getPresavedStylePreviews(): PaintingPreview[] {
  return styleCards.map((styleCard, slotIndex) => ({
    style: styleCard.style,
    imageUrl: styleCard.imageUrl,
    provider: "replicate",
    providerLabel: "Saved style preview",
    durationSeconds: 0,
    slotIndex,
  }));
}

export function UploadExperience() {
  const router = useRouter();
  const [preview, setPreview] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [generatedPreviews, setGeneratedPreviews] = useState<PaintingPreview[]>(
    [],
  );
  const [selectedPreviewSlot, setSelectedPreviewSlot] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<PaintingStyle>(
    "Classic Oil Portrait",
  );
  const [selectedSize, setSelectedSize] = useState<PaintingSize>("12x16");
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>("No frame");

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      const draft = readOrderDraft();
      const transientPreviews = getTransientGeneratedPreviews();
      const availablePreviews = transientPreviews.length
        ? transientPreviews
        : draft.generatedPreviews ?? [];
      setPreview(draft.uploadedImage ?? "");
      setGeneratedPreviews(availablePreviews);
      setSelectedPreviewSlot(availablePreviews[0]?.slotIndex ?? 0);
      setSelectedStyle(draft.style ?? "Classic Oil Portrait");
      setSelectedSize(draft.size ?? "12x16");
      setSelectedFrame(draft.frame ?? "No frame");
      setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function createArtworkProject(uploadedImage: string) {
    setIsSavingProject(true);

    try {
      const response = await fetch("/api/artwork-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl: uploadedImage }),
      });
      const result = (await response.json()) as {
        projectId?: string;
        originalImageUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.projectId || !result.originalImageUrl) {
        throw new Error(result.error ?? "Supabase project creation failed.");
      }

      writeOrderDraft({
        ...readOrderDraft(),
        projectId: result.projectId,
        originalImageUrl: result.originalImageUrl,
      });
      writePersistedProject({
        projectId: result.projectId,
        originalImageUrl: result.originalImageUrl,
      });
    } catch {
      setError(
        "We could not save this project yet. You can keep using the local demo flow.",
      );
    } finally {
      setIsSavingProject(false);
    }
  }

  async function syncProjectSelection(draft = readOrderDraft()) {
    if (!draft.projectId) {
      return;
    }

    try {
      await fetch("/api/artwork-projects", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: draft.projectId,
          selectedPreviewUrl: draft.selectedPreviewUrl,
          selectedStyle: draft.style,
          selectedSize: draft.size,
          selectedFrame: draft.frame,
          estimatedPrice: getEstimatedPrice(draft.size, draft.frame),
        }),
      });
    } catch {
      setError(
        "We could not save that project update. Your local selections still work.",
      );
    }
  }

  function saveSelection(next: {
    style?: PaintingStyle;
    size?: PaintingSize;
    frame?: FrameOption;
    selectedPreviewUrl?: string;
  }) {
    const currentDraft = readOrderDraft();
    const updatedDraft = {
      ...currentDraft,
      style: next.style ?? selectedStyle,
      size: next.size ?? selectedSize,
      frame: next.frame ?? selectedFrame,
      selectedPreviewUrl:
        next.selectedPreviewUrl ?? currentDraft.selectedPreviewUrl,
    };

    writeOrderDraft(updatedDraft);
    writePersistedProject({
      projectId: updatedDraft.projectId,
      originalImageUrl: updatedDraft.originalImageUrl,
      selectedPreviewUrl: updatedDraft.selectedPreviewUrl,
      style: updatedDraft.style,
      size: updatedDraft.size,
      frame: updatedDraft.frame,
    });
    void syncProjectSelection(updatedDraft);
  }

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

      setTransientGeneratedPreviews([]);
      clearPersistedProject();
      setError("");
      setPreview(uploadedImage);
      setGeneratedPreviews([]);
      setSelectedPreviewSlot(0);
      setSelectedStyle("Classic Oil Portrait");
      // TODO: Store the original photo and draft metadata in Supabase.
      writeOrderDraft({
        ...readOrderDraft(),
        projectId: undefined,
        uploadedImage,
        originalImageUrl: undefined,
        generatedPreviews: undefined,
        selectedPreviewUrl: undefined,
        previewError: undefined,
        style: "Classic Oil Portrait",
      });
      void createArtworkProject(uploadedImage);
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
      const presavedPreviews = getPresavedStylePreviews();
      const selectedPreview =
        presavedPreviews.find((previewItem) => {
          return previewItem.slotIndex === selectedPreviewSlot;
        }) ?? presavedPreviews[0];

      setTransientGeneratedPreviews(presavedPreviews);
      setGeneratedPreviews(presavedPreviews);
      setSelectedPreviewSlot(selectedPreview.slotIndex);
      setSelectedStyle(selectedPreview.style);
      writeOrderDraft({
        ...readOrderDraft(),
        uploadedImage: preview,
        generatedPreviews: getStorageSafePreviews(presavedPreviews),
        selectedPreviewUrl: selectedPreview.imageUrl,
        style: selectedPreview.style,
        size: selectedSize,
        frame: selectedFrame,
        previewError: undefined,
      });
      saveSelection({
        style: selectedPreview.style,
        selectedPreviewUrl: selectedPreview.imageUrl,
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
      setError(`${message} Placeholder previews are still available.`);
    } finally {
      setIsGenerating(false);
    }
  }

  const selectedGeneratedPreview =
    generatedPreviews.find((generatedPreview) => {
      return generatedPreview.slotIndex === selectedPreviewSlot;
    }) ?? generatedPreviews[0];
  const canvasImageUrl = selectedGeneratedPreview?.imageUrl ?? preview;
  const estimatedPrice = getEstimatedPrice(selectedSize, selectedFrame);

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="bg-white p-5 shadow-sm ring-1 ring-[#2b231d]/10">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#aaa095]">
            1. Your Photo
          </p>

          <div className="mt-5 border border-dashed border-[#ded4c9] bg-[#fbfaf7] p-5">
            <p className="text-center text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#b8aa9c]">
              Studio Upload
            </p>
            <h1 className="mt-3 text-center text-xl font-bold text-[#2d241e]">
              Upload Your Pet&apos;s Photo
            </h1>

            <label className="mt-5 flex min-h-52 cursor-pointer flex-col items-center justify-center border border-[#e1d8ce] bg-white px-5 py-8 text-center transition hover:border-[#a98b54] hover:bg-[#f8f3eb]">
              {preview ? (
                <span className="flex w-full flex-col items-center">
                  <span className="block aspect-[4/3] w-full overflow-hidden bg-[#f2eee8]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Selected upload preview"
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="mt-4 text-sm font-semibold text-[#6f6358]">
                    Click to choose a different photo.
                  </span>
                </span>
              ) : (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f2eee8] text-[#2d241e] ring-1 ring-[#2b231d]/10">
                    <svg
                      aria-hidden="true"
                      className="h-8 w-8"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M8.5 7.5 10 5.5h4l1.5 2h2.25A2.25 2.25 0 0 1 20 9.75v6.5a2.25 2.25 0 0 1-2.25 2.25H6.25A2.25 2.25 0 0 1 4 16.25v-6.5A2.25 2.25 0 0 1 6.25 7.5H8.5Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M12 15.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </span>
                  <span className="mt-6 max-w-28 text-sm font-semibold leading-7 text-[#9a8f84]">
                    Start with one clear pet photo.
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>

            <label className="mt-4 flex h-13 cursor-pointer items-center justify-center bg-[#1f1a16] px-5 text-sm font-bold uppercase tracking-[0.28em] text-white transition hover:bg-[#3a2d24]">
              Browse Files
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </section>

        <section className="mt-7 border-t border-[#ece4da] pt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#aaa095]">
            2. Choose Style
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {styleCards.map((style, index) => {
              const generatedPreview = generatedPreviews.find(
                (previewItem) => previewItem.slotIndex === index,
              );
              const isSelected = selectedPreviewSlot === index;
              const imageUrl = generatedPreview?.imageUrl ?? style.imageUrl;
              const styleName = style.style;

              return (
                <button
                  type="button"
                  key={style.name}
                  onClick={() => {
                    setSelectedPreviewSlot(index);
                    setSelectedStyle(styleName);
                    saveSelection({
                      style: styleName,
                      selectedPreviewUrl: generatedPreview?.imageUrl,
                    });
                  }}
                  className={`border bg-white p-2 text-left shadow-sm ${
                    isSelected ? "border-[#2d241e]" : "border-[#ded4c9]"
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#e9dfd1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`${style.name} style preview`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#40352d]">
                      {style.name}
                    </p>
                    <span
                      className={`h-3 w-3 rounded-full border ${
                        isSelected
                          ? "border-[#2d241e] bg-[#2d241e]"
                          : "border-[#bdb1a4]"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7 border-t border-[#ece4da] pt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#aaa095]">
            3. Size
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {sizes.map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  saveSelection({ size });
                }}
                className={`border px-3 py-3 text-sm font-bold transition ${
                  selectedSize === size
                    ? "border-[#2d241e] bg-[#2d241e] text-white"
                    : "border-[#ded4c9] bg-white text-[#5d5147] hover:border-[#2d241e]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7 border-t border-[#ece4da] pt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#aaa095]">
            4. Frame
          </p>
          <div className="mt-4 space-y-2">
            {frames.map((frame) => (
              <button
                type="button"
                key={frame}
                onClick={() => {
                  setSelectedFrame(frame);
                  saveSelection({ frame });
                }}
                className={`w-full border px-4 py-3 text-left text-sm font-bold transition ${
                  selectedFrame === frame
                    ? "border-[#2d241e] bg-[#2d241e] text-white"
                    : "border-[#ded4c9] bg-white text-[#5d5147] hover:border-[#2d241e]"
                }`}
              >
                {frame}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-7 bg-[#f8f3eb] p-5 ring-1 ring-[#2b231d]/8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#aaa095]">
            Estimated Price
          </p>
          <p className="mt-2 font-serif text-4xl font-semibold text-[#2d241e]">
            ${estimatedPrice}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGeneratePreviews}
          disabled={!preview || isGenerating || isSavingProject}
          className="mt-7 flex h-14 w-full items-center justify-center bg-[#2d241e] px-5 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#4b392d] disabled:cursor-not-allowed disabled:bg-[#cfc6bc]"
        >
          {isSavingProject
            ? "Saving project..."
            : isGenerating
              ? "Generating..."
              : "Generate Previews"}
        </button>

        {generatedPreviews.length ? (
          <button
            type="button"
            onClick={() => router.push("/review")}
            className="mt-3 flex h-14 w-full items-center justify-center border border-[#2d241e] bg-white px-5 text-sm font-bold uppercase tracking-[0.2em] text-[#2d241e] transition hover:bg-[#f8f3eb]"
          >
            Review Order
          </button>
        ) : null}

        {isSavingProject ? (
          <p className="mt-3 text-sm text-[#8a8075]">Saving project...</p>
        ) : null}

        {error ? (
          <p className="mt-4 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </p>
        ) : null}
      </aside>

      <section className="relative min-h-[720px] overflow-hidden bg-[#efe8dc] shadow-sm ring-1 ring-[#2b231d]/8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_44%_18%,rgba(255,255,255,0.78),transparent_24%),linear-gradient(90deg,rgba(246,240,230,0.97),rgba(234,226,212,0.9)),linear-gradient(135deg,transparent_0_48%,rgba(191,181,166,0.38)_49%_100%)]" />
        <div className="absolute right-8 top-8 z-20 flex rounded-full bg-white/70 p-1 shadow-sm ring-1 ring-[#2b231d]/8 backdrop-blur">
          <span className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white">
            Canvas
          </span>
          <span className="px-5 py-2 text-sm font-semibold text-[#9d9288]">
            Room
          </span>
        </div>

        <div className="absolute left-1/2 top-[52%] z-10 w-[min(54vw,520px)] -translate-x-1/2 -translate-y-1/2 border-[8px] border-[#8a6f38] bg-[#eee8dd] p-4 shadow-2xl">
          <div className="border-[10px] border-[#f8f4ec] bg-[#fbfaf7] p-3 shadow-inner">
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#fbfaf7]">
              {canvasImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={canvasImageUrl}
                  alt={
                    selectedGeneratedPreview
                      ? `${selectedStyle} generated painting preview`
                      : "Uploaded painting reference"
                  }
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="h-full w-full bg-[#fbfaf7]" />
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-5 rounded-full bg-white/85 px-6 py-3 text-xl text-[#60564d] shadow-lg ring-1 ring-[#2b231d]/10 backdrop-blur">
          <span aria-hidden="true">&larr;</span>
          <span aria-hidden="true">&rarr;</span>
          <span className="h-6 w-px bg-[#d6cec4]" />
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-5 w-1.5 rounded-full bg-current" />
            <span className="h-5 w-1.5 rounded-full bg-current" />
          </span>
        </div>

        {isReady ? null : (
          <p className="absolute bottom-6 right-8 z-20 text-sm text-[#8a8075]">
            Loading draft...
          </p>
        )}
      </section>
    </div>
  );
}
