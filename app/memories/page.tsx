import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { getMemoriesForToday } from "@/lib/memories";

export const runtime = "nodejs";

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
  const emailLabel = user?.email ? `Connected as ${user.email}. ` : "";
  const statusLine =
    memoriesResult.status === "ok"
      ? `${emailLabel}Today we found ${memories.length} moments worth revisiting.`
      : `${emailLabel}${memoriesResult.message}`;
  const asideNote =
    memoriesResult.status === "ok"
      ? "This feed refreshes every morning. Soon it will include Gmail search filters, follow-up reminders, and highlights."
      : memoriesResult.message;
  const actionTitle =
    memoriesResult.status === "ok"
      ? "Next up"
      : memoriesResult.status === "error"
        ? "Try again"
        : "Reconnect Gmail";

  return (
    <div className="min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-[28px] border border-black/10 bg-white/70 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">
              Your memories
            </p>
            <h1 className="font-display mt-3 text-3xl text-black sm:text-4xl">
              Good morning{user?.name ? `, ${user.name}` : ""}.
            </h1>
            <p className="mt-2 text-sm text-black/70">{statusLine}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Link
              href="/timeline"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50 transition hover:text-black"
            >
              View timeline
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {memories.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/10 bg-white/70 p-6 text-sm text-black/60">
                {memoriesResult.status === "ok"
                  ? "No memories matched today. Check back tomorrow or widen the search once filters are available."
                  : memoriesResult.status === "error"
                    ? "We are having trouble reaching Gmail right now. Try again soon."
                    : "We will load your memories as soon as Gmail access is approved."}
              </div>
            ) : (
              memories.map((memory) => (
                <div
                  key={memory.id}
                  className="rounded-[24px] border border-black/10 bg-white/80 p-6 shadow-[0_16px_45px_-38px_rgba(28,16,6,0.7)]"
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                    <span>{memory.year}</span>
                    <span>{memory.date}</span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-black">
                    {memory.subject}
                  </h2>
                  <p className="mt-2 text-sm text-black/60">
                    {memory.snippet || "No preview available yet."}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                      {memory.to}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={memory.gmailLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/80"
                      >
                        Open in Gmail
                      </a>
                      <button
                        type="button"
                        className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70 transition hover:border-black/30 hover:text-black"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[28px] border border-black/10 bg-white/80 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
                Daily ritual
              </p>
              <h3 className="font-display mt-4 text-2xl text-black">
                Stay close to the people who mattered.
              </h3>
              <p className="mt-3 text-sm text-black/70">{asideNote}</p>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-[var(--ink)] p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                {actionTitle}
              </p>
              <p className="mt-4 text-sm text-white/80">
                {memoriesResult.status === "ok"
                  ? "Reply, save, or schedule follow-ups directly from this feed."
                  : memoriesResult.status === "error"
                    ? "We could not reach Gmail just now. Refresh once your OAuth credentials are set."
                    : "We need Gmail read-only access to load your sent emails."}
              </p>
              {memoriesResult.status === "needs-connection" ? (
                <div className="mt-6">
                  <GoogleSignInButton
                    label="Reconnect Gmail"
                    className="border-white/20 bg-white text-black"
                  />
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
