"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type GoogleSignInButtonProps = {
  label?: string;
  className?: string;
};

export function GoogleSignInButton({
  label = "Continue with Google",
  className = "",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const origin = window.location.origin;
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${origin}/memories`,
        newUserCallbackURL: `${origin}/memories`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_12px_30px_-20px_rgba(28,20,6,0.6)] transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_18px_40px_-24px_rgba(28,20,6,0.75)] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
        G
      </span>
      <span>{isLoading ? "Opening Google..." : label}</span>
    </button>
  );
}
