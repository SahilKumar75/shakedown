"use client";

import { useEffect, useRef, useState } from "react";

/** A dotted field with a soft radial mask, fading as the page scrolls away from it. */
export function GridField() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOffset(Math.min(window.scrollY, 600)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="gridfield"
      aria-hidden="true"
      style={{
        transform: `translate3d(0, ${offset * 0.14}px, 0)`,
        opacity: Math.max(0, 1 - offset / 520),
      }}
    />
  );
}

/** A pill that reads as a product badge rather than a heading. */
export function Pill({
  children,
  tone = "accent",
}: {
  children: React.ReactNode;
  tone?: "accent" | "done" | "success";
}) {
  return (
    <span className={`pill ${tone}`}>
      <span className="pilldot" />
      {children}
    </span>
  );
}

/** An infinite strip. Duplicated once so the loop has no seam. */
export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marqueetrack">
        {doubled.map((item, index) => (
          <span className="marqueeitem" key={`${item}_${index}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

const LINES: { text: string; tone: string; delay: number }[] = [
  { text: "$ shakedown run tasks/address_normalise_10", tone: "cmd", delay: 0 },
  { text: "wording        nothing to report          0.00s", tone: "ok", delay: 700 },
  { text: "execution      reference earns 1.0        0.48s", tone: "ok", delay: 1000 },
  { text: "leak           scanning shipped files     0.31s", tone: "run", delay: 1300 },
  { text: "BLOCK  answer_leak  env/reviewer_notes/case_00_expected.txt", tone: "bad", delay: 1750 },
  { text: "  proof: a candidate that copies that file earned reward 1.0", tone: "dim", delay: 2100 },
  { text: "1 of 1 bundles would be held.", tone: "sum", delay: 2500 },
  { text: "exit 1", tone: "dim", delay: 2750 },
];

/** A terminal that replays a real run. The text is what the CLI actually prints. */
export function TerminalDemo() {
  const host = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return;
    }
    const watcher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true);
            watcher.disconnect();
          }
        });
      },
      { threshold: 0.35 },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  return (
    <div className="term" ref={host}>
      <div className="termbar">
        <span className="tdot r" />
        <span className="tdot y" />
        <span className="tdot g" />
        <span className="termtitle">shakedown</span>
      </div>
      <pre className="termbody">
        {LINES.map((line) => (
          <span
            key={line.text}
            className={`tline ${line.tone}${started ? " go" : ""}`}
            style={{ animationDelay: `${line.delay}ms` }}
          >
            {line.text}
          </span>
        ))}
        <span className={`tcaret${started ? " go" : ""}`} />
      </pre>
    </div>
  );
}
