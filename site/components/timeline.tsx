"use client";

import { useEffect, useRef, useState } from "react";
import { ClearIcon, HoldIcon, RunIcon } from "./icons";

export interface Beat {
  stage: string;
  tried: string;
  why: string;
  evidence: string;
  decision: string;
  kept: boolean;
}

/**
 * A vertical timeline whose spine fills as the reader scrolls it, and whose beats
 * light up as the fill passes them.
 */
export function Timeline({ beats }: { beats: Beat[] }) {
  const host = useRef<HTMLOListElement>(null);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const node = host.current;
    if (!node) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFill(100);
      return;
    }
    let raf = 0;
    const measure = () => {
      const box = node.getBoundingClientRect();
      const start = window.innerHeight * 0.82;
      const travelled = start - box.top;
      setFill(Math.max(0, Math.min(100, (travelled / box.height) * 100)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <ol className="tl" ref={host}>
      <span className="tlspine" />
      <span className="tlfill" style={{ transform: `scaleY(${fill / 100})` }} />
      {beats.map((beat, index) => {
        const at = ((index + 0.5) / beats.length) * 100;
        const lit = fill >= at;
        return (
          <li className={lit ? "tlbeat lit" : "tlbeat"} key={beat.stage}>
            <span className={beat.kept ? "tldot kept" : "tldot gone"}>
              {beat.kept ? <ClearIcon /> : <HoldIcon />}
            </span>
            <div className="tlcard">
              <div className="tltop">
                <span className="tlstage">{beat.stage}</span>
                <span className={beat.kept ? "chip" : "chip block"}>
                  {beat.kept ? "kept" : "reverted"}
                </span>
              </div>
              <h4>{beat.tried}</h4>
              <p>{beat.why}</p>
              <div className="proof">
                <span className="prooflabel">
                  <RunIcon /> what the run showed
                </span>
                <code>{beat.evidence}</code>
              </div>
              <p className="fix">
                <strong>Decision</strong> {beat.decision}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
