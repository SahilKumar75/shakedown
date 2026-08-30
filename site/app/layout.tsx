import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Shakedown",
  description: "Rehearse an expensive benchmark review pipeline locally, before you submit.",
};

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/method", label: "Method" },
  { href: "/report", label: "Report" },
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
            <Link href="/" className="wordmark">
              <span className="mark" aria-hidden="true" />
              Shakedown
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
