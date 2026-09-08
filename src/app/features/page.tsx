import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BillyOS AI Features",
  description:
    "Explore BillyOS features including AI chat, Deep Research, Study Mode, Visualize, maps, and video discovery.",
};

const features = [
  ["AI Chat", "Have natural conversations with BillyOS and work through ideas, questions, and problems."],
  ["Deep Research", "Explore current topics and gather information through AI-powered research workflows."],
  ["Study Mode", "Turn learning topics into structured AI-powered study experiences."],
  ["Visualize", "Transform information into charts, tables, comparisons, timelines, and other visual formats."],
  ["Find on Map", "Explore locations, distances, routes, and geographic information through an AI-guided workflow."],
  ["YouTube", "Discover relevant videos and learning resources around a topic."],
  ["Ghost Mode", "Use BillyOS with a privacy-focused interface designed around distraction-free interaction."],
];

export default function FeaturesPage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
      <h1>BillyOS AI Features</h1>

      <p>
        BillyOS AI brings multiple AI-powered workflows into one unified
        workspace for research, learning, discovery, and productivity.
      </p>

      <section>
        {features.map(([name, description]) => (
          <article key={name} style={{ marginTop: 32 }}>
            <h2>{name}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
