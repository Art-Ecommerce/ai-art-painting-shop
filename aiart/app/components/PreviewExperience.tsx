"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FrameOption,
  PaintingSize,
  PaintingStyle,
  frames,
  getEstimatedPrice,
  PaintingPreview,
  readOrderDraft,
  sizes,
  styles,
  writeOrderDraft,
} from "@/app/lib/order-flow";
import { getTransientGeneratedPreviews } from "@/app/lib/transient-preview-store";

const previewClasses = [
  "bg-[radial-gradient(circle_at_50%_24%,#f0c987_0_13%,transparent_14%),radial-gradient(circle_at_48%_45%,#8c5a37_0_20%,transparent_21%),linear-gradient(145deg,#25130e,#765334_55%,#d6b47b)]",
  "bg-[radial-gradient(circle_at_50%_23%,#f4cf92_0_12%,transparent_13%),radial-gradient(circle_at_50%_44%,#7f3f2b_0_21%,transparent_22%),linear-gradient(150deg,#3b2118,#a46d3d_58%,#e1ba80)]",
  "bg-[radial-gradient(circle_at_50%_22%,#efc77f_0_12%,transparent_13%),radial-gradient(circle_at_49%_43%,#653a29_0_20%,transparent_21%),linear-gradient(140deg,#21100d,#4c1830_44%,#b48945_78%)]",
  "bg-[radial-gradient(circle_at_48%_25%,#f3d69a_0_12%,transparent_13%),radial-gradient(circle_at_53%_46%,#986341_0_19%,transparent_20%),linear-gradient(135deg,#21413a,#bd8f51_48%,#e8d6a2)]",
];

const modelSlots = [
  "OpenAI GPT Image 2 via Replicate",
  "Google Nano Banana via Replicate",
  "Google Nano Banana directly",
  "Google Nano Banana Pro directly",
];

