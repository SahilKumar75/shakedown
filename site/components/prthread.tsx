"use client";

import { useMemo, useState } from "react";
import type { BundleReport, Finding } from "@/lib/types";
import { defectLabel } from "@/lib/data";
import { AgentIcon, ClearIcon, ClockIcon, FileIcon, HoldIcon, ProbeIcon, RunIcon } from "./icons";

const PROBES = ["wording", "execution", "leak", "determinism", "mutation", "resilience"];

function fileOf(location: string) {
  const cut = location.indexOf(":");
  return cut === -1 ? location : location.slice(0, cut);
}

function Comment({ finding }: { finding: Finding }) {
  const agent = finding.reporter === "agent";
  return (
    <li className="ev">
      <span className={agent ? "evdot mind" : "evdot flare"}>
        {agent ? <AgentIcon /> : <ProbeIcon />}
      </span>
      <div className="evcard">
        <div className="evtop">
          <strong>{finding.reporter}</strong>
          <span>
            commented on <code>{finding.location}</code>
          </span>
          <span className={finding.severity === "blocking" ? "chip block" : "chip"}>
            {finding.severity}
          </span>
        </div>
        <h4>{finding.title}</h4>
        <p>{finding.summary}</p>
        <div className="proof">
          <span className="prooflabel">
            <RunIcon /> the run that proves it
          </span>
          <code>{finding.evidence}</code>
        </div>
        <p className="fix">
          <strong>Suggested fix</strong> {finding.remedy}
        </p>
        <div className="evtags">
          <span className="chip">{finding.defect}</span>
          <span className="chip">{finding.confirmed ? "reproduced" : "suspected"}</span>
        </div>
      </div>
    </li>
  );
}

export function PrThread({ reports }: { reports: BundleReport[] }) {
  const [selected, setSelected] = useState(reports[0]?.bundle ?? "");
  const [tab, setTab] = useState<"conversation" | "checks" | "files">("conversation");
  const active = reports.find((entry) => entry.bundle === selected) ?? reports[0];

  const files = useMemo(() => {
    const map = new Map<string, Finding[]>();
    active.findings.forEach((finding) => {
      const name = fileOf(finding.location);
      map.set(name, [...(map.get(name) ?? []), finding]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [active]);

  const ran = active.trace.reduce((total, step) => total + step.executions.length, 0);
  const held = active.verdict === "hold";

  return (
    <div className="console">
      <aside className="queue">
        <div className="queuehead">{reports.length} open reviews</div>
        {reports.map((entry) => (
          <button
            key={entry.bundle}
            className={entry.bundle === active.bundle ? "qrow on" : "qrow"}
            onClick={() => {
              setSelected(entry.bundle);
              setTab("conversation");
            }}
          >
            {entry.verdict === "hold" ? <HoldIcon className="hold" /> : <ClearIcon className="ok" />}
            <span className="qname">{entry.bundle}</span>
            <span className="qcount">{entry.findings.length || ""}</span>
          </button>
        ))}
      </aside>

      <section className="review">
        <header className="prhead">
          <div className="prtitle">
            <h3>{active.summary || active.theme}</h3>
            <div className="prmeta">
              <span className={held ? "state hold" : "state clear"}>
                {held ? <HoldIcon /> : <ClearIcon />}
                {held ? "changes requested" : "approved"}
              </span>
              <span className="prsub">
                <code>{active.bundle}</code> inspected by six probes in{" "}
                {active.seconds.toFixed(1)}s
              </span>
            </div>
          </div>
        </header>

        <nav className="tabs">
          <button
            className={tab === "conversation" ? "tab on" : "tab"}
            onClick={() => setTab("conversation")}
          >
            Conversation <span className="tabnum">{active.findings.length}</span>
          </button>
          <button className={tab === "checks" ? "tab on" : "tab"} onClick={() => setTab("checks")}>
            Checks <span className="tabnum">{active.trace.length}</span>
          </button>
          <button className={tab === "files" ? "tab on" : "tab"} onClick={() => setTab("files")}>
            Files <span className="tabnum">{files.length}</span>
          </button>
        </nav>

        {tab === "conversation" ? (
          <ol className="timeline">
            <li className="ev">
              <span className="evdot sea">
                <FileIcon />
              </span>
              <div className="evline">
                <strong>shakedown</strong> opened this review on{" "}
                <code>{active.bundle}</code>
              </div>
            </li>
            <li className="ev">
              <span className="evdot sea">
                <RunIcon />
              </span>
              <div className="evline">
                six probes executed the bundle <strong>{ran} times</strong>, spending{" "}
                <strong>$0</strong> on model calls
              </div>
            </li>
            {active.findings.map((finding, index) => (
              <Comment key={`${finding.defect}_${index}`} finding={finding} />
            ))}
            <li className="ev">
              <span className={held ? "evdot flare" : "evdot sound"}>
                {held ? <HoldIcon /> : <ClearIcon />}
              </span>
              <div className="evline">
                {held ? (
                  <>
                    <strong>held.</strong> {active.findings.length} finding
                    {active.findings.length === 1 ? "" : "s"}, each reproduced by a run above
                  </>
                ) : (
                  <>
                    <strong>cleared.</strong> nothing reproduced, so the review budget is worth
                    spending here
                  </>
                )}
              </div>
            </li>
          </ol>
        ) : null}

        {tab === "checks" ? (
          <div className="checks">
            {PROBES.map((name) => {
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
                  <span className="checktime">
                    {step ? `${step.executions.length} runs · ${step.seconds.toFixed(2)}s` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {tab === "files" ? (
          files.length ? (
            <div className="changed">
              <div className="changedhead">
                <FileIcon /> files carrying review comments
              </div>
              {files.map(([name, list]) => (
                <div className="changedrow" key={name}>
                  <code>{name}</code>
                  <span className="lines">
                    {list.map((finding) => defectLabel(finding.defect)).join(", ")}
                  </span>
                  <span className="count">{list.length}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No file drew a comment on this bundle.</p>
          )
        ) : null}
      </section>
    </div>
  );
}
