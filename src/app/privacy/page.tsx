import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — BillyOS",
};

export default function PrivacyPage() {
  return (
    <main className="privacy-stage">
      <Link href="/" className="auth-back">← BillyOS</Link>

      <div className="privacy-card">
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: August 2026</p>

        <p>
          BillyOS ("we," "our," or "us") respects your privacy. This policy explains what
          information we collect, how we use it, and the choices you have.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> your name and email address, provided either
            directly (email/password signup) or through Google Sign-In.
          </li>
          <li>
            <strong>Conversation data:</strong> messages you send to BillyOS and the responses
            you receive, so your conversation history can be saved and revisited.
          </li>
          <li>
            <strong>Usage data:</strong> which features you use (chat, research, visualize, maps,
            video, study mode) and your daily credit balance.
          </li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>To operate and provide the BillyOS service, including saving your conversations.</li>
          <li>To personalize responses based on your account and preferences.</li>
          <li>To maintain and improve the reliability and quality of the app.</li>
        </ul>
        <p>We do not sell your personal information to advertisers or other third parties.</p>

        <h2>Third-party services</h2>
        <p>
          To provide BillyOS's features, some data is processed by the following third-party
          services:
        </p>
        <ul>
          <li><strong>Supabase</strong> — authentication, database, and storage.</li>
          <li><strong>OpenRouter</strong> — routes your messages to AI models to generate responses.</li>
          <li><strong>Tavily</strong> — powers Deep Research's live web search.</li>
          <li><strong>YouTube Data API</strong> — powers Explain with Video.</li>
          <li><strong>OpenStreetMap / Nominatim</strong> — powers Find on Map.</li>
        </ul>
        <p>
          Each of these providers processes data only as needed to deliver the relevant feature.
        </p>

        <h2>Data retention and deletion</h2>
        <p>
          Your conversations and account data are retained until you delete them or request
          account deletion. To request deletion of your account or data, contact us at the
          email below.
        </p>

        <h2>Children's privacy</h2>
        <p>
          BillyOS is not directed at children under 13, and we do not knowingly collect
          information from children under 13.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this
          page with an updated "Last updated" date.
        </p>

        <h2>Contact us</h2>
        <p>
          Questions about this policy or your data? Email us at{" "}
          <a href="mailto:billynandy123@gmail.com">billynandy123@gmail.com</a>.
        </p>
      </div>
    </main>
  );
}
