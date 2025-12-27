"use client";

import type { MemoryItem } from "@/lib/memories";

function getInitials(name: string) {
  return name
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type GmailCardProps = {
  memory: MemoryItem;
  index: number;
};

export function GmailCard({ memory, index }: GmailCardProps) {
  const recipientName = memory.to.split("<")[0].trim() || memory.to;

  return (
    <a
      href={memory.gmailLink}
      target="_blank"
      rel="noreferrer"
      className={`gmail-card fade-up stagger-${Math.min(index + 1, 6)} group flex items-start gap-4 bg-white/40 px-5 py-4 transition hover:bg-white/80`}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
        {getInitials(memory.to)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-black">
            {recipientName}
          </p>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black/50">
              {memory.year}
            </span>
          </div>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-black/80">
          {memory.subject}
        </p>
        <p className="mt-1 line-clamp-1 text-sm text-black/50">
          {memory.snippet || "No preview available"}
        </p>
      </div>

      {/* Actions (visible on hover) */}
      <div className="gmail-actions flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition hover:bg-black/5 hover:text-black"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition hover:bg-black/5 hover:text-black"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </a>
  );
}
