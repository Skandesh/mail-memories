import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { SignOutButton } from "@/components/sign-out-button";
import { GmailCard } from "@/components/gmail-card";
import { FeaturedMemoryCard } from "@/components/featured-memory-card";
import { auth } from "@/lib/auth";
import { getMemoriesForToday } from "@/lib/memories";

export const runtime = "nodejs";

function getInitials(name: string) {
  return name
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRelativeYear(year: string) {
  const currentYear = new Date().getFullYear();
  const diff = currentYear - parseInt(year, 10);
  if (diff === 1) return "1 year ago";
  return `${diff} years ago`;
}

export default async function MemoriesPage() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  });

  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const memoriesResult = await getMemoriesForToday(session.user.id);
  const memories = memoriesResult.status === "ok" ? memoriesResult.items : [];

  const today = new Date();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const formattedDate = `${monthNames[today.getMonth()]} ${today.getDate()}`;

  const featuredMemory = memories[0];
  const otherMemories = memories.slice(1);

  return (
    <div className="min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="fade-up mb-8 flex flex-col gap-6 rounded-[28px] border border-black/10 bg-white/70 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
              {user?.name ? getInitials(user.name) : "M"}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">
                Your memories
              </p>
              <h1 className="font-display mt-1 text-2xl text-black sm:text-3xl">
                {formattedDate}
              </h1>
              <p className="mt-1 text-sm text-black/70">
                {memories.length === 0
                  ? "No memories found for today"
                  : memories.length === 1
                    ? "1 memory from your past"
                    : `${memories.length} memories from your past`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/timeline"
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:border-black/30 hover:text-black"
            >
              Timeline
            </Link>
            <SignOutButton />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Main content */}
          <div className="space-y-4">
            {/* Google Photos-style Memory Card */}
            {featuredMemory && (
              <FeaturedMemoryCard
                memory={featuredMemory}
                relativeYear={formatRelativeYear(featuredMemory.year)}
              />
            )}

            {/* Gmail-style Email Cards */}
            <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white/80">
              <div className="border-b border-black/10 px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
                    {featuredMemory ? "More memories" : "Your memories"}
                  </p>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
                    {formattedDate}
                  </span>
                </div>
              </div>

              {(featuredMemory ? otherMemories : memories).length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white">
                    <svg
                      className="h-7 w-7 text-black/30"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-black/60">
                    {memoriesResult.status === "ok"
                      ? "No more memories for today. Check back tomorrow!"
                      : memoriesResult.status === "error"
                        ? "We're having trouble reaching Gmail right now."
                        : "Connect Gmail to see your memories."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {(featuredMemory ? otherMemories : memories).map(
                    (memory, index) => (
                      <GmailCard key={memory.id} memory={memory} index={index} />
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Quick Stats Card */}
            <div className="fade-up rounded-[28px] border border-black/10 bg-white/80 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
                Today&apos;s Summary
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-black/10 bg-white/90 p-4 text-center">
                  <p className="font-display text-3xl text-black">
                    {memories.length}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                    Memories
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/90 p-4 text-center">
                  <p className="font-display text-3xl text-black">
                    {new Set(memories.map((m) => m.year)).size}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                    Years
                  </p>
                </div>
              </div>

              {memories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...new Set(memories.map((m) => m.year))]
                    .sort((a, b) => parseInt(b) - parseInt(a))
                    .map((year) => (
                      <span
                        key={year}
                        className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/60"
                      >
                        {year}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Photo Memory Preview */}
            <div className="fade-up memory-photo-card overflow-hidden rounded-[24px] border border-black/10 shadow-[0_16px_45px_-38px_rgba(28,16,6,0.7)]">
              <div className="relative h-48">
                <Image
                  src="https://picsum.photos/seed/nostalgia/400/200"
                  alt="Nostalgia"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                    On this day
                  </p>
                  <p className="font-display mt-1 text-xl text-white">
                    Moments that matter
                  </p>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="fade-up rounded-[24px] border border-black/10 bg-[var(--ink)] p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Next up
              </p>
              <h3 className="font-display mt-3 text-xl">Stay connected</h3>
              <p className="mt-2 text-sm text-white/70">
                {memoriesResult.status === "ok"
                  ? "Reply, save, or schedule follow-ups directly from your memories."
                  : memoriesResult.status === "error"
                    ? "We couldn't reach Gmail. Please try again."
                    : "Connect Gmail to unlock your memories."}
              </p>

              {memoriesResult.status === "needs-connection" && (
                <div className="mt-6">
                  <GoogleSignInButton
                    label="Connect Gmail"
                    className="border-white/20 bg-white text-black"
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
