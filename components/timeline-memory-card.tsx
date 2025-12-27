"use client";

import type { MemoryItem } from "@/lib/memories";

function getInitials(name: string) {
  return name
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type TimelineMemoryCardProps = {
  memory: MemoryItem;
  index: number;
};

export function TimelineMemoryCard({ memory, index }: TimelineMemoryCardProps) {
  const recipientName = memory.to.split("<")[0].trim() || memory.to;

  return (
    <a
      href={memory.gmailLink}
      target="_blank"
      rel="noreferrer"
      className={`gmail-card fade-up stagger-${Math.min(index + 1, 6)} group flex items-start gap-3 rounded-2xl border border-black/10 bg-white/90 p-4 transition hover:bg-white hover:shadow-[0_8px_20px_-12px_rgba(28,16,6,0.3)]`}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
        {getInitials(memory.to)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-black">
            {recipientName}
          </p>
          <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-black/40">
            {memory.date}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-black/80">
          {memory.subject}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-black/50">
          {memory.snippet || "No preview available"}
        </p>
      </div>

      {/* Gmail icon */}
      <div className="flex-shrink-0 opacity-0 transition group-hover:opacity-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </div>
      </div>
    </a>
  );
}
