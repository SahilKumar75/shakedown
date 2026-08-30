import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shakedown",
  description: "Rehearse an expensive benchmark review pipeline locally, before you submit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="masthead">
            <Link href="/" className="wordmark" style={{ color: "inherit" }}>
              Shakedown
            </Link>
            <nav>
              <Link href="/">Overview</Link>
              <Link href="/report">Report</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
