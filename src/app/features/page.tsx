import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BillyOS AI Features",
  alternates: { canonical: "https://billyos.co/features" },
  openGraph: {
    title: "BillyOS AI Features",
    description: "Explore BillyOS AI features for research, learning, discovery, visualization, files, maps, YouTube, voice input, and everyday AI assistance.",
    url: "https://billyos.co/features",
    siteName: "BillyOS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BillyOS AI Features",
    description: "Explore BillyOS AI features for research, learning, discovery, visualization, files, maps, YouTube, voice input, and everyday AI assistance.",
  },
  description:
    "Explore BillyOS AI features for research, learning, discovery, visualization, files, maps, YouTube, voice input, and everyday AI assistance.",
};

const features = [
  {
    icon: "✦",
    name: "AI Chat",
    description:
      "A conversational AI workspace for questions, ideas, problem solving, writing, explanations, and everyday assistance.",
    tag: "Core",
  },
  {
    icon: "✧",
    name: "Deep Research",
    description:
      "Research current topics with web-powered information gathering and organized answers backed by sources.",
    tag: "Research",
  },
  {
    icon: "▣",
    name: "Study Mode",
    description:
      "Turn a subject into an AI-powered study experience designed to explain concepts and help you learn.",
    tag: "Learning",
  },
  {
    icon: "◇",
    name: "Visualize",
    description:
      "Turn information into charts, tables, timelines, comparisons, and other visual formats when words alone are not enough.",
    tag: "Visual",
  },
  {
    icon: "⌖",
    name: "Find on Map",
    description:
      "Explore places, distances, routes, and geographic information through an AI-guided map workflow.",
    tag: "Maps",
  },
  {
    icon: "▶",
    name: "YouTube",
    description:
      "Find relevant videos and learning resources around the topic you're exploring.",
    tag: "Discovery",
  },
  {
    icon: "◫",
    name: "File Analysis",
    description:
      "Upload supported files and work with their extracted content inside your BillyOS workflow.",
    tag: "Files",
  },
  {
    icon: "◉",
    name: "Voice Input",
    description:
      "Speak naturally to BillyOS using supported browser voice recognition instead of typing every request.",
    tag: "Voice",
  },
  {
    icon: "◌",
    name: "Ghost Mode",
    description:
      "A focused BillyOS experience designed for a cleaner, more distraction-free interaction.",
    tag: "Focus",
  },
];

export default function FeaturesPage() {
  return (
    <main
      className="features-scroll-page"
      style={{
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% -10%, rgba(124,108,255,0.16), transparent 38%), #07070a",
        color: "#f5f5f7",
        fontFamily: "var(--font-body), Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "28px 24px 90px",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 80,
          }}
        >
          <Link
            href="/"
            style={{
              color: "inherit",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            <img
              src="/favicons/logo-mark-64.png"
              alt="BillyOS AI"
              width={34}
              height={34}
              style={{ borderRadius: 10 }}
            />
            <span>BillyOS AI</span>
          </Link>

          <nav style={{ display: "flex", gap: 18, fontSize: 14, opacity: 0.78 }}>
            <Link href="/features" style={{ color: "inherit", textDecoration: "none" }}>
              Features
            </Link>
            <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>
              About
            </Link>
            <Link
              href="/"
              style={{
                color: "inherit",
                textDecoration: "none",
                padding: "9px 14px",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 999,
              }}
            >
              Open BillyOS
            </Link>
          </nav>
        </header>

        <section style={{ maxWidth: 820, margin: "0 auto 90px", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              fontSize: 12,
              opacity: 0.72,
              marginBottom: 24,
            }}
          >
            <span>✦</span>
            BillyOS AI
            <span>•</span>
            One unified AI workspace
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(44px, 7vw, 78px)",
              lineHeight: 0.98,
              letterSpacing: "-0.055em",
              fontWeight: 700,
            }}
          >
            AI that works
            <br />
            <span style={{ opacity: 0.48 }}>with the way you think.</span>
          </h1>

          <p
            style={{
              maxWidth: 700,
              margin: "28px auto 0",
              fontSize: "clamp(17px, 2vw, 20px)",
              lineHeight: 1.7,
              opacity: 0.68,
            }}
          >
            BillyOS AI brings conversation, research, learning, discovery,
            visualization, files, and more into one intelligent workspace.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 34,
            }}
          >
            <Link
              href="/"
              style={{
                color: "#08080a",
                background: "#f5f5f7",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Try BillyOS AI
            </Link>

            <Link
              href="/about"
              style={{
                color: "#f5f5f7",
                background: "rgba(255,255,255,0.06)",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: 999,
                fontWeight: 500,
                fontSize: 14,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              About BillyOS
            </Link>
          </div>
        </section>

        <section aria-labelledby="features-heading">
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                opacity: 0.42,
              }}
            >
              What's inside
            </p>
            <h2
              id="features-heading"
              style={{
                margin: "9px 0 0",
                fontSize: "clamp(30px, 4vw, 46px)",
                letterSpacing: "-0.04em",
              }}
            >
              One workspace. Multiple ways to work.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {features.map((feature) => (
              <article
                key={feature.name}
                style={{
                  minHeight: 220,
                  padding: 24,
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.085)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 22,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: 24,
                        opacity: 0.9,
                      }}
                    >
                      {feature.icon}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        opacity: 0.4,
                      }}
                    >
                      {feature.tag}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: 22,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {feature.name}
                  </h3>

                  <p
                    style={{
                      margin: "12px 0 0",
                      fontSize: 14,
                      lineHeight: 1.7,
                      opacity: 0.58,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 90,
            padding: "42px 30px",
            textAlign: "center",
            borderRadius: 28,
            background:
              "linear-gradient(135deg, rgba(124,108,255,0.13), rgba(255,255,255,0.035))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 44px)",
              letterSpacing: "-0.04em",
            }}
          >
            Your ideas deserve a workspace.
          </h2>

          <p
            style={{
              maxWidth: 650,
              margin: "14px auto 26px",
              lineHeight: 1.7,
              opacity: 0.58,
              fontSize: 15,
            }}
          >
            BillyOS AI is evolving toward a broader creation-focused
            workspace where AI can help users move from questions and ideas
            toward real outcomes.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              color: "#08080a",
              background: "#f5f5f7",
              textDecoration: "none",
              padding: "12px 20px",
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Enter BillyOS AI
          </Link>
        </section>

        <footer
          style={{
            marginTop: 50,
            paddingTop: 26,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            fontSize: 12,
            opacity: 0.38,
          }}
        >
          <span>© BillyOS AI</span>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>
              About
            </Link>
            <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>
              Privacy
            </Link>
            <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }}>
              Terms
            </Link>
            <Link href="/cookies" style={{ color: "inherit", textDecoration: "none" }}>
              Cookies
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
