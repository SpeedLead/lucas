import { siteConfig } from "@/lib/site-config";
import type { Metadata, Viewport } from "next";
import { Bebas_Neue, JetBrains_Mono, Work_Sans } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — table tennis, markets, and AI`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Lucas", "table tennis", "stock market", "AI", "personal website"],
  authors: [{ name: siteConfig.fullName }],
  creator: siteConfig.fullName,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} — table tennis, markets, and AI`,
    description: siteConfig.description,
    siteName: `${siteConfig.name}'s website`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — table tennis, markets, and AI`,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
