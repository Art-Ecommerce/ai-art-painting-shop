This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

Run the Vitest unit suite:

```bash
npm run test:unit
```

Run the Playwright end-to-end suite:

```bash
npx playwright install chromium
npm run test:e2e
```

For Playwright's interactive runner:

```bash
npm run test:e2e:ui
```

The unit tests cover every supported size/frame price and Shopify variant
combination, including clear failures for unsupported combinations. The E2E
test mocks artwork-project persistence, AI preview generation, Supabase Storage
images, and Shopify checkout. It does not call Gemini, Replicate, Supabase, or
Shopify.

Before production, manually test real image uploads and storage permissions,
AI generation quality and timeout handling, Shopify variant IDs and checkout,
mobile layouts, and the paid-order webhook/artist workflow.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
