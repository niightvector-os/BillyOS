import Link from "next/link";

export const metadata = {
  title: "Cookies Policy — BillyOS",
};

export default function CookiesPage() {
  return (
    <main className="public-page-shell privacy-stage">
      <Link href="/" className="auth-back">← BillyOS</Link>

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
    </main>
  );
}
