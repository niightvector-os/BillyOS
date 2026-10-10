
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const siteUrl = "https://billyos.co";
const profileUrl = `${siteUrl}/founder`;
const photoUrl = `${siteUrl}/images/billy-nandy.jpg`;

export const metadata: Metadata = {
  title: "Billy Nandy — Founder of BillyOS AI",
  description:
    "Meet Billy Nandy, the creator and founder of BillyOS AI, an AI-powered workspace for research, learning, and creation.",
  alternates: {
    canonical: profileUrl,
  },
  openGraph: {
    type: "profile",
    url: profileUrl,
    title: "Billy Nandy — Founder of BillyOS AI",
    description:
      "Learn about Billy Nandy and his work creating BillyOS AI.",
    images: [
      {
        url: photoUrl,
        width: 600,
        height: 600,
        alt: "Billy Nandy",
      },
    ],
  },
};

const person = {
  "@type": "Person",
  "@id": `${profileUrl}#person`,
  name: "Billy Nandy",
  url: profileUrl,
  image: {
    "@type": "ImageObject",
    url: photoUrl,
    contentUrl: photoUrl,
    caption: "Billy Nandy",
  },
  jobTitle: "Founder and CEO of BillyOS AI",
  founder: {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "BillyOS AI",
    url: siteUrl,
  },
  description:
    "Billy Nandy is the creator and founder of BillyOS AI, an AI-powered workspace designed to bring research, learning, visualization, and other AI workflows together.",
  mainEntityOfPage: profileUrl,
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${profileUrl}#profilepage`,
  url: profileUrl,
  name: "Billy Nandy — Founder of BillyOS AI",
  mainEntity: person,
};

export default function FounderPage() {
  return (
    <main className="public-page-shell public-page-scroll">
      <div className="public-page-inner">
        <header className="public-page-nav">
          <Link href="/" className="public-page-brand">
            <img src="/favicons/logo-mark-64.png" alt="BillyOS AI" />
            <span>BillyOS AI</span>
          </Link>

          <nav className="public-page-links" aria-label="Main navigation">
            <Link href="/about">About BillyOS</Link>
            <Link href="/">Open BillyOS</Link>
          </nav>
        </header>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(
              /</g,
              "\\u003c"
            ),
          }}
        />

        <section className="public-page-hero">
          <p className="public-page-eyebrow">
            CREATOR & FOUNDER · BILLYOS AI
          </p>

          <h1 className="public-page-title">Billy Nandy</h1>

          <p className="public-page-lead">
            Creator and founder of BillyOS AI, an AI-powered
            workspace bringing research, learning, visualization,
            and creative workflows together.
          </p>

          <div style={{ marginTop: 28 }}>
            <Image
              src="/images/billy-nandy.jpg"
              alt="Portrait of Billy Nandy"
              width={600}
              height={600}
              priority
              style={{
                width: "min(100%, 360px)",
                height: "auto",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 24,
              }}
            />
          </div>
        </section>

        <section className="public-page-card">
          <p className="public-page-eyebrow">ABOUT THE FOUNDER</p>

          <h2>Building BillyOS AI</h2>

          <p>
            Billy Nandy is the creator and founder of BillyOS AI,
            an independent software project exploring how artificial
            intelligence can support research, learning, productivity,
            and creation in one unified workspace.
          </p>

          <p>
            Through BillyOS AI, he is developing an environment where
            people can explore ideas, investigate topics, visualize
            information, study concepts, and work with AI-powered tools.
          </p>

          <p>
            BillyOS AI is an evolving project focused on making
            AI workflows more integrated and useful.
          </p>

          <Link href="/about" className="public-page-cta">
            Discover BillyOS AI
          </Link>
        </section>

        <footer className="public-page-footer">
          <span>© BillyOS AI</span>
          <Link href="/">Official website</Link>
        </footer>
      </div>
    </main>
  );
}
