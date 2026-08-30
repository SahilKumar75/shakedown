import { ReportView } from "@/components/reportview";
import { allReports, outcome } from "@/lib/data";

export default function ReportPage() {
  const reports = allReports();
  const score = outcome();
  const heldClean = score.falseAlarms;

  return (
    <main>
      <h1>Run report</h1>
      <p className="lede">
        Every bundle below was inspected by the same gauntlet. A finding is only shown when a probe
        could reproduce it, so each line of evidence is a thing that actually happened on this
        machine rather than a guess about the code.
      </p>

      <div className="scoreboard">
        <div className="tile">
          <div className="figure">
            {score.detected} of {score.planted}
          </div>
          <div className="caption">planted defects caught</div>
        </div>
        <div className="tile">
          <div className="figure">
            {heldClean} of {score.cleanBundles}
          </div>
          <div className="caption">clean bundles wrongly held</div>
        </div>
        <div className="tile">
          <div className="figure">{score.seconds.toFixed(0)}s</div>
          <div className="caption">to inspect all {reports.length}</div>
        </div>
      </div>

      <h2>Bundles</h2>
      <ReportView reports={reports} />
    </main>
  );
}
