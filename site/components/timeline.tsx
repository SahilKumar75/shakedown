"use client";

import { useEffect, useRef, useState } from "react";
import { ClearIcon, HoldIcon, RunIcon } from "./icons";

export interface Metric {
  label: string;
  value: string;
  good?: boolean;
  bad?: boolean;
}

export interface Beat {
  stage: string;
  tried: string;
  why: string;
  evidence: string;
  decision: string;
  kept: boolean;
  metrics?: Metric[];
}

function Chip({ metric }: { metric: Metric }) {
  const tone = metric.good ? "mchip up" : metric.bad ? "mchip down" : "mchip";
  return (
    <span className={tone}>
      <span className="mlabel">{metric.label}</span>
      <span className="mvalue">{metric.value}</span>
    </span>
  );
}

/** The arc of the project in one strip: where recall started and where it landed. */
function Arc() {
  const points = [
    { at: "baseline", caught: 6, alarms: 0 },
    { at: "iteration one", caught: 13, alarms: 3 },
    { at: "iteration two", caught: 13, alarms: 0 },
    { at: "iteration three", caught: 13, alarms: 0 },
    { at: "now", caught: 13, alarms: 0 },
  ];
  const max = 21;
  return (
    <div className="arc">
      <div className="arcplot">
        {points.map((point, index) => (
          <div className="arcstep" key={point.at}>
            <div className="arcbars">
              <span
                className="arcbar caught"
                style={{
                  height: `${(point.caught / max) * 100}%`,
                  animationDelay: `${index * 90}ms`,
                }}
                title={`${point.caught} of 21 caught`}
              />
              <span
                className={point.alarms ? "arcbar alarm" : "arcbar alarm none"}
                style={{
                  height: `${Math.max(point.alarms / 3, 0.04) * 100}%`,
                  animationDelay: `${index * 90 + 45}ms`,
                }}
                title={`${point.alarms} clean bundles wrongly held`}
              />
            </div>
            <span className="arclabel">{point.at}</span>
          </div>
        ))}
      </div>
      <div className="arckey">
        <span>
          <span className="keyswatch caught" /> planted defects caught, out of 21
        </span>
        <span>
          <span className="keyswatch alarm" /> clean bundles wrongly held, out of 3
        </span>
      </div>
    </div>
  );
}

export function Timeline({ beats }: { beats: Beat[] }) {
  const host = useRef<HTMLOListElement>(null);
  const [fill, setFill] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

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
    <>
      <Arc />
      <ol className="tl" ref={host}>
        <span className="tlspine" />
        <span className="tlfill" style={{ transform: `scaleY(${fill / 100})` }} />
        {beats.map((beat, index) => {
          const at = ((index + 0.5) / beats.length) * 100;
          const lit = fill >= at;
          const showing = open === beat.stage;
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

                {beat.metrics && beat.metrics.length ? (
                  <div className="mchips">
                    {beat.metrics.map((metric) => (
                      <Chip key={metric.label} metric={metric} />
                    ))}
                  </div>
                ) : null}

                <div className="proof">
                  <span className="prooflabel">
                    <RunIcon /> what the run showed
                  </span>
                  <code>{beat.evidence}</code>
                </div>

                <button className="tlmore" onClick={() => setOpen(showing ? null : beat.stage)}>
                  {showing ? "hide the reasoning" : "why, and what we decided"}
                  <svg viewBox="0 0 10 6" className={showing ? "navcaret up" : "navcaret"} aria-hidden="true">
                    <path d="M1 1l4 4 4-4" />
                  </svg>
                </button>

                {showing ? (
                  <div className="tlreason">
                    <p>{beat.why}</p>
                    <p className="fix">
                      <strong>Decision</strong> {beat.decision}
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
