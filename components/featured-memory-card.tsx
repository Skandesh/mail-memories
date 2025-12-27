"use client";

import Image from "next/image";
import type { MemoryItem } from "@/lib/memories";

type FeaturedMemoryCardProps = {
  memory: MemoryItem;
  relativeYear: string;
};

export function FeaturedMemoryCard({
  memory,
  relativeYear,
}: FeaturedMemoryCardProps) {
  return (
    <div className="fade-up memory-photo-card group cursor-pointer rounded-[24px] border border-black/10 shadow-[0_16px_45px_-38px_rgba(28,16,6,0.7)]">
      <Image
        src="https://picsum.photos/seed/memories/800/400"
        alt="Memory moment"
        width={800}
        height={400}
        className="h-64 w-full object-cover sm:h-72"
        priority
      />
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-black/70 shadow-lg backdrop-blur-sm">
            {relativeYear}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {}}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {}}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            On this day in {memory.year}
          </p>
          <h2 className="font-display mt-2 text-2xl leading-tight sm:text-3xl">
            {memory.subject}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm text-white/80">
            {memory.snippet || "A moment worth remembering..."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href={memory.gmailLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black shadow-lg transition hover:bg-white/90"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              Open in Gmail
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
