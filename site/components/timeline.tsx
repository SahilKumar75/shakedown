"use client";

import { useState } from "react";
import { ClearIcon, HoldIcon } from "./icons";

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

/** A short, stable id per stage. Deliberately not called a commit: these are recorded
 *  stages of the project, not git objects, and labelling them otherwise would imply
 *  a history that does not exist. */
function stageId(stage: string): string {
  let hash = 0;
  for (let index = 0; index < stage.length; index += 1) {
    hash = (hash * 31 + stage.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(7, "0").slice(0, 7);
}

/** Metric values are written either as a plain figure or as "before to after". The
 *  second shape becomes a removed line and an added line, the first stays context. */
function diffLines(metrics: Metric[] = []) {
  const lines: { sign: "+" | "-" | " "; text: string }[] = [];
  metrics.forEach((metric) => {
    const parts = metric.value.split(" to ");
    if (parts.length === 2) {
      lines.push({ sign: "-", text: `${metric.label} ${parts[0]}` });
      lines.push({ sign: "+", text: `${metric.label} ${parts[1]}` });
    } else {
      lines.push({ sign: " ", text: `${metric.label} ${metric.value}` });
    }
  });
  return lines;
}

export function Timeline({ beats }: { beats: Beat[] }) {
  const [open, setOpen] = useState<string | null>(beats[0]?.stage ?? null);
  const kept = beats.filter((beat) => beat.kept).length;

  return (
    <div className="cmp">
      <div className="cmphead">
        <span className="cmpref">baseline</span>
        <span className="cmpdots">…</span>
        <span className="cmpref head">now</span>
        <span className="cmpsummary">
          {beats.length} stages, {kept} kept, {beats.length - kept} reverted
        </span>
        <span className="cmpstat">
          <span className="plus">+7 caught</span>
          <span className="minus">−3 false alarms</span>
          <span className="bars">
            <i className="on" />
            <i className="on" />
            <i className="on" />
            <i className="on" />
            <i className="off" />
          </span>
        </span>
      </div>

      <ul className="cmplist">
        {beats.map((beat) => {
          const showing = open === beat.stage;
          const lines = diffLines(beat.metrics);
          return (
            <li className={showing ? "cmprow open" : "cmprow"} key={beat.stage}>
              <button className="cmpbar" onClick={() => setOpen(showing ? null : beat.stage)}>
                <span className={beat.kept ? "cmpmark kept" : "cmpmark gone"}>
                  {beat.kept ? <ClearIcon /> : <HoldIcon />}
                </span>
                <span className="cmpmsg">
                  <span className="cmptitle">{beat.tried}</span>
                  <span className="cmpmeta">
                    <span className="cmpstage">{beat.stage}</span>
                    <span className={beat.kept ? "cmpbadge" : "cmpbadge gone"}>
                      {beat.kept ? "kept" : "reverted"}
                    </span>
                  </span>
                </span>
                <code className="cmpsha">{stageId(beat.stage)}</code>
              </button>

              {showing ? (
                <div className="cmpbody">
                  <div className="cmpdiff">
                    <div className="cmpfile">
                      <span>results</span>
                      <span className="cmpcount">
                        {lines.filter((line) => line.sign === "+").length} additions,{" "}
                        {lines.filter((line) => line.sign === "-").length} deletions
                      </span>
                    </div>
                    {lines.map((line, index) => (
                      <div
                        className={
                          line.sign === "+" ? "dline add" : line.sign === "-" ? "dline del" : "dline"
                        }
                        key={`${line.text}_${index}`}
                      >
                        <span className="dsign">{line.sign}</span>
                        <span className="dtext">{line.text}</span>
                      </div>
                    ))}
                    <div className="dline note">
                      <span className="dsign"> </span>
                      <span className="dtext">{beat.evidence}</span>
                    </div>
                  </div>

                  <div className="cmpnotes">
                    <p>{beat.why}</p>
                    <p className="fix">
                      <strong>Decision</strong> {beat.decision}
                    </p>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
