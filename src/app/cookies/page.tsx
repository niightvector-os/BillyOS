import Link from "next/link";

export const metadata = {
  title: "Cookies Policy — BillyOS",
};

export default function CookiesPage() {
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
            <Link href="/research">Research</Link>
            <Link href="/about">About</Link>
            <Link href="/login">Sign in</Link>
          </nav>
        </header>

        <section className="legal-page-hero">
          <p className="public-page-eyebrow">BillyOS AI · Cookies</p>
          <h1 className="public-page-title">Cookies Policy</h1>
          <p className="public-page-lead">
            Clear information about how BillyOS works and what it means for you.
          </p>
        </section>

        <div className="privacy-card">
        <h1>Cookies Policy</h1>
        <p className="privacy-updated">Last updated: September 2026</p>

        <p>
          This policy explains how BillyOS uses cookies and similar technologies when you use
          the Service.
        </p>

        <h2>What we use cookies for</h2>
        <ul>
          <li>
            <strong>Authentication:</strong> to keep you signed in and recognize your account
            across visits (via Supabase Auth).
          </li>
          <li>
            <strong>Usage limits:</strong> a cookie is used to track anonymous (logged-out) usage
            so we can apply a fair trial limit before asking you to sign up.
          </li>
          <li>
            <strong>Preferences:</strong> to remember settings like your preferred language.
          </li>
        </ul>

        <h2>What we don't use cookies for</h2>
        <p>
          BillyOS does not currently use third-party advertising cookies or cross-site tracking
          cookies. We do not sell data collected through cookies to advertisers.
        </p>

        <h2>Managing cookies</h2>
        <p>
          Most browsers let you block or delete cookies through their settings. Blocking
          essential cookies (like authentication) may prevent you from staying signed in or
          using parts of the Service.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Cookies Policy as BillyOS's features change. Changes will be posted
          on this page with an updated "Last updated" date.
        </p>

        <h2>Contact us</h2>
        <p>
          Questions about this policy? Email us at{" "}
          <a href="mailto:billynandy123@gmail.com">billynandy123@gmail.com</a>.
        </p>
        </div>

        <footer className="public-page-footer legal-page-footer">
          <div className="legal-footer-brand">
            <span>BillyOS AI</span>
            <small>One AI workspace for research, learning & creation.</small>
          </div>

          <div className="legal-footer-links">
            <div>
              <span>Explore</span>
              <Link href="/">Home</Link>
              <Link href="/features">Features</Link>
              <Link href="/research">Research</Link>
              <Link href="/about">About</Link>
            </div>

            <div>
              <span>Account</span>
              <Link href="/login">Sign in</Link>
            </div>

            <div>
              <span>Legal</span>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/cookies">Cookies</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
