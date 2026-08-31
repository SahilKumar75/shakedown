import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font_display",
  display: "swap",
});

const text = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font_text",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font_mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shakedown",
    template: "%s · Shakedown",
  },
  description:
    "Find the defect in a benchmark task bundle before the review pipeline charges you for it. Six probes and an agent execute the bundle and report only what they reproduced.",
  applicationName: "Shakedown",
  openGraph: {
    title: "Shakedown",
    description:
      "Pre submission review for benchmark task bundles. Every finding is backed by a run.",
    type: "website",
  },
};

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/method", label: "Method" },
  { href: "/report", label: "Review" },
  { href: "/trajectory", label: "Agent" },
  { href: "/compare", label: "Compare" },
  { href: "/changelog", label: "Changelog" },
  { href: "/reproduce", label: "Reproduce" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body>
        <header className="masthead">
          <div className="shell mastrow">
            <Link href="/" className="brand">
              <Wordmark />
            </Link>
            <nav>
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="shell">{children}</div>
        <footer className="footer">
          <div className="shell footrow">
            <span>Shakedown</span>
            <span>Every number on this site comes from a run you can repeat.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
