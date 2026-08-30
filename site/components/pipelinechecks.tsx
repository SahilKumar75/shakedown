import { ClearIcon, ClockIcon, RunIcon } from "./icons";

const JOB = [
  {
    name: "checkout",
    detail: "actions/checkout@v4",
    note: "the pull request as proposed",
  },
  {
    name: "python",
    detail: "actions/setup-python@v5, 3.12",
    note: "standard library only, nothing to install",
  },
  {
    name: "build the corpus",
    detail: "python3 corpus/generate.py corpus_out 24 7",
    note: "seeded, so the runner builds the same 24 bundles byte for byte",
  },
  {
    name: "shake every bundle down",
    detail: "python3 -m shakedown.cli sweep corpus_out/main --json shakedown.json",
    note: "exits non zero the moment a bundle would be held",
  },
  {
    name: "check the site still tells the truth",
    detail: "python3 tools/check_claims.py shakedown.json site/data/reports.json",
    note: "fails when a published number no longer matches what the bench earns",
  },
  {
    name: "post the run on the pull request",
    detail: "actions/github-script@v7",
    note: "updates its own comment rather than stacking new ones",
  },
  {
    name: "upload the report",
    detail: "actions/upload-artifact@v4",
    note: "the machine readable result, kept with the run",
  },
];

export function PipelineChecks() {
  return (
    <div className="job">
      <div className="jobhead">
        <span className="jobname">
          <RunIcon /> shakedown / shake the corpus down
        </span>
        <span className="jobmeta">
          <ClockIcon /> ubuntu latest, 15 minute ceiling
        </span>
      </div>
      {JOB.map((step, index) => (
        <div className="jobstep" key={step.name}>
          <span className="jobmark">
            <ClearIcon />
          </span>
          <span className="jobnum">{index + 1}</span>
          <span className="jobbody">
            <span className="jobtitle">{step.name}</span>
            <code>{step.detail}</code>
            <span className="jobnote">{step.note}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
