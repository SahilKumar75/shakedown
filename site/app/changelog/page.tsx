import payload from "@/data/changelog.json";
import { Reveal } from "@/components/reveal";
import { ClearIcon, HoldIcon, RunIcon } from "@/components/icons";

export const metadata = {
  title: "Changelog",
  description: "What was tried, what it measured, and what was reverted.",
};

interface Entry {
  stage: string;
  tried: string;
  why: string;
  evidence: string;
  decision: string;
  kept: boolean;
}

const entries = (payload as { entries: Entry[] }).entries;

export default function ChangelogPage() {
  const kept = entries.filter((entry) => entry.kept).length;

  return (
    <main>
      <p className="eyebrow">Changelog</p>
      <h1>What was tried, and what it cost</h1>
      <p className="lede">
        One entry per meaningful change, each with the evidence that decided the next one. The
        experiment that was removed is kept here on purpose.
      </p>

      <div className="scoreboard">
        <div className="tile">
          <div className="figure">{entries.length}</div>
          <div className="caption">recorded changes</div>
        </div>
        <div className="tile">
          <div className="figure">{kept}</div>
          <div className="caption">kept after measuring</div>
        </div>
        <div className="tile">
          <div className="figure">{entries.length - kept}</div>
          <div className="caption">reverted, and why</div>
        </div>
      </div>

      <Reveal>
        <ol className="timeline log">
          {entries.map((entry) => (
            <li className="ev" key={entry.stage}>
              <span className={entry.kept ? "evdot sound" : "evdot flare"}>
                {entry.kept ? <ClearIcon /> : <HoldIcon />}
              </span>
              <div className="evcard">
                <div className="evtop">
                  <strong>{entry.stage}</strong>
                  <span className={entry.kept ? "chip" : "chip block"}>
                    {entry.kept ? "kept" : "reverted"}
                  </span>
                </div>
                <h4>{entry.tried}</h4>
                <p>{entry.why}</p>
                <div className="proof">
                  <span className="prooflabel">
                    <RunIcon /> what the run showed
                  </span>
                  <code>{entry.evidence}</code>
                </div>
                <p className="fix">
                  <strong>Decision</strong> {entry.decision}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </main>
  );
}
