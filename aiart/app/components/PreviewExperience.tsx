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
  readOrderDraft,
  sizes,
  styles,
  writeOrderDraft,
} from "@/app/lib/order-flow";

const previewClasses = [
  "bg-[radial-gradient(circle_at_50%_24%,#f0c987_0_13%,transparent_14%),radial-gradient(circle_at_48%_45%,#8c5a37_0_20%,transparent_21%),linear-gradient(145deg,#25130e,#765334_55%,#d6b47b)]",
  "bg-[radial-gradient(circle_at_50%_23%,#f4cf92_0_12%,transparent_13%),radial-gradient(circle_at_50%_44%,#7f3f2b_0_21%,transparent_22%),linear-gradient(150deg,#3b2118,#a46d3d_58%,#e1ba80)]",
  "bg-[radial-gradient(circle_at_50%_22%,#efc77f_0_12%,transparent_13%),radial-gradient(circle_at_49%_43%,#653a29_0_20%,transparent_21%),linear-gradient(140deg,#21100d,#4c1830_44%,#b48945_78%)]",
  "bg-[radial-gradient(circle_at_48%_25%,#f3d69a_0_12%,transparent_13%),radial-gradient(circle_at_53%_46%,#986341_0_19%,transparent_20%),linear-gradient(135deg,#21413a,#bd8f51_48%,#e8d6a2)]",
];

export function PreviewExperience() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState("");
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
      setUploadedImage(draft.uploadedImage ?? "");
      setSelectedStyle(draft.style ?? "Classic Oil Portrait");
      setSelectedSize(draft.size ?? "12x16");
      setSelectedFrame(draft.frame ?? "No frame");
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

        <div className="grid gap-5 sm:grid-cols-2">
          {styles.map((style, index) => {
            const isSelected = selectedStyle === style;

            return (
              <button
                type="button"
                key={style}
                onClick={() => {
                  setSelectedStyle(style);
                  saveDraft({ style });
                }}
                className={`overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${
                  isSelected ? "ring-2 ring-amber-800" : "ring-stone-200"
                }`}
              >
                <div
                  className={`relative aspect-[4/3] ${previewClasses[index]}`}
                >
                  <div className="absolute inset-5 rounded-full border border-white/20 bg-white/5 blur-sm" />
                  {uploadedImage ? (
                    <div className="absolute right-4 top-4 h-16 w-16 overflow-hidden rounded-md border border-white/50 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedImage}
                        alt=""
                        className="h-full w-full object-cover opacity-80 mix-blend-soft-light"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold text-stone-950">{style}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      Placeholder AI oil preview
                    </p>
                  </div>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      isSelected
                        ? "border-amber-800 bg-amber-800"
                        : "border-stone-300"
                    }`}
                  />
                </div>
              </button>
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
    </div>
  );
}
