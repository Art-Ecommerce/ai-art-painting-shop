import path from "node:path";
import { expect, test } from "@playwright/test";

const fixturePath = path.join(
  process.cwd(),
  "tests",
  "fixtures",
  "upload.svg",
);

const classicPreviewUrl =
  "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/test-project/classic.svg";

test("uploads a photo and reviews the selected painting configuration", async ({
  page,
}) => {
  await page.route("https://belnvfsaytwprbknuszz.supabase.co/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      path: fixturePath,
      status: 200,
    }),
  );

  await page.route("**/api/artwork-projects**", async (route) => {
    const method = route.request().method();

    if (method === "POST") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          projectId: "test-project",
          originalImageUrl:
            "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/customer-uploads/test-project/upload.svg",
        }),
      });
      return;
    }

    if (method === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ project: { id: "test-project" } }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        project: {
          id: "test-project",
          original_image_url:
            "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/customer-uploads/test-project/upload.svg",
          selected_preview_url: classicPreviewUrl,
          selected_style: "Classic Oil Portrait",
          selected_size: "16x20",
          selected_frame: "Black frame",
          estimated_price: 378,
        },
        generatedImages: [],
      }),
    });
  });

  // The current credit-saving UI uses presaved previews. Keep the AI route
  // mocked so re-enabling this request never calls Gemini or Replicate in E2E.
  await page.route("**/api/generate-previews", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        previews: [
          {
            style: "Classic Oil Portrait",
            imageUrl: classicPreviewUrl,
            provider: "gemini",
            providerLabel: "Mock AI preview",
            durationSeconds: 0.1,
            slotIndex: 0,
          },
        ],
      }),
    }),
  );

  await page.route("**/api/shopify/create-checkout", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        checkoutUrl: "http://127.0.0.1:3100/mock-checkout",
      }),
    }),
  );

  await page.goto("/create");
  await page.getByTestId("upload-input").setInputFiles(fixturePath);

  const generateButton = page.getByTestId("generate-previews-button");
  await expect(generateButton).toBeEnabled();
  await page.getByTestId("style-option-classic-oil-portrait").click();
  await generateButton.click();

  await page.getByTestId("size-option-16x20").click();
  await page.getByTestId("frame-option-black-frame").click();
  await page.getByTestId("review-order-button").click();

  await expect(page).toHaveURL(/\/review$/);
  await expect(
    page.getByText("Classic Oil Portrait", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("16x20", { exact: true })).toBeVisible();
  await expect(page.getByText("Black frame", { exact: true })).toBeVisible();
  await expect(page.getByText("$378", { exact: true })).toBeVisible();
  await expect(page.getByTestId("checkout-button")).toBeVisible();
});
