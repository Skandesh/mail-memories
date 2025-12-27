import Link from "next/link";
import { headers } from "next/headers";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  });
  const user = session?.user;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-8 top-16 h-40 w-40 rounded-full bg-[var(--glow-peach)] blur-[90px]" />
        <div className="absolute right-16 top-24 h-48 w-48 rounded-full bg-[var(--glow-mint)] blur-[110px]" />
        <div className="absolute bottom-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[var(--glow-rose)] blur-[120px]" />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24 pt-16 sm:px-10 lg:pt-24">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/60">
              Mail Memories
            </p>
            <h1 className="font-display text-4xl leading-tight text-black sm:text-5xl lg:text-6xl">
              {user?.name
                ? `Welcome back, ${user.name}.`
                : "Remember the emails that shaped your story."}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-black/70 sm:text-lg">
              {user
                ? "Your timeline is ready. Jump into your on-this-day memories, compare years, and capture highlights."
                : "Mail Memories brings back emails sent on this day in past years. Relive launches, reunions, and milestones. Then follow up in a single click."}
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {user ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/memories"
                    className="rounded-full bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/80"
                  >
                    Go to memories
                  </Link>
                  <Link
                    href="/timeline"
                    className="rounded-full border border-black/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70 transition hover:border-black/30 hover:text-black"
                  >
                    View timeline
                  </Link>
                  <SignOutButton />
                </div>
              ) : (
                <>
                  <GoogleSignInButton />
                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href="/memories"
                      className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:text-black"
                    >
                      Preview feed
                    </Link>
                    <Link
                      href="/timeline"
                      className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:text-black"
                    >
                      View timeline
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
              <span>Read only Gmail access</span>
              <span>Encrypted tokens</span>
              <span>No ads, no tracking</span>
            </div>
          </div>

          <div className="glass-panel card-grid relative rounded-[32px] p-8 sm:p-10">
            <div className="absolute right-6 top-6 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/60">
              On this day
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                  {user?.email ? `Signed in as ${user.email}` : "Mar 18, 2019"}
                </p>
                <h2 className="font-display text-2xl text-black">
                  {user
                    ? "Your memories are ready."
                    : "&quot;We shipped the MVP.&quot;"}
                </h2>
                <p className="text-sm leading-relaxed text-black/70">
                  {user
                    ? "Go to the memories feed to view what you sent on this day across the years."
                    : "&quot;Remember that first demo day? You said you would never forget. Want to send the team a quick note?&quot;"}
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                  <span>From</span>
                  <span>To</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-black/70">
                  <p>{user?.name ?? "Ava Monroe"}</p>
                  <p>{user?.email ?? "Team Launch List"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <Link
                      href="/memories"
                      className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/80"
                    >
                      Open feed
                    </Link>
                    <Link
                      href="/timeline"
                      className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70 transition hover:border-black/30 hover:text-black"
                    >
                      Compare years
                    </Link>
                  </>
                ) : (
                  <>
                    <button className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/80">
                      Reply now
                    </button>
                    <button className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70 transition hover:border-black/30 hover:text-black">
                      Snooze
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="float-slow absolute -left-6 -bottom-8 rounded-2xl bg-white/90 p-4 shadow-[0_18px_50px_-35px_rgba(20,10,0,0.8)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                {user ? "Signed in" : "Memory queue"}
              </p>
              <p className="mt-2 text-sm text-black/70">
                {user ? "Your timeline is ready" : "12 emails waiting today"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Connect",
              body: "Secure OAuth with Gmail. Read-only access so you stay in control.",
            },
            {
              title: "Relive",
              body: "We surface emails you sent on this day across the years.",
            },
            {
              title: "Reconnect",
              body: "One click to reply, schedule a follow-up, or save a note.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[28px] border border-black/10 bg-white/70 p-6 shadow-[0_20px_60px_-45px_rgba(21,13,2,0.6)]"
            >
              <h3 className="font-display text-2xl text-black">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-black/70">
                {card.body}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-10 rounded-[36px] border border-black/10 bg-white/70 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">
              Memories feed
            </p>
            <h2 className="font-display mt-4 text-3xl text-black sm:text-4xl">
              A daily feed of emails that matter, not noise.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-black/70">
              Mail Memories distills your past into gentle prompts. You will see
              launches, thank-yous, and the people you promised to stay in touch
              with.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
              <span>Filter by people</span>
              <span>Pin a favorite</span>
              <span>Instant reply</span>
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                year: "2016",
                subject: "Graduation brunch plan?",
                note: "You sent: \"See you at 10am - bring the banner.\"",
              },
              {
                year: "2020",
                subject: "First remote sprint retrospective",
                note: "You sent: \"Proud of the team. Let's do this weekly.\"",
              },
              {
                year: "2023",
                subject: "Birthday dinner surprise",
                note: "You sent: \"Pick a restaurant, I am in.\"",
              },
            ].map((memory) => (
              <div
                key={memory.subject}
                className="rounded-2xl border border-black/10 bg-white/80 p-4"
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                  <span>{memory.year}</span>
                  <span>Today</span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-black">
                  {memory.subject}
                </h3>
                <p className="mt-2 text-sm text-black/60">{memory.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-black/10 bg-[var(--ink)] px-8 py-10 text-white sm:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
                Privacy first
              </p>
              <h2 className="font-display mt-3 text-3xl text-white">
                Your memories stay yours.
              </h2>
              <p className="mt-3 max-w-xl text-sm text-white/70">
                We only request Gmail read-only access. Tokens are encrypted and
                stored in your private database. You can revoke access anytime.
              </p>
            </div>
            <GoogleSignInButton
              label="Sign in to start"
              className="bg-white text-black"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
