import { PrThread } from "@/components/prthread";
import { allReports, outcome } from "@/lib/data";

export default function ReportPage() {
  const reports = allReports();
  const score = outcome();

  return (
    <main>
      <p className="eyebrow">Review console</p>
      <h1>Every comment has a run behind it</h1>
      <p className="lede short">
        Reviewed like a pull request: checks, comments against the file they belong to, a decision.
        No comment is written unless a probe reproduced what it claims.
      </p>

      <div className="scoreboard">
        <div className="tile">
          <div className="figure">
            {score.detected} <span className="of">of {score.planted}</span>
          </div>
          <div className="caption">planted defects caught</div>
        </div>
        <div className="tile">
          <div className="figure">
            {score.falseAlarms} <span className="of">of {score.cleanBundles}</span>
          </div>
          <div className="caption">clean bundles wrongly held</div>
        </div>
        <div className="tile">
          <div className="figure">{score.seconds.toFixed(0)}s</div>
          <div className="caption">to review all {reports.length}</div>
        </div>
      </div>

      <PrThread reports={reports} />
    </main>
  );
}
