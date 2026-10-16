import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./founder.module.css";
import { LiveHeadline, LiveQuote } from "./LiveText";

const SITE = "https://billyos.co";
const PAGE_URL = `${SITE}/founder`;
const TITLE = "Billy Nandy — Creator & Founder of BillyOS AI";
const DESCRIPTION =
  "Billy Nandy is a software developer, entrepreneur, and creative thinker building BillyOS, an agentic AI workspace that brings all your tabs into one workspace.";

const LOGO_SRC = "/favicons/logo-mark-64.png";
const PHOTO_SRC = "/images/billy-nandy.jpg";
const CUTOUT_SRC = "/images/billy-nandy-cutout.png";
const PHOTO_ALT = "Billy Nandy, Creator and Founder of BillyOS AI";
const PHOTO_URL = `${SITE}${PHOTO_SRC}`;

const QUOTE_WORDS = [
  { t: "Many", e: true },
  { t: "tabs?", e: true },
  { t: "Why" },
  { t: "not" },
  { t: "just" },
  { t: "one" },
  { t: "tab" },
  { t: "with" },
  { t: "all" },
  { t: "your" },
  { t: "work" },
  { t: "in" },
  { t: "one", e: true },
  { t: "displayed", e: true },
  { t: "Workspace?", e: true },
];

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "profile",
    url: PAGE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "BillyOS AI",
    firstName: "Billy",
    lastName: "Nandy",
    images: [{ url: PHOTO_URL, alt: PHOTO_ALT }],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: [PHOTO_URL],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${PAGE_URL}#profilepage`,
      url: PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE}/#website` },
      mainEntity: { "@id": `${PAGE_URL}#person` },
    },
    {
      "@type": "Person",
      "@id": `${PAGE_URL}#person`,
      name: "Billy Nandy",
      url: PAGE_URL,
      image: PHOTO_URL,
      jobTitle: "Creator and Founder of BillyOS AI",
      description: DESCRIPTION,
      worksFor: { "@id": `${SITE}/#organization` },
      knowsAbout: [
        "Software development",
        "Artificial intelligence",
        "Agentic AI workspaces",
      ],
      sameAs: ["https://www.instagram.com/billyirl0/"],
    },
  ],
};

