import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About BillyOS AI",
  description:
    "Learn about BillyOS, an AI workspace designed for research, learning, productivity, and creation.",
};

export default function AboutPage() {
  return (
    <main className="public-page-shell" style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}>
      <h1>BillyOS</h1>
      <p>
        BillyOS AI is an AI-powered workspace designed to bring research,
        learning, productivity, and creative workflows into one unified
        experience.
      </p>

      <h2>Our idea</h2>
      <p>
        Instead of switching between many separate AI tools, BillyOS is built
        around the idea of giving users one intelligent workspace for exploring
        ideas, researching information, learning, and getting things done.
      </p>

      <h2>Built for what's next</h2>
      <p>
        BillyOS AI is an evolving project with a focus on making AI more useful,
        accessible, and capable across everyday workflows.
      </p>
    </main>
  );
}
