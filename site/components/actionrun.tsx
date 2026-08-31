"use client";

import { useState } from "react";
import { ClearIcon, ClockIcon, RunIcon } from "./icons";

const STEPS = [
  {
    name: "Set up job",
    seconds: 2,
    log: ["Runner: ubuntu-latest", "Job: shake the corpus down", "Timeout: 15 minutes"],
  },
  {
    name: "actions/checkout@v4",
    seconds: 3,
    log: ["Syncing repository", "Checking out the pull request head"],
  },
  {
    name: "actions/setup-python@v5",
    seconds: 4,
    log: ["Installed Python 3.12", "No dependencies to install, standard library only"],
  },
  {
    name: "Build the corpus",
    seconds: 11,
    log: [
      "$ python3 corpus/generate.py corpus_out 24 7",
      "wrote 24 bundles across 3 themes",
      "seed 7, so this tree is identical on every runner",
    ],
  },
  {
    name: "Shake every bundle down",
    seconds: 34,
    log: [
      "$ python3 -m shakedown.cli sweep corpus_out/main --json shakedown.json",
      "hold  address_normalise_02    0.7s  oracle_fails",
      "clear address_normalise_05    1.7s  none",
      "...",
      "10 of 24 bundles would be held.",
    ],
  },
  {
    name: "Check the site still tells the truth",
    seconds: 1,
    log: [
      "$ python3 tools/check_claims.py shakedown.json site/data/reports.json",
      "this run   24 bundles, 10 held",
      "site says  24 bundles, 10 held",
      "The site states what the bench measures.",
    ],
  },
  {
    name: "Post the run on the pull request",
    seconds: 2,
    log: ["Updating the existing Shakedown comment rather than adding another"],
  },
];

export function ActionRun() {
  const [open, setOpen] = useState<string | null>("Shake every bundle down");
  const total = STEPS.reduce((sum, step) => sum + step.seconds, 0);

  return (
    <div className="job">
      <div className="jobhead">
        <span className="jobname">
          <ClearIcon /> shakedown / shake the corpus down
        </span>
        <span className="jobmeta">
          <ClockIcon /> succeeded in {total}s
        </span>
      </div>
      {STEPS.map((step) => {
        const isOpen = open === step.name;
        return (
          <div className="runstep" key={step.name}>
            <button className="runhead" onClick={() => setOpen(isOpen ? null : step.name)}>
              <span className="runmark">
                <ClearIcon />
              </span>
              <span className="runname">{step.name}</span>
              <span className="runtime">{step.seconds}s</span>
            </button>
            {isOpen ? (
              <pre className="runlog">
                {step.log.map((line, index) => (
                  <span
                    className="logline"
                    key={index}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    {line}
                  </span>
                ))}
              </pre>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
