"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  OrderDraft,
  getEstimatedPrice,
  readPersistedProject,
  readOrderDraft,
  writePersistedProject,
} from "@/app/lib/order-flow";

type SavedArtworkProject = {
  id: string;
  original_image_url?: string | null;
  selected_preview_url?: string | null;
  selected_style?: string | null;
  selected_size?: string | null;
  selected_frame?: string | null;
  estimated_price?: number | null;
};

export function ReviewExperience() {
  const [draft, setDraft] = useState<OrderDraft>({});

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) {
        const localDraft = readOrderDraft();
        const persistedProject = readPersistedProject();
        const projectIdFromUrl = new URLSearchParams(window.location.search).get(
          "projectId",
        );
        const recoveredDraft = {
          ...persistedProject,
          ...localDraft,
          projectId: projectIdFromUrl ?? localDraft.projectId ?? persistedProject.projectId,
          originalImageUrl:
            projectIdFromUrl && projectIdFromUrl !== localDraft.projectId
              ? persistedProject.originalImageUrl
              : localDraft.originalImageUrl ?? persistedProject.originalImageUrl,
          selectedPreviewUrl:
            projectIdFromUrl && projectIdFromUrl !== localDraft.projectId
              ? persistedProject.selectedPreviewUrl
              : localDraft.selectedPreviewUrl ?? persistedProject.selectedPreviewUrl,
        };

        setDraft(recoveredDraft);

        if (recoveredDraft.projectId) {
          void loadSavedProject(recoveredDraft.projectId, recoveredDraft);
        }
      }
    });

    async function loadSavedProject(projectId: string, localDraft: OrderDraft) {
      try {
        const response = await fetch(`/api/artwork-projects?projectId=${projectId}`);

        if (!response.ok) {
          throw new Error("Project load failed.");
        }

        const result = (await response.json()) as {
          project?: SavedArtworkProject;
        };

        if (!isMounted || !result.project) {
          return;
        }

        const savedDraft = {
          ...localDraft,
          originalImageUrl:
            result.project.original_image_url ?? localDraft.originalImageUrl,
          selectedPreviewUrl:
            result.project.selected_preview_url ?? localDraft.selectedPreviewUrl,
          style: (result.project.selected_style ?? localDraft.style) as
            | OrderDraft["style"]
            | undefined,
          size: (result.project.selected_size ?? localDraft.size) as
            | OrderDraft["size"]
            | undefined,
          frame: (result.project.selected_frame ?? localDraft.frame) as
            | OrderDraft["frame"]
            | undefined,
        };

        setDraft(savedDraft);
        writePersistedProject({
          projectId: savedDraft.projectId,
          originalImageUrl: savedDraft.originalImageUrl,
          selectedPreviewUrl: savedDraft.selectedPreviewUrl,
          style: savedDraft.style,
          size: savedDraft.size,
          frame: savedDraft.frame,
        });
      } catch {
        // Keep local review flow working if Supabase is unavailable.
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const price = getEstimatedPrice(draft.size, draft.frame);
  const reviewImageUrl =
    draft.selectedPreviewUrl ?? draft.originalImageUrl ?? draft.uploadedImage;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-lg bg-stone-950 p-4 shadow-xl">
        <div className="flex min-h-[560px] items-center justify-center overflow-hidden rounded-md bg-[#211711]">
          {reviewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reviewImageUrl}
              alt="Selected painting preview"
              className="h-full max-h-[680px] w-full object-contain"
            />
          ) : (
            <div className="max-w-sm px-8 text-center text-stone-300">
              <p className="font-serif text-3xl text-white">
                No uploaded image found.
              </p>
              <p className="mt-4 text-sm leading-6 text-stone-400">
                Return to upload a reference photo for this browser session.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <p className="text-sm font-semibold uppercase text-amber-800">
          Step 4
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-stone-950">
          Review your custom painting.
        </h1>
        <p className="mt-4 leading-7 text-stone-600">
          Confirm the selected style, canvas size, and frame before the future
          checkout step.
        </p>

        <dl className="mt-8 divide-y divide-stone-200 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between gap-6 p-5">
            <dt className="text-sm font-medium text-stone-500">Style</dt>
            <dd className="text-right font-semibold text-stone-950">
              {draft.style ?? "Classic Oil Portrait"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6 p-5">
            <dt className="text-sm font-medium text-stone-500">Size</dt>
            <dd className="font-semibold text-stone-950">
              {draft.size ?? "12x16"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6 p-5">
            <dt className="text-sm font-medium text-stone-500">Frame</dt>
            <dd className="font-semibold text-stone-950">
              {draft.frame ?? "No frame"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6 bg-stone-50 p-5">
            <dt className="text-sm font-medium text-stone-500">
              Estimated price
            </dt>
            <dd className="font-serif text-4xl font-semibold text-stone-950">
              ${price}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-stone-950 px-7 py-4 font-semibold text-white transition hover:bg-stone-800"
          >
            Continue to checkout
          </button>
          <Link
            href="/preview"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-300 px-7 py-4 font-semibold text-stone-950 transition hover:border-stone-950"
          >
            Edit selections
          </Link>
        </div>
        {/* TODO: Replace the checkout button with Shopify checkout creation. */}
      </section>
    </div>
  );
}
