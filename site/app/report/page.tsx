import { ReviewConsole } from "@/components/reviewconsole";
import { allReports, outcome } from "@/lib/data";

export default function ReportPage() {
  const reports = allReports();
  const score = outcome();

  return (
    <main>
      <p className="eyebrow">Review console</p>
      <h1>Every comment has a run behind it</h1>
      <p className="lede">
        Each bundle is reviewed the way a pull request is: checks down the top, comments against the
        file and line they belong to, a decision at the end. The difference is that no comment is
        written unless a probe reproduced what it claims.
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

      <ReviewConsole reports={reports} />
    </main>
  );
}
