import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Deep Research",
  alternates: { canonical: "https://billyos.co/research" },
  openGraph: {
    title: "Deep Research — BillyOS AI",
    description: "Explore BillyOS AI Deep Research, a web-powered workflow for investigating current topics and organizing source-backed information.",
    url: "https://billyos.co/research",
    siteName: "BillyOS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep Research — BillyOS AI",
    description: "Explore BillyOS AI Deep Research, a web-powered workflow for investigating current topics and organizing source-backed information.",
  },
  description:
    "Explore BillyOS AI Deep Research, a web-powered workflow for investigating current topics and organizing source-backed information.",
};

const researchFeatures = [
  {
    icon: "⌕",
    title: "Explore current topics",
    description:
      "Research topics that require information beyond a static answer, including recent developments and changing facts.",
  },
  {
    icon: "✦",
    title: "Go deeper",
    description:
      "Turn a question into a more focused research workflow instead of stopping at a short conversational response.",
  },
  {
    icon: "↗",
    title: "Work with sources",
    description:
      "Review source links alongside research responses so you can continue exploring the information yourself.",
  },
  {
    icon: "◫",
    title: "Keep the context",
    description:
      "Continue asking follow-up questions while keeping the research topic and previous result in context.",
  },
];

export default function ResearchPage() {
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
            <Link href="/about">About</Link>
            <Link href="/">Open BillyOS</Link>
          </nav>
        </header>

        <section className="public-page-hero">
          <p className="public-page-eyebrow">BillyOS AI · Research</p>

          <h1 className="public-page-title">
            Go beyond the
            <br />
            first answer.
          </h1>

          <p className="public-page-lead">
            Deep Research gives BillyOS a dedicated workflow for investigating
            topics, finding current information, working with sources, and
            continuing the research through follow-up questions.
          </p>

          <Link href="/" className="public-page-cta">
            Research with BillyOS AI
          </Link>
        </section>

        <section aria-labelledby="research-capabilities">
          <div className="public-page-card">
            <p className="public-page-eyebrow">Capabilities</p>
            <h2 id="research-capabilities">Research built into the workspace.</h2>

            <div className="research-feature-grid">
              {researchFeatures.map((feature) => (
                <article className="research-feature" key={feature.title}>
                  <div className="research-feature-icon" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="public-page-card">
          <p className="public-page-eyebrow">How it fits</p>
          <h2>Research without leaving BillyOS.</h2>
          <p>
            Deep Research is part of the broader BillyOS AI workspace. Start
            with a question, investigate a topic, inspect sources, and continue
            the conversation from the same environment.
          </p>
        </section>

        <footer className="public-page-footer">
          <span>© BillyOS AI</span>
          <div>
            <Link href="/features">Features</Link>{" "}
            · <Link href="/about">About</Link>{" "}
            · <Link href="/privacy">Privacy</Link>{" "}
            · <Link href="/terms">Terms</Link>{" "}
            · <Link href="/cookies">Cookies</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
