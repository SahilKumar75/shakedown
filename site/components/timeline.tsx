"use client";

import { useMemo, useState } from "react";
import { ClearIcon, FileIcon, HoldIcon } from "./icons";

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
  files?: string[];
}

function stageId(stage: string): string {
  let hash = 0;
  for (let index = 0; index < stage.length; index += 1) {
    hash = (hash * 31 + stage.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(7, "0").slice(0, 7);
}

/** Each metric becomes one row of the split: what it was on the left, what it became
 *  on the right. A figure with no "before to after" shape is unchanged, so it sits on
 *  both sides as context. */
function rows(metrics: Metric[] = []) {
  return metrics.map((metric) => {
    const parts = metric.value.split(" to ");
    if (parts.length === 2) {
      return {
        label: metric.label,
        before: `${metric.label} ${parts[0]}`,
        after: `${metric.label} ${parts[1]}`,
        changed: true,
      };
    }
    return {
      label: metric.label,
      before: `${metric.label} ${metric.value}`,
      after: `${metric.label} ${metric.value}`,
      changed: false,
    };
  });
}

function folderOf(path: string) {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? "." : path.slice(0, cut);
}

function nameOf(path: string) {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? path : path.slice(cut + 1);
}

export function Timeline({ beats }: { beats: Beat[] }) {
  const [selected, setSelected] = useState(beats[0]?.stage ?? "");
  const active = beats.find((beat) => beat.stage === selected) ?? beats[0];
  const kept = beats.filter((beat) => beat.kept).length;

  /** The tree is grouped by directory, and a file carries how many stages touched it,
   *  which is what makes the mutation probe visibly the most reworked thing here. */
  const tree = useMemo(() => {
    const counts = new Map<string, number>();
    beats.forEach((beat) => {
      (beat.files ?? []).forEach((file) => {
        counts.set(file, (counts.get(file) ?? 0) + 1);
      });
    });
    const folders = new Map<string, { path: string; touches: number }[]>();
    Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([path, touches]) => {
        const folder = folderOf(path);
        folders.set(folder, [...(folders.get(folder) ?? []), { path, touches }]);
      });
    return Array.from(folders.entries());
  }, [beats]);

  const split = rows(active.metrics);
  const touched = new Set(active.files ?? []);

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
        </span>
      </div>

      <div className="filesview">
        <aside className="ftree">
          <div className="ftreehead">changed files</div>
          {tree.map(([folder, entries]) => (
            <div className="fgroup" key={folder}>
              <div className="ffolder">
                <svg viewBox="0 0 16 16" className="icon" aria-hidden="true">
                  <path d="M1.5 3.5h4l1.5 2h7.5v8h-13z" />
                </svg>
                {folder}
              </div>
              {entries.map((entry) => (
                <div
                  key={entry.path}
                  className={touched.has(entry.path) ? "ffile on" : "ffile"}
                  title={`${entry.touches} stage${entry.touches === 1 ? "" : "s"} touched this`}
                >
                  <FileIcon />
                  <span className="fname">{nameOf(entry.path)}</span>
                  <span className="ftouch">{entry.touches}</span>
                </div>
              ))}
            </div>
          ))}
          <p className="ftreefoot">
            Highlighted files are the ones the selected stage changed.
          </p>
        </aside>

        <section className="fdiff">
          <div className="stagepicker">
            {beats.map((beat) => (
              <button
                key={beat.stage}
                className={beat.stage === active.stage ? "spick on" : "spick"}
                onClick={() => setSelected(beat.stage)}
              >
                <span className={beat.kept ? "cmpmark kept" : "cmpmark gone"}>
                  {beat.kept ? <ClearIcon /> : <HoldIcon />}
                </span>
                <span className="spickname">{beat.stage}</span>
                <code className="cmpsha">{stageId(beat.stage)}</code>
              </button>
            ))}
          </div>

          <div className="fdiffhead">
            <div>
              <h4>{active.tried}</h4>
              <span className="cmpmeta">
                <span className={active.kept ? "cmpbadge" : "cmpbadge gone"}>
                  {active.kept ? "kept" : "reverted"}
                </span>
                <span className="cmpstage">
                  {(active.files ?? []).length} file
                  {(active.files ?? []).length === 1 ? "" : "s"} changed
                </span>
              </span>
            </div>
          </div>

          <div className="splitdiff">
            <div className="splithead">
              <span>before</span>
              <span>after</span>
            </div>
            {split.map((row) => (
              <div className="splitrow" key={row.label}>
                <div className={row.changed ? "spane del" : "spane"}>
                  <span className="ssign">{row.changed ? "−" : " "}</span>
                  <span>{row.before}</span>
                </div>
                <div className={row.changed ? "spane add" : "spane"}>
                  <span className="ssign">{row.changed ? "+" : " "}</span>
                  <span>{row.after}</span>
                </div>
              </div>
            ))}
            <div className="splitnote2">{active.evidence}</div>
          </div>

          <div className="cmpnotes">
            <p>{active.why}</p>
            <p className="fix">
              <strong>Decision</strong> {active.decision}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
