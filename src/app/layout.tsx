import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://billyos.co"),

  title: {
    default: "BillyOS — AI Workspace for Research, Learning & Creation",
    template: "%s | BillyOS",
  },

  description:
    "BillyOS is an AI workspace for research, learning, creation, and everyday tasks. Chat, investigate topics, visualize ideas, study, and get things done in one place.",

  applicationName: "BillyOS",

  alternates: {
    canonical: "https://billyos.co/",
  },

  openGraph: {
    type: "website",
    url: "https://billyos.co/",
    siteName: "BillyOS",
    title: "BillyOS — AI Workspace for Research, Learning & Creation",
    description:
      "BillyOS is an AI workspace for research, learning, creation, and everyday tasks. Chat, investigate topics, visualize ideas, study, and get things done in one place.",
  },

  twitter: {
    card: "summary_large_image",
    title: "BillyOS — AI Workspace for Research, Learning & Creation",
    description:
      "BillyOS is an AI workspace for research, learning, creation, and everyday tasks. Chat, investigate topics, visualize ideas, study, and get things done in one place.",
  },

  icons: {
    icon: [
      {
        url: "/favicons/logo-mark-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicons/logo-mark-64.png",
        sizes: "64x64",
        type: "image/png",
      },
    ],
    apple: "/favicons/logo-mark-180.png",
  },

  verification: {
    google: "d_0WwkdAPTGZntmipcTisfANiq2XW_FimwrGMM-_GWk",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://billyos.co/#website",
      "url": "https://billyos.co/",
      "name": "BillyOS",
      "alternateName": ["BillyOS AI", "Billy AI"],
      "description": "BillyOS is an AI workspace for researching, learning, creating, and getting things done in one unified experience."
    },
    {
      "@type": "WebApplication",
      "@id": "https://billyos.co/#application",
      "name": "BillyOS AI",
      "url": "https://billyos.co/",
      "description": "BillyOS AI is an AI workspace for research, learning, productivity, discovery, and creation.",
      "applicationCategory": "ProductivityApplication",
      "operatingSystem": "Web"
    },
    {
      "@type": "Organization",
      "@id": "https://billyos.co/#organization",
      "name": "BillyOS",
      "alternateName": ["BillyOS AI", "Billy AI"],
      "url": "https://billyos.co/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://billyos.co/favicons/logo-mark-512.png"
      }
    }
  ]
};

// BillyOS structured data
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {children}
      </body>
    </html>
  );
}
