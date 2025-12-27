import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  });

  if (session) {
    redirect("/memories");
  }

  return (
    <div className="min-h-screen px-6 py-16 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/60">
            Welcome back
          </p>
          <h1 className="font-display text-4xl text-black sm:text-5xl">
            Sign in to see your mail memories.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-black/70 sm:text-base">
            We only request Gmail read-only access. Your emails are never shared,
            and you can revoke access anytime.
          </p>
          <GoogleSignInButton />
        </div>

        <div className="glass-panel w-full max-w-md rounded-[32px] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
            What you get
          </p>
          <ul className="mt-6 space-y-4 text-sm text-black/70">
            <li>Daily on-this-day reminders from past years.</li>
            <li>Context cards so you remember the moment.</li>
            <li>One click follow-up nudges with drafts.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
