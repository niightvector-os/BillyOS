import Link from "next/link";

export const metadata = {
  title: "Terms of Service — BillyOS",
};

export default function TermsPage() {
  return (
    <main className="public-page-shell privacy-stage">
      <Link href="/" className="auth-back">← BillyOS</Link>

      <div className="privacy-card">
        <h1>Terms of Service</h1>
        <p className="privacy-updated">Last updated: September 2026</p>

        <p>
          These Terms of Service ("Terms") govern your use of BillyOS (the "Service"), operated
          by Billy Nandy ("we," "our," or "us"), based in Rwanda. By creating an account or using
          BillyOS, you agree to these Terms. If you don't agree, please don't use the Service.
        </p>

        <h2>Eligibility</h2>
        <p>
          BillyOS is not directed at children under 13, and you must be at least 13 years old to
          use it. If you are under the age of majority in your jurisdiction, you may only use
          BillyOS with the involvement of a parent or guardian.
        </p>

        <h2>Your account</h2>
        <ul>
          <li>You're responsible for keeping your login credentials secure.</li>
          <li>You're responsible for activity that happens under your account.</li>
          <li>You must provide accurate information when creating an account.</li>
        </ul>

        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use BillyOS for anything illegal, harmful, or fraudulent.</li>
          <li>Attempt to bypass usage limits, security measures, or access controls.</li>
          <li>Reverse-engineer, scrape, or resell the Service without permission.</li>
          <li>Use the Service to generate content that infringes on others' rights or breaks the law.</li>
          <li>Interfere with or disrupt the Service or its infrastructure.</li>
        </ul>

        <h2>AI-generated content</h2>
        <p>
          BillyOS uses third-party AI models to generate responses. These responses may
          sometimes be incomplete, inaccurate, or inappropriate for your situation. BillyOS is
          not a substitute for professional medical, legal, financial, or other expert advice.
          You are responsible for evaluating and verifying anything BillyOS generates before
          relying on it.
        </p>

        <h2>Credits and usage limits</h2>
        <p>
          BillyOS may apply daily usage limits ("credits") to manage fair use of the Service.
          These limits may change over time. Some features may in the future require a paid
          subscription; if so, separate pricing and billing terms will apply and will be
          presented to you before any charge.
        </p>

        <h2>Intellectual property</h2>
        <p>
          BillyOS's software, design, and branding are owned by us. You retain ownership of the
          messages and content you submit. By using the Service, you grant us the right to
          process your input as needed to generate a response and operate the Service.
        </p>

        <h2>Third-party services</h2>
        <p>
          BillyOS relies on third-party providers (including Supabase, OpenRouter, Groq, Google,
          Tavily, and the YouTube Data API) to deliver its features. We aren't responsible for
          outages, errors, or content originating from these third parties.
        </p>

        <h2>Termination</h2>
        <p>
          We may suspend or terminate your access to BillyOS if you violate these Terms. You may
          stop using the Service and request account deletion at any time.
        </p>

        <h2>Disclaimer of warranties</h2>
        <p>
          BillyOS is provided "as is" and "as available," without warranties of any kind, express
          or implied, including fitness for a particular purpose or non-infringement.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any indirect, incidental,
          or consequential damages arising from your use of BillyOS, including damages resulting
          from AI-generated content.
        </p>

        <h2>Governing law</h2>
        <p>
          These Terms are governed by the laws of Rwanda, without regard to conflict-of-law
          principles. Any dispute arising from these Terms will be resolved in the courts of
          Rwanda, except where local consumer-protection law requires otherwise.
        </p>

        <h2>Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of BillyOS after a change
          means you accept the updated Terms.
        </p>

        <h2>Contact us</h2>
        <p>
          Questions about these Terms? Email us at{" "}
          <a href="mailto:billynandy123@gmail.com">billynandy123@gmail.com</a>.
        </p>
      </div>
    </main>
  );
}
