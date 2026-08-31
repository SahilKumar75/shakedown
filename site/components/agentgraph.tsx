"use client";

import { useEffect, useRef, useState } from "react";
import { trajectories } from "@/lib/trajectories";
import type { Run, Step } from "@/lib/trajectories";

const W = 158;
const H = 70;
const GX = 44;
const GY = 58;
const COLS = 5;

const GLYPHS: Record<string, string> = {
  read_file: "M4.5 2.5h5l3 3v8h-8zM9.5 2.5v3h3",
  list_files: "M4 4.5h9M4 9h9M4 13.5h5",
  run_reference: "M3.5 4 7 7 3.5 10M8 12h5",
  run_empty: "M4 4h9v9H4zM4 4l9 9",
  run_candidate: "M6.5 2.5v4L3.5 13h9l-3-6.5v-4M5.5 2.5h5",
  report: "M4 8.6 7 11.6l5-6",
  thinking: "M5 5.5h8v7H5zM8 2.5v3",
};

function place(index: number) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const leftToRight = row % 2 === 0;
  const slot = leftToRight ? col : COLS - 1 - col;
  return { x: slot * (W + GX), y: row * (H + GY), row, leftToRight };
}

const TURN = 52;

/** Every connection leaves a node from its side and arrives at the next node's side,
 *  so the flow reads as one continuous line. Within a row that is a gentle bezier;
 *  at the end of a row it is a U turn that bulges past the node and comes back into
 *  the row below, which is what keeps the whole path rounded rather than stepped. */
function edgePath(index: number) {
  const from = place(index);
  const to = place(index + 1);
  const y1 = from.y + H / 2;

  if (from.row === to.row) {
    const x1 = from.leftToRight ? from.x + W : from.x;
    const x2 = from.leftToRight ? to.x : to.x + W;
    const bend = (x2 - x1) * 0.42;
    return `M${x1} ${y1} C${x1 + bend} ${y1}, ${x2 - bend} ${y1}, ${x2} ${y1}`;
  }

  // the row wraps: leave from the outer edge, arc past it, and come back in below
  const y2 = to.y + H / 2;
  const x = from.leftToRight ? from.x + W : from.x;
  const reach = from.leftToRight ? TURN : -TURN;
  return `M${x} ${y1} C${x + reach} ${y1}, ${x + reach} ${y2}, ${x} ${y2}`;
}

function label(step: Step) {
  const args = step.arguments as Record<string, unknown>;
  if (typeof args.path === "string") {
    return args.path;
  }
  if (typeof args.why === "string") {
    return args.why;
  }
  if (step.tool === "report") {
    return "only what a run proved";
  }
  return "";
}

/** The card is 158 wide and the reward sits in the bottom right, so a label has to
 *  give way to it rather than run underneath it. */
function trim(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function reward(step: Step) {
  const match = step.result.match(/reward=([0-9.]+)/);
  return match ? match[1] : null;
}

function tone(step: Step) {
  const value = reward(step);
  if (step.tool === "report") {
    return "out";
  }
  if (value === "1.0" && step.tool === "run_candidate") {
    return "hit";
  }
  if (step.tool && step.tool.startsWith("run")) {
    return "exec";
  }
  return "read";
}

export function AgentGraph({ run: given }: { run?: Run } = {}) {
  const file = trajectories();
  const run = given ?? file.runs.find((entry) => entry.findings.length > 0) ?? file.runs[0];
  const steps = run?.steps ?? [];

  const host = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setPlaying(true);
      return;
    }
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlaying(true);
          watcher.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  if (!run || steps.length === 0) {
    return null;
  }

  const rows = Math.ceil(steps.length / COLS);
  const width = COLS * W + (COLS - 1) * GX;
  const height = rows * H + (rows - 1) * GY;

  return (
    <figure className="graph" ref={host}>
      <div className="canvasbar">
        <span className="canvasname">
          agent run · <code>{run.bundle}</code>
        </span>
        <span className="canvasmeta">
          {steps.length} steps · {run.model}
        </span>
      </div>

      <div className="canvaswrap">
        <svg
          viewBox={`${-TURN - 10} -12 ${width + (TURN + 10) * 2} ${height + 24}`}
          className={playing ? "flowsvg go" : "flowsvg"}
          role="img"
          aria-label={`The ${steps.length} steps the agent took on ${run.bundle}, in order`}
        >
          <g className="flowedges">
            {steps.slice(0, -1).map((step, index) => (
              <path
                key={`e${step.index}`}
                d={edgePath(index)}
                className="fedge"
                style={{ animationDelay: `${index * 170 + 120}ms` }}
              />
            ))}
          </g>

          <g className="flownodes">
            {steps.map((step, index) => {
              const at = place(index);
              const value = reward(step);
              const kind = tone(step);
              return (
                <g
                  key={step.index}
                  className={`fnode ${kind}`}
                  style={{ animationDelay: `${index * 170}ms` }}
                >
                  <rect x={at.x} y={at.y} width={W} height={H} rx={10} className="fbox" />
                  <rect x={at.x + 11} y={at.y + 12} width={28} height={28} rx={8} className="ftile" />
                  <path
                    d={GLYPHS[step.tool ?? "thinking"] ?? GLYPHS.thinking}
                    className="fglyph"
                    transform={`translate(${at.x + 17} ${at.y + 18}) scale(0.95)`}
                  />
                  <text x={at.x + 46} y={at.y + 25} className="fstep">
                    {step.tool ?? "thinking"}
                  </text>
                  <text x={at.x + 11} y={at.y + 54} className="flabel">
                    {trim(label(step), value ? 15 : 21)}
                  </text>
                  <circle cx={at.x + W - 15} cy={at.y + 15} r={9} className="fnum" />
                  <text x={at.x + W - 15} y={at.y + 18} className="fnumtext">
                    {index + 1}
                  </text>
                  {value ? (
                    <text x={at.x + W - 11} y={at.y + 54} className="frew">
                      {value}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <figcaption>
        {run.findings.length ? (
          <>
            Every node is a tool call that actually ran. The one marked in red is where a candidate
            it wrote earned reward <strong>1.0</strong> without doing the task, which is what turned
            a suspicion into the finding it reports at the end.
          </>
        ) : (
          <>
            Every node is a tool call that actually ran. Nothing here earned reward without doing
            the task, so the run ends by reporting nothing, which is the correct answer for a
            bundle with no defect to find.
          </>
        )}
      </figcaption>
    </figure>
  );
}