export default function FounderPage() {
  const hasCutout = fs.existsSync(
    path.join(process.cwd(), "public", CUTOUT_SRC),
  );

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className={styles.nav}>
        <div className={`${styles.shell} ${styles.navInner}`}>
          <Link href="/" className={styles.brand}>
            <Image src={LOGO_SRC} alt="" width={28} height={28} />
            <span>BillyOS</span>
          </Link>
          <nav className={styles.navLinks} aria-label="Primary">
            <Link href="/about" className={styles.navLink}>
              About
            </Link>
            <Link href="/features" className={styles.navLink}>
              Features
            </Link>
            <Link href="/explore-apps" className={`${styles.navLink} ${styles.navCta}`}>
              Explore Apps
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section
          className={`${styles.hero} ${hasCutout ? styles.heroWithPortrait : ""}`}
          aria-label="Meet the founder"
        >
          <span className={`${styles.rail} ${styles.railLeft}`} aria-hidden="true">
            Founder · BillyOS AI
          </span>
          <span className={`${styles.rail} ${styles.railRight}`} aria-hidden="true">
            Scroll
          </span>

          <LiveHeadline lines={["Meet the", "Founder"]} label="Meet the Founder" />

          {hasCutout ? (
            <div className={styles.portrait}>
              <Image
                src={CUTOUT_SRC}
                alt={PHOTO_ALT}
                fill
                priority
                sizes="(max-width: 640px) 90vw, 520px"
                className={styles.portraitImg}
              />
            </div>
          ) : null}
        </section>

        <section className={`${styles.shell} ${styles.profile}`}>
          <div>
            <p className={styles.eyebrow}>Founder</p>
            <h1 className={styles.name}>Billy Nandy</h1>
            <p className={styles.role}>Creator &amp; Founder of BillyOS AI</p>
          </div>
          <div>
            <p className={styles.lede}>
              Billy Nandy is a software developer, entrepreneur, and creative
              thinker building BillyOS, an agentic AI workspace set to help
              people bring all their tabs into one workspace.
            </p>
            <dl className={styles.facts}>
              <dt>Role</dt>
              <dd>Creator &amp; Founder</dd>
              <dt>Company</dt>
              <dd>
                <Link href="/">BillyOS AI</Link>
              </dd>
              <dt>Building</dt>
              <dd>An agentic AI workspace</dd>
              <dt>Elsewhere</dt>
              <dd>
                <a
                  href="https://www.instagram.com/billyirl0/"
                  rel="me noopener noreferrer"
                  target="_blank"
                >
                  Instagram
                </a>
              </dd>
            </dl>
            <div className={styles.textLinks}>
              <Link href="/about" className={styles.textLink}>
                About BillyOS
              </Link>
              <Link href="/explore-apps" className={styles.textLink}>
                Explore Apps
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.quoteSection} aria-label="A quote from the founder">
          <div className={styles.shell}>
            <p className={styles.quoteLabel}>In his words</p>
            <span className={styles.quoteMark} aria-hidden="true">
              “
            </span>
            <LiveQuote words={QUOTE_WORDS} />
            <p className={styles.quoteCite}>
              Billy Nandy, Creator and Founder of BillyOS AI
            </p>
          </div>
        </section>

        <section className={styles.story} aria-label="The story behind BillyOS">
          <div className={styles.shell}>
            <article className={styles.row}>
              <p className={styles.rowLabel}>The problem</p>
              <div>
                <h2 className={styles.rowTitle}>
                  Work lives in too many places.
                </h2>
                <p className={styles.rowText}>
                  A normal working session now means an AI assistant in one tab,
                  a document in another, a tutorial video in a third, notes
                  somewhere else, and a browser bar full of half-finished
                  thoughts. Each tool is good on its own. Together they cost you
                  focus, because the real work becomes the constant switching
                  between them.
                </p>
              </div>
            </article>

            <article className={styles.row}>
              <p className={styles.rowLabel}>The idea</p>
              <div>
                <h2 className={styles.rowTitle}>
                  What if the tabs stopped being separate places?
                </h2>
                <p className={styles.rowText}>
                  BillyOS starts from that question. One tab, one displayed
                  workspace, with windows you arrange the way you would arrange
                  papers on a desk. Your AI agents, your notes, your videos and
                  your files sit side by side, so you can look at them, and
                  think with them, at the same time.
                </p>
              </div>
            </article>

            <article className={styles.row}>
              <p className={styles.rowLabel}>The product</p>
              <div>
                <h2 className={styles.rowTitle}>
                  An operating-system-style workspace, in the browser.
                </h2>
                <p className={styles.rowText}>
                  BillyOS is being built as the world’s first multi-window AI
                  agent workspace: a desktop with an app launcher, a dock and
                  windows that run together. AI agents, study tools, notes,
                  files, video and a developer environment sit side by side. It
                  is in active development, and each app earns its place by
                  working properly rather than by looking finished.
                </p>
              </div>
            </article>

            <article className={styles.row}>
              <p className={styles.rowLabel}>The direction</p>
              <div>
                <h2 className={styles.rowTitle}>
                  Billy sets what belongs in the workspace.
                </h2>
                <p className={styles.rowText}>
                  As creator and founder, Billy Nandy drives where BillyOS goes:
                  what belongs on the desktop, what does not, and how it should
                  feel to use every day. The aim stays the same as the quote
                  above. Less hopping between tabs, more room for the work
                  itself.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.principles}`}>
          <div className={styles.principle}>
            <h3>One workspace</h3>
            <p>Everything you work on stays in a single, organized view.</p>
          </div>
          <div className={styles.principle}>
            <h3>Agents beside your work</h3>
            <p>AI sits next to your documents and notes, not in a separate tab.</p>
          </div>
          <div className={styles.principle}>
            <h3>Built for focus</h3>
            <p>Fewer context switches, so attention stays on the task.</p>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.ctaWrap}`}>
          <div className={styles.cta}>
            <div>
              <h2 className={styles.ctaTitle}>See what is being built</h2>
              <p className={styles.ctaText}>
                Browse the apps that are coming to the BillyOS desktop, or read
                more about the project.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/explore-apps" className={styles.btnPrimary}>
                Explore Apps
              </Link>
              <Link href="/about" className={styles.btnGhost}>
                About BillyOS
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerInner}`}>
          <span className={styles.footerBrand}>
            <Image src={LOGO_SRC} alt="" width={22} height={22} />
            © BillyOS AI
          </span>
          <nav aria-label="Footer">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/explore-apps">Explore Apps</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
