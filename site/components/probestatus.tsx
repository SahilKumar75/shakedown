"use client";

import { useState } from "react";
import type { BundleReport } from "@/lib/types";
import { defectLabel } from "@/lib/data";

const PROBES = [
  { name: "wording", blurb: "reads the instruction for harness leaks" },
  { name: "execution", blurb: "reference passes, empty submission fails" },
  { name: "leak", blurb: "answers reachable from shipped material" },
  { name: "determinism", blurb: "same submission, same reward, twice" },
  { name: "mutation", blurb: "an edited reference still earns full reward" },
  { name: "resilience", blurb: "crashes record zero, outputs stay in place" },
];

interface Cell {
  bundle: string;
  flagged: boolean;
  ran: boolean;
  defects: string[];
}

function rowFor(name: string, reports: BundleReport[]): Cell[] {
  return reports.map((report) => {
    const step = report.trace.find((entry) => entry.probe === name);
    return {
      bundle: report.bundle,
      ran: Boolean(step),
      flagged: step ? step.found.length > 0 : false,
      defects: step ? step.found.map((defect) => defectLabel(defect)) : [],
    };
  });
}

export function ProbeStatus({ reports }: { reports: BundleReport[] }) {
  const [openLog, setOpenLog] = useState(false);
  const rows = PROBES.map((probe) => {
    const cells = rowFor(probe.name, reports);
    const hits = cells.filter((cell) => cell.flagged);
    const seconds = reports.reduce((total, report) => {
      const step = report.trace.find((entry) => entry.probe === probe.name);
      return total + (step ? step.seconds : 0);
    }, 0);
    return { ...probe, cells, hits, seconds };
  });

  const found = rows.reduce((total, row) => total + row.hits.length, 0);
  const incidents = rows
    .flatMap((row) =>
      row.hits.map((hit) => ({ probe: row.name, bundle: hit.bundle, defects: hit.defects })),
    )
    .slice(0, 8);

  return (
    <div className="status">
      <div className="statushead">
        <div>
          <h3>Gauntlet status</h3>
          <p>
            {reports.length} bundles, {rows.length} probes, {found} findings reproduced
          </p>
        </div>
        <button className="statustoggle" onClick={() => setOpenLog(!openLog)}>
          Finding history
          <svg viewBox="0 0 10 6" className={openLog ? "navcaret up" : "navcaret"} aria-hidden="true">
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>
      </div>

      {rows.map((row) => (
        <div className="statusrow" key={row.name}>
          <div className="statusmeta">
            <span className={row.hits.length ? "statusdot alert" : "statusdot calm"} />
            <span className="statusname">{row.name}</span>
            <span className="statusstate">
              {row.hits.length
                ? `reproduced on ${row.hits.length} of ${reports.length}`
                : "silent across the corpus"}
            </span>
            <span className="statustime">{row.seconds.toFixed(1)}s total</span>
          </div>
          <div className="strip">
            {row.cells.map((cell) => (
              <span
                key={cell.bundle}
                className={cell.flagged ? "tick hit" : cell.ran ? "tick" : "tick idle"}
                title={
                  cell.flagged
                    ? `${cell.bundle}: ${cell.defects.join(", ")}`
                    : `${cell.bundle}: nothing to report`
                }
              />
            ))}
          </div>
          <p className="statusblurb">{row.blurb}</p>
        </div>
      ))}

      {openLog ? (
        <div className="statuslog">
          {incidents.map((item, index) => (
            <div className="logrow" key={`${item.probe}_${item.bundle}_${index}`}>
              <span className="logprobe">{item.probe}</span>
              <code>{item.bundle}</code>
              <span className="logdefect">{item.defects.join(", ")}</span>
            </div>
          ))}
          <p className="logfoot">
            Showing {incidents.length} of {found}. Every one is a run, openable in the review
            console.
          </p>
        </div>
      ) : null}
    </div>
  );
}
