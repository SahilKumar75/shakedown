"use client";

import { useState } from "react";
import type { Run, Step } from "@/lib/trajectories";
import { AgentIcon, ClearIcon, ClockIcon, FileIcon, HoldIcon, ProbeIcon, RunIcon } from "./icons";

function toolIcon(tool: string | null) {
  if (tool === "run_candidate" || tool === "run_reference" || tool === "run_empty") {
    return <RunIcon />;
  }
  if (tool === "report") {
    return <AgentIcon />;
  }
  if (tool === "list_files" || tool === "read_file") {
    return <FileIcon />;
  }
  return <ProbeIcon />;
}

function label(step: Step): string {
  if (step.tool === "read_file") {
    return `read ${String(step.arguments.path ?? "")}`;
  }
  if (step.tool === "run_candidate") {
    return String(step.arguments.why ?? "ran a candidate it wrote");
  }
  if (step.tool === "run_reference") {
    return "ran the reference solution";
  }
  if (step.tool === "run_empty") {
    return "ran an empty submission";
  }
  if (step.tool === "list_files") {
    return "listed the bundle";
  }
  if (step.tool === "report") {
    return "reported";
  }
  return "thought without acting";
}

function rewardOf(result: string): string | null {
  const match = result.match(/reward=([0-9.]+)/);
  return match ? match[1] : null;
}

function StepRow({ step }: { step: Step }) {
  const [open, setOpen] = useState(false);
  const reward = rewardOf(step.result);
  const source = typeof step.arguments.source === "string" ? step.arguments.source : "";
  return (
    <li className={open ? "tstep open" : "tstep"}>
      <button className="tstephead" onClick={() => setOpen(!open)}>
        <span className="tnum">{step.index}</span>
        <span className="ticon">{toolIcon(step.tool)}</span>
        <span className="tlabel">{label(step)}</span>
        {reward ? (
          <span className={reward === "1.0" ? "treward hit" : "treward"}>reward {reward}</span>
        ) : null}
        <span className="tsecs">{step.seconds.toFixed(1)}s</span>
      </button>
      {open ? (
        <div className="tbody">
          {step.thought ? (
            <div className="tthought">
              <span className="tcap">what it was thinking</span>
              <p>{step.thought}</p>
            </div>
          ) : null}
          {source ? (
            <div className="tcode">
              <span className="tcap">the submission it wrote</span>
              <pre>{source}</pre>
            </div>
          ) : null}
          {step.result ? (
            <div className="tcode">
              <span className="tcap">what came back</span>
              <pre>{step.result}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function TrajectoryView({ runs }: { runs: Run[] }) {
  const [selected, setSelected] = useState(runs[0]?.bundle ?? "");
  const active = runs.find((run) => run.bundle === selected) ?? runs[0];
  const executions = active.steps.filter((step) => rewardOf(step.result) !== null).length;

  return (
    <div className="console">
      <aside className="queue">
        <div className="queuehead">{runs.length} agent runs</div>
        {runs.map((run) => (
          <button
            key={run.bundle}
            className={run.bundle === active.bundle ? "qrow on" : "qrow"}
            onClick={() => setSelected(run.bundle)}
          >
            {run.verdict === "hold" ? <HoldIcon className="hold" /> : <ClearIcon className="ok" />}
            <span className="qname">{run.bundle}</span>
            <span className="qcount">{run.steps.length}</span>
          </button>
        ))}
      </aside>

      <section className="review">
        <header className="reviewhead">
          <div>
            <h3>{active.bundle}</h3>
            <p className="sub">
              {active.planted
                ? `planted defect: ${active.planted.split("_").join(" ")}`
                : "built as a clean control, with no planted defect"}
            </p>
          </div>
          <div className={active.verdict === "hold" ? "decision hold" : "decision clear"}>
            {active.verdict === "hold" ? <HoldIcon /> : <ClearIcon />}
            {active.verdict === "hold" ? "reported a defect" : "reported nothing"}
          </div>
        </header>

        <div className="facts">
          <span>
            <AgentIcon /> {active.model}
          </span>
          <span>
            <ProbeIcon /> {active.steps.length} steps
          </span>
          <span>
            <RunIcon /> {executions} executions
          </span>
          <span>
            <ClockIcon /> {active.seconds.toFixed(0)}s
          </span>
          <span>{(active.prompt_tokens / 1000).toFixed(0)}k tokens in</span>
        </div>

        {active.findings.length > 0 ? (
          active.findings.map((finding, index) => (
            <article className="comment blocking agentfinding" key={index}>
              <header>
                <span className="who">
                  <AgentIcon /> agent
                </span>
                <span className="what">
                  requested changes on <code>{finding.location}</code>
                </span>
                <span className="chip block">blocking</span>
              </header>
              <h4>{finding.summary}</h4>
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
                <span className="chip">reproduced</span>
              </footer>
            </article>
          ))
        ) : (
          <p className="empty">
            The agent reported nothing here. It ended because it {active.stopped}.
          </p>
        )}

        <div className="trailhead">
          <ProbeIcon /> every step it took, in order
        </div>
        <ol className="trail">
          {active.steps.map((step) => (
            <StepRow key={step.index} step={step} />
          ))}
        </ol>
      </section>
    </div>
  );
}
