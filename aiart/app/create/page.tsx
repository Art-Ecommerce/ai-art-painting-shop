import Link from "next/link";
import { UploadExperience } from "@/app/components/UploadExperience";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-[#f4eee5] text-[#2b231d]">
      <nav className="border-b border-[#2b231d]/10 bg-[#f8f2ea]/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1680px] gap-4 md:grid-cols-[220px_1fr_220px] md:items-center">
          <Link
            href="/"
            className="inline-flex w-fit items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#4f453b] shadow-sm ring-1 ring-[#2b231d]/8 transition hover:text-[#2b231d]"
          >
            &larr; Back to Home
          </Link>

          <div className="flex flex-wrap items-center justify-start gap-3 text-[0.7rem] font-bold uppercase tracking-[0.34em] text-[#bbb1a6] md:justify-center">
            <span className="text-[#3d332b]">01 Create</span>
            <span className="h-px w-5 bg-[#d7cec3]" />
            <span>02 Preview</span>
            <span className="h-px w-5 bg-[#d7cec3]" />
            <span>03 Details</span>
            <span className="h-px w-5 bg-[#d7cec3]" />
            <span>04 Checkout</span>
          </div>

          <div className="hidden justify-end md:flex">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#8b8075] shadow-sm ring-1 ring-[#2b231d]/8">
              Studio Upload
            </span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
        <UploadExperience />
      </div>
    </main>
  );
}
