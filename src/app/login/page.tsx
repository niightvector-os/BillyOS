"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const needsAgreement = mode === "signup" && !agreed;

  async function handleGoogleSignIn() {
    if (needsAgreement) {
      setError("Please agree to the Privacy Policy first.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsAgreement) {
      setError("Please agree to the Privacy Policy first.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "signup") {
      setError("Check your email to confirm your account, then sign in.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-stage-split">
      <div className="auth-side-left">
        <Link href="/" className="auth-back">← billyos.co</Link>
        <div className="auth-left-content">
          <div className="auth-wordmark-full">
            <img src="/favicons/logo-mark-512.png" alt="" className="auth-mark-icon" />
            <span className="auth-mark-text">Billy<span className="auth-mark-os">OS</span></span>
          </div>
          <p className="auth-left-tagline">One AI workspace — chat, research, video, maps, and study, in one place.</p>
        </div>
      </div>

      <div className="auth-side-right">
        <div className="auth-card">
          <img src="/favicons/logo-mark-64.png" alt="BillyOS" className="auth-orb" />
          <h1 className="auth-title">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="auth-sub">
            {mode === "signin" ? "Sign in to continue to BillyOS" : "Join BillyOS in seconds"}
          </p>

          <button
            type="button"
            className="auth-google"
            onClick={handleGoogleSignIn}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="auth-or"><span>or</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
              minLength={6}
            />

            {mode === "signup" && (
              <label className="auth-agree">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
                />
                <span>
                  I have read and agree to the <Link href="/privacy" target="_blank">Privacy Policy</Link>, <Link href="/terms" target="_blank">Terms of Service</Link>, and <Link href="/cookies" target="_blank">Cookies Policy</Link>
                </span>
              </label>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={loading || needsAgreement}>
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="auth-divider" />

          <button
            className="auth-toggle"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setAgreed(false); }}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>

          <div className="auth-credit">
            BillyOS by Billy Nandy · <Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms</Link> · <Link href="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
