import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About BillyOS AI",
  description:
    "Learn about BillyOS AI, an evolving AI workspace built for research, learning, productivity, discovery, and creation.",
};

const principles = [
  {
    icon: "✦",
    title: "One workspace",
    text: "BillyOS AI brings different AI-powered workflows together instead of forcing users to move between separate tools for every task.",
  },
  {
    icon: "⌕",
    title: "Go beyond answers",
    text: "The goal is to help users explore, understand, investigate, and work with information rather than simply return a block of text.",
  },
  {
    icon: "◇",
    title: "Useful by default",
    text: "BillyOS is designed around practical workflows such as research, studying, visualization, maps, videos, files, and everyday AI assistance.",
  },
];

const capabilities = [
  "AI Chat",
  "Deep Research",
  "Study Mode",
  "Visualize",
  "Find on Map",
  "YouTube",
  "File Analysis",
  "Voice Input",
  "Ghost Mode",
];

export default function AboutPage() {
  return (
    <main className="public-page-shell">
      <div className="public-page-inner">
        <header className="public-page-nav">
          <Link href="/" className="public-page-brand">
            <img src="/favicons/logo-mark-64.png" alt="BillyOS AI" />
            <span>BillyOS AI</span>
          </Link>

          <nav className="public-page-links" aria-label="BillyOS navigation">
            <Link href="/features">Features</Link>
            <Link href="/research">Research</Link>
            <Link href="/about">About</Link>
            <Link href="/">Open BillyOS</Link>
          </nav>
        </header>

        <section className="public-page-hero">
          <p className="public-page-eyebrow">BillyOS AI · About</p>

          <h1 className="public-page-title">
            An AI workspace
            <br />
            built around people.
          </h1>

          <p className="public-page-lead">
            BillyOS AI is an evolving web application designed to bring
            research, learning, productivity, discovery, and creative
            workflows into one unified AI experience.
          </p>
        </section>

        <section className="public-page-card">
          <p className="public-page-eyebrow">The idea</p>
          <h2>AI should help you work, not just answer you.</h2>

          <p>
            BillyOS began as an independent software project exploring what an
            AI-first workspace could feel like on the web. The idea was simple:
            instead of treating every AI capability as a separate destination,
            create one environment where users can move naturally between
            conversation, research, learning, information, and action.
          </p>

          <p>
            BillyOS AI is designed to make those transitions feel natural. A
            user can start with a question, investigate a topic, visualize
            information, study it, explore locations, find useful videos, or
            work with supported files without leaving the broader workspace.
          </p>

          <p>
            The product is still early and evolving. Its current foundation is
            being developed with a long-term focus on making AI more useful
            across real-world workflows.
          </p>
        </section>

        <section>
          <div style={{ marginTop: 48 }}>
            <p className="public-page-eyebrow">What BillyOS AI stands for</p>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", letterSpacing: "-0.04em", margin: "8px 0 22px" }}>
              Built around a few simple principles.
            </h2>
          </div>

          <div className="research-feature-grid">
            {principles.map((principle) => (
              <article className="research-feature" key={principle.title}>
                <div className="research-feature-icon" aria-hidden="true">
                  {principle.icon}
                </div>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-page-card">
          <p className="public-page-eyebrow">Today's BillyOS AI</p>
          <h2>A growing collection of real workflows.</h2>

          <p>
            The current product includes the following capabilities:
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 9,
              marginTop: 20,
            }}
          >
            {capabilities.map((capability) => (
              <span
                key={capability}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.035)",
                  fontSize: 12,
                  opacity: 0.72,
                }}
              >
                {capability}
              </span>
            ))}
          </div>

          <Link href="/features" className="public-page-cta">
            Explore all features
          </Link>
        </section>

        <section className="public-page-card">
          <p className="public-page-eyebrow">Where it's going</p>
          <h2>From intelligence toward creation.</h2>

          <p>
            BillyOS AI is being developed toward a broader creation-focused
            experience where AI can help users move from an initial idea toward
            a real outcome.
          </p>

          <p>
            A planned direction is <strong>FORGE — Idea to Creation Engine</strong>,
            a future concept for coordinating research, design, generation,
            coding, testing, and other specialized capabilities inside
            BillyOS.
          </p>

          <p>
            FORGE is currently a planned direction and is not represented as a
            live feature of the product yet.
          </p>
        </section>

        <section
          style={{
            marginTop: 28,
            padding: "34px 28px",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <p className="public-page-eyebrow">The project</p>
          <h2 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.03em" }}>
            Built independently. Designed to evolve.
          </h2>

          <p
            style={{
              maxWidth: 720,
              margin: "14px 0 0",
              lineHeight: 1.8,
              opacity: 0.6,
            }}
          >
            BillyOS AI is an independent software project built with modern
            web technologies and an emphasis on experimentation, iteration,
            and practical AI workflows.
          </p>
        </section>

        <footer className="public-page-footer">
          <span>© BillyOS AI</span>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/features">Features</Link>
            <Link href="/research">Research</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
