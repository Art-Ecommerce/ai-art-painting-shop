import Link from "next/link";

const steps = [
  "Upload your photo",
  "Review AI oil previews",
  "Choose style, size, and frame",
  "Approve before checkout",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] text-stone-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between border-b border-stone-900/10 pb-5">
          <Link href="/" className="font-serif text-2xl font-semibold">
            Atelier AI
          </Link>
          <Link
            href="/create"
            className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Start a portrait
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase text-amber-800">
              Custom oil paintings, guided by AI
            </p>
            <h1 className="font-serif text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl lg:text-7xl">
              Turn a favorite photo into a gallery-worthy oil portrait.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">
              Upload a portrait, compare curated AI previews, then choose the
              canvas size and frame before a future Shopify checkout.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create"
                className="inline-flex items-center justify-center rounded-full bg-stone-950 px-7 py-4 text-base font-semibold text-white transition hover:bg-stone-800"
              >
                Create your preview
              </Link>
              <a
                href="#process"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 px-7 py-4 text-base font-semibold text-stone-950 transition hover:border-stone-950"
              >
                View process
              </a>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] bg-stone-900 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_24%,rgba(245,210,147,0.65),transparent_28%),radial-gradient(circle_at_72%_28%,rgba(168,83,44,0.8),transparent_24%),linear-gradient(145deg,#2c1812_0%,#79542f_42%,#d9af73_65%,#201511_100%)]" />
            <div className="absolute inset-x-10 bottom-10 rounded-2xl border border-white/20 bg-black/35 p-6 text-white shadow-xl backdrop-blur">
              <p className="text-sm uppercase text-amber-100">
                Preview suite
              </p>
              <p className="mt-2 font-serif text-3xl font-semibold">
                Four oil styles from one uploaded photo
              </p>
            </div>
          </div>
        </div>

        <div
          id="process"
          className="grid gap-3 border-t border-stone-900/10 py-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg bg-white/70 p-5 shadow-sm">
              <p className="text-sm font-semibold text-amber-800">
                0{index + 1}
              </p>
              <p className="mt-3 font-medium text-stone-900">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
