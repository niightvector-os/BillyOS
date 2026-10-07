import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI-Powered YouTube Search — BillyOS",
  alternates: { canonical: "https://billyos.co/youtube" },
  openGraph: {
    title: "AI-Powered YouTube Search — BillyOS",
    description: "Search YouTube through BillyOS: describe what you want to watch and get the right video fast, with related videos alongside it, all through real YouTube playback.",
    url: "https://billyos.co/youtube",
    siteName: "BillyOS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered YouTube Search — BillyOS",
    description: "Search YouTube through BillyOS: describe what you want to watch and get the right video fast, with related videos alongside it, all through real YouTube playback.",
  },
  description:
    "Search YouTube through BillyOS: describe what you want to watch and get the right video fast, with related videos alongside it, all through real YouTube playback.",
};

const points = [
  {
    icon: "⌕",
    title: "Describe it, don't just search for it",
    text: "Type what you're actually looking for in plain language, and BillyOS finds the video that matches — not just keyword matches.",
  },
  {
    icon: "▶",
    title: "Real YouTube, real playback",
    text: "Every video plays through YouTube's own official embedded player. BillyOS finds it; YouTube plays it.",
  },
  {
    icon: "◇",
    title: "Related videos alongside it",
    text: "Once a video is playing, related results sit right next to it — no need to leave and search again.",
  },
];

export default function YouTubePage() {
  return (
    <main className="public-page-shell public-page-scroll">
      <div className="public-page-inner">
        <header className="public-page-nav">
          <Link href="/" className="public-page-brand">
            <img src="/favicons/logo-mark-64.png" alt="BillyOS AI" />
            <span>BillyOS AI</span>
          </Link>

          <nav className="public-page-links" aria-label="BillyOS navigation">
            <Link href="/features">Features</Link>
            <Link href="/youtube">YouTube</Link>
            <Link href="/research">Research</Link>
            <Link href="/about">About</Link>
            <Link href="/">Open BillyOS</Link>
          </nav>
        </header>

        <section className="public-page-hero">
          <p className="public-page-eyebrow">BillyOS AI · YouTube</p>
          <h1 className="public-page-title">
            Find the video you<br />actually meant.
          </h1>
          <p className="public-page-lead">
            BillyOS's YouTube mode turns a plain-language description into the right video —
            fast — with related videos ready right alongside it.
          </p>
        </section>

        <section className="public-page-card">
          <p className="public-page-eyebrow">How it works</p>
          <h2>Search like you'd ask a person, not a search bar.</h2>
          <p>Instead of guessing the exact keywords a video's title might use, just describe what you want to watch. BillyOS searches YouTube directly and finds the match.</p>
          <p>Results come back quickly — the search doesn't wait on anything non-essential before showing you a video, and a visible indicator shows when a new search is running instead of leaving you guessing.</p>
        </section>

        <section>
          <div style={{ marginTop: 48 }}>
            <p className="public-page-eyebrow">What makes it different</p>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", letterSpacing: "-0.04em", margin: "8px 0 22px" }}>
              Built to feel fast and direct.
            </h2>
          </div>
          <div className="research-feature-grid">
            {points.map((p) => (
              <article className="research-feature" key={p.title}>
                <div className="research-feature-icon" aria-hidden="true">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-page-card">
          <p className="public-page-eyebrow">Try it</p>
          <h2>Open YouTube mode inside BillyOS.</h2>
          <p>YouTube mode is one of several ways to work inside BillyOS — alongside chat, Deep Research, Visualize, Find on Map, and Study Mode.</p>
          <a className="public-page-cta" href="/">Open BillyOS</a>
        </section>

        <footer className="public-page-footer">
          <span>© BillyOS AI</span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/features">Features</Link>
            <Link href="/research">Research</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
