import Link from "next/link";
import { UploadExperience } from "@/app/components/UploadExperience";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-6 text-stone-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-10 flex items-center justify-between border-b border-stone-900/10 pb-5">
          <Link href="/" className="font-serif text-2xl font-semibold">
            Atelier AI
          </Link>
          <span className="text-sm font-medium text-stone-500">
            Upload photo
          </span>
        </nav>
        <UploadExperience />
      </div>
    </main>
  );
}
