import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-Powered YouTube Search — BillyOS",
  alternates: { canonical: "https://billyos.co/youtube" },
  openGraph: {
    title: "AI-Powered YouTube Search — BillyOS",
    description: "Search YouTube through BillyOS: describe what you want to watch and get the right video fast, with related videos alongside it, all through real YouTube playback.",
    url: "https://billyos.co/youtube",
    siteName: "BillyOS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered YouTube Search — BillyOS",
    description: "Search YouTube through BillyOS: describe what you want to watch and get the right video fast, with related videos alongside it, all through real YouTube playback.",
  },
  description:
    "Search YouTube through BillyOS: describe what you want to watch and get the right video fast, with related videos alongside it, all through real YouTube playback.",
};

export default function YouTubeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
