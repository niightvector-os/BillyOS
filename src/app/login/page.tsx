"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as english from "@zxcvbn-ts/language-en";
import { createClient } from "@/lib/supabase/client";

const passwordChecker = new ZxcvbnFactory({
  dictionary: { ...common.dictionary, ...english.dictionary },
  graphs: common.adjacencyGraphs,
  translations: english.translations,
  useLevenshteinDistance: true,
});

const videos = [
  "/videos/optimized/typing.mp4",
  "/videos/optimized/notes.mp4",
  "/videos/optimized/teaching.mp4",
  "/videos/optimized/desk-phone.mp4",
];

const strengthLabels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const pendingVideoRef = useRef<number | null>(null);
  const transitionStartedRef = useRef<number | null>(null);
  const router = useRouter();

  const needsAgreement = !agreed;
  const strength = password ? passwordChecker.check(password) : null;
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "signup") setMode("signup");
  }, []);

  useEffect(() => {
    transitionStartedRef.current = null;
    const video = videoRefs.current[activeVideo];
    if (!video) return;

    let cancelled = false;

    const startPlayback = () => {
      if (cancelled) return;

      void video.play().catch(() => {
        // Browser autoplay restrictions must not affect the login form.
      });
    };

    const handleCanPlay = () => startPlayback();

    if (video.readyState >= 2) {
      video.currentTime = 0;
      startPlayback();
    } else {
      video.addEventListener("canplay", handleCanPlay, { once: true });
      video.load();
    }

    return () => {
      cancelled = true;
      // Let the outgoing clip keep playing underneath the crossfade.
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [activeVideo]);

  function flashError(text: string) {
    setError(text);
    setMessage("");
    setShake(false);
    requestAnimationFrame(() => setShake(true));
    window.setTimeout(() => setShake(false), 420);
  }

  async function handleGoogleSignIn() {
    setError("");
    setMessage("");
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });

      if (authError) {
        flashError(authError.message);
        setGoogleLoading(false);
      }
    } catch {
      flashError("Could not connect to Google. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!agreed) {
      flashError("Please agree to the Privacy Policy, Terms, and Cookies Policy first.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) {
        flashError("Choose a password with at least 8 characters.");
        return;
      }
      if (!strength || strength.score < 3) {
        flashError("Choose a stronger password before creating your account.");
        return;
      }
      if (password !== confirmPassword) {
        flashError("Your passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        flashError(result.error.message);
        return;
      }

      if (mode === "signup") {
        setMessage("Check your email to confirm your account, then sign in.");
        setPassword("");
        setConfirmPassword("");
        setMode("signin");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      flashError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((current) => current === "signin" ? "signup" : "signin");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
    setError("");
    setMessage("");
  }

  return (
    <main className="auth-stage-split">
      <section className="auth-side-left" aria-label="BillyOS workspace preview">
        <div className="auth-video-frame">
          {videos.map((src, index) => (
            <video
              key={src}
              ref={(element) => { videoRefs.current[index] = element; }}
              className={`auth-preview-video ${activeVideo === index ? "is-active" : ""}`}
              src={src}
              muted
              playsInline
              preload={
                index === activeVideo || index === (activeVideo + 1) % videos.length
                  ? "auto"
                  : "metadata"
              }
              aria-hidden="true"
              onCanPlay={() => {
                if (pendingVideoRef.current === index) {
                  pendingVideoRef.current = null;
                  videoRefs.current[index]!.currentTime = 0;
                  void videoRefs.current[index]!.play().then(() => {
                    setActiveVideo(index);
                  }).catch(() => setActiveVideo(index));
                }
              }}
              onError={() => {
                if (pendingVideoRef.current === index) {
                  pendingVideoRef.current = null;
                  setActiveVideo(index);
                }
              }}
              onTimeUpdate={() => {
                if (activeVideo !== index || transitionStartedRef.current === index) return;
                if (!Number.isFinite(videoRefs.current[index]?.duration) ||
                    videoRefs.current[index]!.duration - videoRefs.current[index]!.currentTime > 0.55) return;

                const nextIndex = (index + 1) % videos.length;
                const nextVideo = videoRefs.current[nextIndex];
                transitionStartedRef.current = index;

                if (nextVideo && nextVideo.readyState >= 2) {
                  nextVideo.currentTime = 0;
                  void nextVideo.play().then(() => setActiveVideo(nextIndex)).catch(() => {
                    setActiveVideo(nextIndex);
                  });
                } else {
                  // Buffer the next clip before switching, without exposing a blank frame.
                  pendingVideoRef.current = nextIndex;
                  nextVideo?.load();
                }
              }}
              onTransitionEnd={(event) => {
                if (event.propertyName === "opacity" && activeVideo !== index) {
                  videoRefs.current[index]?.pause();
                }
              }}
              onEnded={() => {
                const nextIndex = (index + 1) % videos.length;
                const nextVideo = videoRefs.current[nextIndex];
                transitionStartedRef.current = index;

                if (!nextVideo || nextVideo.readyState >= 2) {
                  setActiveVideo(nextIndex);
                  return;
                }

                pendingVideoRef.current = nextIndex;
                nextVideo.load();
              }}
            />
          ))}
        </div>
      </section>

      <section className="auth-side-right">
        <div className={`auth-card ${shake ? "auth-shake" : ""}`}>
          <Link href="/" className="auth-brand" aria-label="BillyOS home">
            <img src="/favicons/logo-mark-64.png" alt="" className="auth-orb" />
            <span className="auth-brand-name">Billy<span>OS</span></span>
          </Link>

          <div className="auth-heading">
            <h1 className="auth-title">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="auth-sub">
              {mode === "signin"
                ? "Sign in to continue to BillyOS."
                : "Your workspace starts here."}
            </p>
          </div>

          <button
            type="button"
            className="auth-google"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <span className="auth-spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#4285F4" d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11a9.4 9.4 0 0 1-4.1 6.2v5.5h6.7c3.9-3.6 6-9 6-15.7z"/>
                <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.5c-1.8 1.2-4.1 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.7A20 20 0 0 0 24 44z"/>
                <path fill="#FBBC05" d="M12.8 27.5a12 12 0 0 1 0-7v-5.7H5.9a20 20 0 0 0 0 18.4l6.9-5.7z"/>
                <path fill="#EA4335" d="M24 12.3c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.9 14.8l6.9 5.7c1.6-4.7 6-8.2 11.2-8.2z"/>
              </svg>
            )}
            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          <div className="auth-or"><span>or continue with email</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                autoComplete="email"
                required
              />
            </label>

            <label className="auth-field">
              <span>{mode === "signin" ? "Password" : "Create password"}</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name={mode === "signin" ? "password" : "new-password"}
                  placeholder={mode === "signin" ? "Enter your password" : "Create a strong password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="auth-input"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={mode === "signup" ? 8 : 6}
                  required
                />
                <button
                  type="button"
                  className="auth-show-password"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {mode === "signup" && (
              <>
                <div className="auth-strength" aria-live="polite">
                  <div className="auth-strength-bars" aria-hidden="true">
                    {[0, 1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={strength && strength.score > level
                          ? `filled strength-${strength.score}`
                          : ""}
                      />
                    ))}
                  </div>
                  <span className="auth-strength-label">
                    {password
                      ? strengthLabels[strength?.score ?? 0]
                      : "Password strength"}
                  </span>
                </div>

                {password.length > 0 && strength?.feedback.suggestions?.length ? (
                  <p className="auth-strength-hint">
                    {strength.feedback.suggestions[0]}
                  </p>
                ) : null}

                <label className="auth-field">
                  <span>Confirm password</span>
                  <div className="auth-password-wrap">
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="confirm-password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      className="auth-input"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="auth-show-password"
                      onClick={() => setShowConfirm((value) => !value)}
                      aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                  {confirmPassword && (
                    <span className={`auth-match ${passwordsMatch ? "match-good" : "match-bad"}`}>
                      {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                    </span>
                  )}
                </label>
              </>
            )}

            <label className="auth-agree">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
                required
              />
              <span>
                I have read and agree to the{" "}
                <Link href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>,{" "}
                <Link href="/terms" target="_blank" rel="noreferrer">Terms of Service</Link>, and{" "}
                <Link href="/cookies" target="_blank" rel="noreferrer">Cookies Policy</Link>.
              </span>
            </label>

            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-success" role="status">{message}</p>}

            <button
              type="submit"
              className="auth-submit"
              disabled={
                loading ||
                googleLoading ||
                needsAgreement ||
                (mode === "signup" &&
                  (password.length < 8 || !strength || strength.score < 3 || !passwordsMatch))
              }
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign in to BillyOS"
                  : "Create account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="auth-bottom">
            <p>
              {mode === "signin" ? "New to BillyOS?" : "Already have an account?"}
              {" "}
              <button type="button" className="auth-toggle" onClick={switchMode}>
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
            <div className="auth-credit">
              BillyOS by Billy Nandy <span>·</span>
              <Link href="/privacy">Privacy</Link>
              <span>·</span>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
