import payload from "@/data/changelog.json";
import { Timeline } from "@/components/timeline";

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

      <Timeline beats={entries} />
    </main>
  );
}
