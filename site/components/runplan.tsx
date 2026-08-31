"use client";

import { useState } from "react";
import { ClearIcon, ClockIcon, RunIcon } from "./icons";

/**
 * A sortable list, after the cult-ui SortableList pattern, ported to this project's
 * plain CSS and given something real to do: the order and the selection here are the
 * argument to `--only`, so the command underneath is one you can paste and run.
 */

interface Probe {
  id: string;
  name: string;
  blurb: string;
  seconds: number;
  runs: number;
  on: boolean;
}

const START: Probe[] = [
  { id: "wording", name: "wording", blurb: "reads the instruction", seconds: 0.0, runs: 0, on: true },
  { id: "execution", name: "execution", blurb: "reference and empty submission", seconds: 0.48, runs: 2, on: true },
  { id: "leak", name: "leak", blurb: "answers reachable by the solver", seconds: 0.02, runs: 0, on: true },
  { id: "determinism", name: "determinism", blurb: "same submission, twice", seconds: 0.24, runs: 2, on: true },
  { id: "mutation", name: "mutation", blurb: "edited references", seconds: 0.31, runs: 3, on: true },
  { id: "resilience", name: "resilience", blurb: "crashes and redirected outputs", seconds: 0.19, runs: 2, on: true },
];

export function RunPlan() {
  const [probes, setProbes] = useState<Probe[]>(START);
  const [held, setHeld] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const chosen = probes.filter((probe) => probe.on);
  const seconds = chosen.reduce((total, probe) => total + probe.seconds, 0);
  const runs = chosen.reduce((total, probe) => total + probe.runs, 0);
  const isDefault =
    chosen.length === START.length &&
    chosen.every((probe, index) => probe.id === START[index].id);

  const command = isDefault
    ? "python3 -m shakedown.cli run tasks/my_bundle"
    : chosen.length === 0
      ? "python3 -m shakedown.cli run tasks/my_bundle --only"
      : `python3 -m shakedown.cli run tasks/my_bundle --only ${chosen
          .map((probe) => probe.id)
          .join(",")}`;

  function move(id: string, delta: number) {
    setProbes((list) => {
      const from = list.findIndex((probe) => probe.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= list.length) {
        return list;
      }
      const next = [...list];
      const [lifted] = next.splice(from, 1);
      next.splice(to, 0, lifted);
      return next;
    });
  }

  function drop(onto: string) {
    if (!held || held === onto) {
      return;
    }
    setProbes((list) => {
      const from = list.findIndex((probe) => probe.id === held);
      const to = list.findIndex((probe) => probe.id === onto);
      if (from < 0 || to < 0) {
        return list;
      }
      const next = [...list];
      const [lifted] = next.splice(from, 1);
      next.splice(to, 0, lifted);
      return next;
    });
  }

  function toggle(id: string) {
    setProbes((list) =>
      list.map((probe) => (probe.id === id ? { ...probe, on: !probe.on } : probe)),
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="plan">
      <ul className="planlist">
        {probes.map((probe, index) => (
          <li
            key={probe.id}
            className={`planrow${probe.on ? "" : " off"}${held === probe.id ? " lifted" : ""}`}
            draggable
            onDragStart={() => setHeld(probe.id)}
            onDragEnd={() => setHeld(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => drop(probe.id)}
          >
            <span className="plangrip" aria-hidden="true">
              <svg viewBox="0 0 10 16">
                <circle cx="3" cy="3" r="1.3" />
                <circle cx="7" cy="3" r="1.3" />
                <circle cx="3" cy="8" r="1.3" />
                <circle cx="7" cy="8" r="1.3" />
                <circle cx="3" cy="13" r="1.3" />
                <circle cx="7" cy="13" r="1.3" />
              </svg>
            </span>

            <button
              className={probe.on ? "planbox on" : "planbox"}
              onClick={() => toggle(probe.id)}
              aria-pressed={probe.on}
              aria-label={`${probe.on ? "Exclude" : "Include"} the ${probe.name} probe`}
            >
              {probe.on ? <ClearIcon /> : null}
            </button>

            <span className="planorder">{probe.on ? index + 1 : "—"}</span>

            <span className="planbody">
              <span className="planname">{probe.name}</span>
              <span className="planblurb">{probe.blurb}</span>
            </span>

            <span className="plancost">
              {probe.runs ? `${probe.runs} runs` : "reads only"} · {probe.seconds.toFixed(2)}s
            </span>

            <span className="planmove">
              <button onClick={() => move(probe.id, -1)} aria-label="Move earlier" disabled={index === 0}>
                ↑
              </button>
              <button
                onClick={() => move(probe.id, 1)}
                aria-label="Move later"
                disabled={index === probes.length - 1}
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ul>

      <div className="planfoot">
        <span className="planstat">
          <ClockIcon /> {seconds.toFixed(2)}s
        </span>
        <span className="planstat">
          <RunIcon /> {runs} executions
        </span>
        <span className="planstat">
          {chosen.length} of {probes.length} probes
        </span>
      </div>

      <div className="plancmd">
        <code>{command}</code>
        <button onClick={copy} className="plancopy">
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <p className="planhint">
        Drag a row, or use the arrows. Reading probes cost nothing, so the shipped order puts them
        first and leaves the executing ones until the reference is known to pass.
      </p>
    </div>
  );
}