export function PreviewExperience() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<PaintingStyle>(
    "Classic Oil Portrait",
  );
  const [selectedSize, setSelectedSize] = useState<PaintingSize>("12x16");
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>("No frame");
  const [generatedPreviews, setGeneratedPreviews] = useState<PaintingPreview[]>(
    [],
  );
  const [previewError, setPreviewError] = useState("");
  const [selectedPreviewSlot, setSelectedPreviewSlot] = useState<number>();
  const [expandedPreview, setExpandedPreview] = useState<PaintingPreview>();

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

      setUploadedImage(draft.uploadedImage ?? "");
      setSelectedStyle(draft.style ?? "Classic Oil Portrait");
      setSelectedSize(draft.size ?? "12x16");
      setSelectedFrame(draft.frame ?? "No frame");
      setGeneratedPreviews(availablePreviews);
      setPreviewError(draft.previewError ?? "");
      setSelectedPreviewSlot(availablePreviews[0]?.slotIndex);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function saveDraft(
    nextDraft: Partial<{
      style: PaintingStyle;
      size: PaintingSize;
      frame: FrameOption;
    }>,
  ) {
    writeOrderDraft({
      ...readOrderDraft(),
      style: nextDraft.style ?? selectedStyle,
      size: nextDraft.size ?? selectedSize,
      frame: nextDraft.frame ?? selectedFrame,
    });
  }

  function handleReview() {
    writeOrderDraft({
      ...readOrderDraft(),
      style: selectedStyle,
      size: selectedSize,
      frame: selectedFrame,
    });
    router.push("/review");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-amber-800">
              Step 2
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold text-stone-950">
              Choose your favorite oil style.
            </h1>
          </div>
          <Link
            href="/create"
            className="text-sm font-semibold text-stone-600 transition hover:text-stone-950"
          >
            Change photo
          </Link>
        </div>

        {previewError ? (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            {previewError}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          {styles.map((style, index) => {
            const generatedPreview = generatedPreviews.find(
              (preview) => preview.slotIndex === index,
            );
            const displayedTitle = generatedPreview
              ? generatedPreview.providerLabel
              : style;
            const displayedSubtitle = generatedPreview
              ? generatedPreview.style
              : "Placeholder AI oil preview";
            const selectionStyle = generatedPreview?.style ?? style;
            const isSelected = generatedPreview
              ? selectedPreviewSlot === index
              : selectedStyle === style && selectedPreviewSlot === undefined;

            function selectPreview() {
              setSelectedStyle(selectionStyle);
              setSelectedPreviewSlot(generatedPreview ? index : undefined);
              saveDraft({ style: selectionStyle });
            }

            return (
              <div
                key={style}
                className={`overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${
                  isSelected ? "ring-2 ring-amber-800" : "ring-stone-200"
                }`}
              >
                <button
                  type="button"
                  disabled={!generatedPreview}
                  onClick={() => {
                    if (generatedPreview) {
                      setExpandedPreview(generatedPreview);
                    }
                  }}
                  className={`relative block aspect-[4/3] w-full ${previewClasses[index]} ${
                    generatedPreview ? "cursor-zoom-in" : "cursor-default"
                  }`}
                  aria-label={
                    generatedPreview
                      ? `Open full view for ${generatedPreview.providerLabel}`
                      : `${modelSlots[index]} not generated`
                  }
                >
                  {generatedPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={generatedPreview.imageUrl}
                      alt={`${generatedPreview.providerLabel} ${generatedPreview.style} generated preview`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-5 rounded-full border border-white/20 bg-white/5 blur-sm" />
                  )}
                  {uploadedImage && !generatedPreview ? (
                    <div className="absolute right-4 top-4 h-16 w-16 overflow-hidden rounded-md border border-white/50 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedImage}
                        alt=""
                        className="h-full w-full object-cover opacity-80 mix-blend-soft-light"
                      />
                    </div>
                  ) : null}
                  {generatedPreview ? (
                    <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      Full view
                    </div>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-black/65 px-4 py-3 text-xs font-semibold text-white backdrop-blur">
                    {generatedPreview
                      ? `${generatedPreview.providerLabel} - ${generatedPreview.durationSeconds}s`
                      : `${modelSlots[index]} - not generated`}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={selectPreview}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div>
                    <p className="font-semibold text-stone-950">
                      {displayedTitle}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {displayedSubtitle}
                    </p>
                  </div>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      isSelected
                        ? "border-amber-800 bg-amber-800"
                      : "border-stone-300"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="h-fit rounded-lg bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase text-amber-800">
          Step 3
        </p>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-950">
          Finish the artwork details.
        </h2>

        <div className="mt-7">
          <p className="mb-3 text-sm font-semibold text-stone-700">Size</p>
          <div className="grid grid-cols-2 gap-2">
            {sizes.map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  saveDraft({ size });
                }}
                className={`rounded-md border px-4 py-3 text-sm font-semibold transition ${
                  selectedSize === size
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-200 text-stone-700 hover:border-stone-950"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-sm font-semibold text-stone-700">Frame</p>
          <div className="space-y-2">
            {frames.map((frame) => (
              <button
                type="button"
                key={frame}
                onClick={() => {
                  setSelectedFrame(frame);
                  saveDraft({ frame });
                }}
                className={`w-full rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                  selectedFrame === frame
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-200 text-stone-700 hover:border-stone-950"
                }`}
              >
                {frame}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-stone-50 p-5">
          <p className="text-sm text-stone-500">Estimated price</p>
          <p className="mt-1 font-serif text-4xl font-semibold text-stone-950">
            ${getEstimatedPrice(selectedSize, selectedFrame)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleReview}
          className="mt-5 w-full rounded-full bg-amber-800 px-6 py-4 font-semibold text-white transition hover:bg-amber-700"
        >
          Review order
        </button>
      </aside>

      {expandedPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded AI preview"
          onClick={() => setExpandedPreview(undefined)}
        >
          <div
            className="max-h-full w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <div>
                <p className="text-sm font-semibold uppercase text-amber-200">
                  {expandedPreview.providerLabel}
                </p>
                <p className="font-serif text-2xl font-semibold">
                  {expandedPreview.style}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedPreview(undefined)}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-stone-950"
              >
                Close
              </button>
            </div>
            <div className="overflow-hidden rounded-lg bg-stone-950 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expandedPreview.imageUrl}
                alt={`${expandedPreview.providerLabel} full generated preview`}
                className="max-h-[82vh] w-full object-contain"
              />
              <div className="bg-stone-950 px-5 py-3 text-sm font-semibold text-white">
                Generated in {expandedPreview.durationSeconds}s
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
