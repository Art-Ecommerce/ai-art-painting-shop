"use client";

import { useState } from "react";
import Link from "next/link";

const sourcePhotoUrl =
  "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/customer-uploads/originals/9ab41cbc-1520-4020-a28f-f06b94f153f6.png";

const styles = [
  {
    name: "Classic Oil",
    imageUrl:
      "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/ca9496aa-3ac1-41e9-95ac-314e759384d5/0-d333f97f-93a6-4946-b28f-4b794ad0867f.webp",
  },
  {
    name: "Impressionist",
    imageUrl:
      "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/ca9496aa-3ac1-41e9-95ac-314e759384d5/2-91594503-4c1e-4377-a165-6e8da61f845b.png",
  },
  {
    name: "Warm Vintage",
    imageUrl:
      "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/ca9496aa-3ac1-41e9-95ac-314e759384d5/1-54a5003d-6f7f-4c96-bec1-026fe3c5550a.jpg",
  },
  {
    name: "Royal Portrait",
    imageUrl:
      "https://belnvfsaytwprbknuszz.supabase.co/storage/v1/object/public/generated-previews/ca9496aa-3ac1-41e9-95ac-314e759384d5/3-555940b1-58a8-468a-a5ae-9fb987eab945.jpg",
  },
];

const processLinks = ["Process", "Styles", "Materials", "Reviews"];

export default function Home() {
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const selectedStyle = styles[selectedStyleIndex];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5efe6] text-[#271f18]">
      <nav className="relative z-20 border-b border-[#2a2017]/10 bg-[#f7f1e8]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-5 sm:px-8 lg:px-20">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Piktura
          </Link>

          <div className="hidden items-center gap-10 text-sm font-semibold text-[#71675d] md:flex">
            {processLinks.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-[#271f18]">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/review"
              aria-label="Account"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-[#51483f] transition hover:bg-white/70 sm:inline-flex"
            >
              <span className="text-lg leading-none">◎</span>
            </Link>
            <Link
              href="/create"
              className="inline-flex h-11 items-center justify-center bg-[#2c2119] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#49382b] sm:px-7"
            >
              Start Your Painting
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1680px] grid-cols-1 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative z-10 flex items-center px-6 py-14 sm:px-10 lg:px-24 lg:py-20">
          <div className="max-w-[600px]">
            <p className="mb-7 text-xs font-bold uppercase tracking-[0.45em] text-[#9a8a7a]">
              AI preview. Artist finished.
            </p>
            <h1 className="max-w-[560px] font-serif text-[3.9rem] font-semibold leading-[0.94] tracking-normal text-[#2a211a] sm:text-[5.2rem] lg:text-[5.75rem] xl:text-[6.35rem]">
              Your memory, curated for the wall it lives on.
            </h1>
            <p className="mt-6 max-w-[540px] text-lg font-medium leading-8 text-[#6f6358]">
              Start with a beloved photo, review several painterly directions,
              then refine the frame and room setting before committing to the
              final piece.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/create"
                className="inline-flex min-h-14 items-center justify-center bg-[#33271f] px-9 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-md transition hover:bg-[#4b392d]"
              >
                Start Your Painting
              </Link>
              <a
                href="#styles"
                className="inline-flex min-h-14 items-center justify-center border border-[#ded6cb] bg-white/55 px-8 text-sm font-semibold text-[#6b5f54] shadow-sm transition hover:border-[#2c2119] hover:text-[#2c2119]"
              >
                View Styles
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-9 gap-y-2 text-sm font-semibold text-[#74685d]">
              <span>4.9 average from 1,000+ reviews</span>
              <span>Preview before you pay</span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[620px] overflow-hidden lg:min-h-0">
          <div className="absolute inset-y-0 right-0 w-[38%] bg-[#b5aa9d]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,239,230,0.98)_0%,rgba(245,239,230,0.82)_20%,rgba(245,239,230,0)_52%),radial-gradient(circle_at_70%_38%,rgba(255,255,255,0.5),transparent_30%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-[#ded7cc]" />

          <div className="absolute left-[4%] top-[20%] hidden aspect-[3/4] w-[31%] border-[10px] border-[#ddd5ca] bg-[#ede5da] opacity-70 shadow-2xl md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sourcePhotoUrl}
              alt="Original uploaded photo before painting"
              className="h-full w-full object-cover grayscale"
            />
          </div>

          <div className="absolute left-[2%] top-[54%] z-20 w-[168px] rounded-[1.35rem] border-[10px] border-white bg-white p-2 shadow-2xl sm:left-[5%] sm:w-[202px] lg:left-[2%] xl:left-[7%]">
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#d8d0c4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sourcePhotoUrl}
                alt="Source photo card"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 px-1 text-[0.65rem] font-bold uppercase tracking-[0.36em] text-[#b2a393]">
              Source Photo
            </p>
          </div>

          <div className="absolute left-[30%] top-[10%] z-10 w-[67%] max-w-[700px] border-[8px] border-[#7b633b] bg-[#eee6db] p-4 shadow-2xl sm:left-[29%] lg:left-[25%] xl:left-[23%]">
            <div className="border-[10px] border-[#f8f3ea] bg-[#2d2d2b] p-2 shadow-inner">
              <div className="aspect-[4/5] overflow-hidden bg-[#2c3131]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedStyle.imageUrl}
                  alt={`${selectedStyle.name} portrait preview`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div id="styles" className="absolute bottom-0 right-0 z-30 hidden w-[72%] grid-cols-4 gap-2 px-2 pb-4 lg:grid">
            {styles.map((style, index) => (
              <button
                type="button"
                key={style.name}
                onClick={() => setSelectedStyleIndex(index)}
                className={`flex h-11 items-center justify-center border border-white/35 px-4 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-[#2c2119] hover:text-white ${
                  index === selectedStyleIndex
                    ? "bg-[#2c2119] text-white"
                    : "bg-white/52 text-[#65584e]"
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
