"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The kokonutui AI loading state, ported to this project's plain CSS and driven by
 * what a Shakedown run actually does rather than by placeholder copy. The rings are
 * masked by a progress arc so the sweep reads as work completed, and the log scrolls
 * a line at a time.
 *
 * It only animates while on screen. An off screen interval keeps waking the main
 * thread to re-render something nobody can see.
 */

const SEQUENCES = [
  {
    status: "Reading the bundle",
    lines: [
      "opening instruction.md",
      "listing env/ for shipped material",
      "parsing task.toml",
      "scanning the instruction for harness wording",
      "nothing to report",
    ],
  },
  {
    status: "Executing the reference",
    lines: [
      "running solution/solve.py through tests/verify.py",
      "reward=1.0 in 0.48s",
      "running an empty submission",
      "reward=0.0 in 0.31s",
      "both checks behave, continuing",
    ],
  },
  {
    status: "Writing candidates",
    lines: [
      "mutating the reference at 3 sites",
      "candidate 1 reward=0.0",
      "candidate 2 reward=1.0 on a changed answer",
      "BLOCK mutation survives on 3 held out cases",
      "attaching the run that proves it",
    ],
  },
  {
    status: "Reporting",
    lines: [
      "2 findings reproduced, 0 asserted without a run",
      "writing shakedown.json",
      "1 of 1 bundles would be held",
      "exit 1",
    ],
  },
];

const LINE_HEIGHT = 28;
const VISIBLE = 3;

function Rings({ progress }: { progress: number }) {
  const circumference = 754;
  return (
    <svg
      className="ringart"
      viewBox="0 0 240 240"
      role="img"
      aria-label={`Run progress ${Math.round(progress)} percent`}
    >
      <defs>
        <mask id="ringmask">
          <rect width="240" height="240" fill="black" />
          <circle
            cx="120"
            cy="120"
            r="120"
            fill="white"
            strokeDasharray={`${(progress / 100) * circumference}, ${circumference}`}
            transform="rotate(-90 120 120)"
          />
        </mask>
      </defs>
      <g className="rings" mask="url(#ringmask)" strokeDasharray="18% 40%" strokeWidth="16">
        <circle cx="120" cy="120" r="150" stroke="var(--danger)" />
        <circle cx="120" cy="120" r="130" stroke="var(--accent)" />
        <circle cx="120" cy="120" r="110" stroke="var(--success)" />
        <circle cx="120" cy="120" r="90" stroke="var(--attention)" />
        <circle cx="120" cy="120" r="70" stroke="var(--done)" />
        <circle cx="120" cy="120" r="50" stroke="var(--danger)" />
      </g>
    </svg>
  );
}

export function AgentLoading() {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [onScreen, setOnScreen] = useState(false);

  const sequence = SEQUENCES[stage];

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const watcher = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "80px" },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  useEffect(() => {
    if (!onScreen) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = setInterval(() => {
      setCursor((at) => {
        if (at + VISIBLE >= sequence.lines.length) {
          setStage((current) => (current + 1) % SEQUENCES.length);
          return 0;
        }
        return at + 1;
      });
    }, 1600);
    return () => clearInterval(timer);
  }, [onScreen, sequence.lines.length]);

  useEffect(() => {
    if (scroller.current) {
      scroller.current.scrollTop = cursor * LINE_HEIGHT;
    }
  }, [cursor]);

  return (
    <div className="agentload" ref={root}>
      <div className="agenthead">
        <Rings progress={((stage + 1) / SEQUENCES.length) * 100} />
        <span className="agentstatus">{sequence.status}</span>
        <span className="agentstep">
          stage {stage + 1} of {SEQUENCES.length}
        </span>
      </div>

      <div className="agentlogwrap">
        <div className="agentlog" ref={scroller}>
          {sequence.lines.map((line, index) => (
            <div className="agentline" key={`${stage}_${line}`}>
              <span className="agentnum">{index + 1}</span>
              <span className={line.startsWith("BLOCK") ? "agenttext bad" : "agenttext"}>
                {line}
              </span>
            </div>
          ))}
        </div>
        <span className="agentfade" />
      </div>
    </div>
  );
}
