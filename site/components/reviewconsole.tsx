"use client";

import { useMemo, useState } from "react";
import type { BundleReport, Finding } from "@/lib/types";
import { defectLabel } from "@/lib/data";
import { AgentIcon, ClearIcon, ClockIcon, FileIcon, HoldIcon, ProbeIcon, RunIcon } from "./icons";

const PROBE_ORDER = ["wording", "execution", "leak", "determinism", "mutation", "resilience"];

function fileOf(location: string): string {
  const cut = location.indexOf(":");
  return cut === -1 ? location : location.slice(0, cut);
}

function lineOf(location: string): string {
  const cut = location.indexOf(":");
  return cut === -1 ? "" : location.slice(cut + 1);
}

function Comment({ finding }: { finding: Finding }) {
  const blocking = finding.severity === "blocking";
  return (
    <article className={blocking ? "comment blocking" : "comment"}>
      <header>
        <span className="who">
          {finding.reporter === "agent" ? <AgentIcon /> : <ProbeIcon />}
          {finding.reporter}
        </span>
        <span className="what">
          requested changes on <code>{finding.location}</code>
        </span>
        <span className={blocking ? "chip block" : "chip"}>{finding.severity}</span>
      </header>
      <h4>{finding.title}</h4>
      <p>{finding.summary}</p>
      <div className="proof">
        <span className="prooflabel">
          <RunIcon /> what proves it
        </span>
        <code>{finding.evidence}</code>
      </div>
      <p className="fix">
        <strong>Fix</strong> {finding.remedy}
      </p>
      <footer>
        <span className="chip">{finding.defect}</span>
        <span className="chip">{finding.confirmed ? "reproduced" : "suspected"}</span>
      </footer>
    </article>
  );
}

export function ReviewConsole({ reports }: { reports: BundleReport[] }) {
  const [selected, setSelected] = useState(reports[0]?.bundle ?? "");
  const [openFile, setOpenFile] = useState<string | null>(null);
  const active = reports.find((entry) => entry.bundle === selected) ?? reports[0];

  const files = useMemo(() => {
    const map = new Map<string, Finding[]>();
    active.findings.forEach((finding) => {
      const name = fileOf(finding.location);
      map.set(name, [...(map.get(name) ?? []), finding]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [active]);

  const shownFile = openFile && files.some(([name]) => name === openFile) ? openFile : null;
  const shown = shownFile ? files.filter(([name]) => name === shownFile) : files;

  const ran = active.trace.reduce((total, step) => total + step.executions.length, 0);

  return (
    <div className="console">
      <aside className="queue">
        <div className="queuehead">
          {reports.length} bundles in review
        </div>
        {reports.map((entry) => (
          <button
            key={entry.bundle}
            className={entry.bundle === active.bundle ? "qrow on" : "qrow"}
            onClick={() => {
              setSelected(entry.bundle);
              setOpenFile(null);
            }}
          >
            {entry.verdict === "hold" ? <HoldIcon className="hold" /> : <ClearIcon className="ok" />}
            <span className="qname">{entry.bundle}</span>
            <span className="qcount">{entry.findings.length || ""}</span>
          </button>
        ))}
      </aside>

      <section className="review">
        <header className="reviewhead">
          <div>
            <h3>{active.bundle}</h3>
            <p className="sub">{active.summary || active.theme}</p>
          </div>
          <div className={active.verdict === "hold" ? "decision hold" : "decision clear"}>
            {active.verdict === "hold" ? <HoldIcon /> : <ClearIcon />}
            {active.verdict === "hold" ? "changes requested" : "approved"}
          </div>
        </header>

        <div className="facts">
          <span>
            <ClockIcon /> {active.seconds.toFixed(1)} seconds
          </span>
          <span>
            <RunIcon /> {ran} executions
          </span>
          <span>
            <ProbeIcon /> {active.trace.length} probes
          </span>
          <span>
            <FileIcon /> {files.length} files with comments
          </span>
        </div>

        <div className="checks">
          {PROBE_ORDER.map((name) => {
            const step = active.trace.find((entry) => entry.probe === name);
            const flagged = step ? step.found.length > 0 : false;
            return (
              <div key={name} className={flagged ? "check bad" : "check good"}>
                <span className="checkmark">{flagged ? <HoldIcon /> : <ClearIcon />}</span>
                <span className="checkname">{name}</span>
                <span className="checknote">
                  {step
                    ? flagged
                      ? step.found.map((d) => defectLabel(d)).join(", ")
                      : "nothing to report"
                    : "not run"}
                </span>
                <span className="checktime">{step ? `${step.seconds.toFixed(2)}s` : ""}</span>
              </div>
            );
          })}
        </div>

        {files.length > 0 ? (
          <div className="changed">
            <div className="changedhead">
              <FileIcon /> files with review comments
            </div>
            {files.map(([name, list]) => (
              <button
                key={name}
                className={shownFile === name ? "changedrow on" : "changedrow"}
                onClick={() => setOpenFile(shownFile === name ? null : name)}
              >
                <code>{name}</code>
                <span className="lines">
                  {list
                    .map((finding) => lineOf(finding.location))
                    .filter(Boolean)
                    .map((line) => `line ${line}`)
                    .join(", ")}
                </span>
                <span className="count">{list.length}</span>
              </button>
            ))}
          </div>
        ) : null}

        {active.findings.length === 0 ? (
          <p className="empty">
            No probe reproduced a defect here. On this bundle Shakedown would let you spend the
            review budget.
          </p>
        ) : (
          shown.map(([name, list]) => (
            <div className="thread" key={name}>
              <div className="threadhead">
                <FileIcon /> <code>{name}</code>
              </div>
              {list.map((finding, index) => (
                <Comment key={`${finding.defect}_${index}`} finding={finding} />
              ))}
            </div>
          ))
        )}

        {active.notes.length > 0 ? (
          <div className="notes">
            {active.notes.map((note, index) => (
              <div key={index}>{note}</div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
