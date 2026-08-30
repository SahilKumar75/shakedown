"use client";

import { useState } from "react";
import type { BundleReport, Finding } from "@/lib/types";
import { defectLabel } from "@/lib/data";
import { Verdict } from "./verdict";

function FindingBlock({ finding }: { finding: Finding }) {
  return (
    <div className="finding">
      <h4>{finding.title}</h4>
      <div className="tags">
        <span className={finding.severity === "blocking" ? "tag strong" : "tag"}>
          {finding.severity}
        </span>
        <span className="tag">{finding.defect}</span>
        <span className="tag">{finding.confirmed ? "reproduced" : "suspected"}</span>
        <span className="tag">found by {finding.reporter}</span>
      </div>
      <dl className="detail">
        <dt>Where</dt>
        <dd>{finding.location}</dd>
        <dt>What</dt>
        <dd>{finding.summary}</dd>
        <dt>Evidence</dt>
        <dd className="mono">{finding.evidence}</dd>
        <dt>Fix</dt>
        <dd>{finding.remedy}</dd>
      </dl>
    </div>
  );
}

export function ReportView({ reports }: { reports: BundleReport[] }) {
  const [selected, setSelected] = useState(reports[0]?.bundle ?? "");
  const active = reports.find((entry) => entry.bundle === selected) ?? reports[0];

  return (
    <div className="layout">
      <aside className="picker">
        {reports.map((entry) => (
          <button
            key={entry.bundle}
            className={entry.bundle === active.bundle ? "row on" : "row"}
            onClick={() => setSelected(entry.bundle)}
          >
            <div className="name">{entry.bundle}</div>
            <div className="meta">
              <span>{defectLabel(entry.injected)}</span>
              <Verdict verdict={entry.verdict} />
            </div>
          </button>
        ))}
      </aside>

      <section className="panel">
        <div className="panelhead">
          <div>
            <h3>{active.bundle}</h3>
            <div className="sub">{active.summary || active.theme}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Verdict verdict={active.verdict} />
            <div className="sub" style={{ marginTop: 6 }}>
              {active.seconds.toFixed(1)} seconds
            </div>
          </div>
        </div>

        {active.findings.length === 0 ? (
          <p className="empty">
            No defects found. On this bundle Shakedown would let you spend the review budget.
          </p>
        ) : (
          active.findings.map((finding, index) => (
            <FindingBlock key={`${finding.defect}_${index}`} finding={finding} />
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
