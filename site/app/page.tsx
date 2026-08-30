import Link from "next/link";
import { allReports, defectLabel, outcome } from "@/lib/data";

export default function OverviewPage() {
  const score = outcome();
  const reports = allReports();
  const classes = Array.from(
    new Set(reports.map((entry) => entry.injected).filter((name): name is NonNullable<typeof name> => Boolean(name))),
  ).sort();

  return (
    <main>
      <h1>Find the defect before the pipeline charges you for it</h1>
      <p className="lede">
        A shakedown run is the trial voyage a ship makes before it enters service. You stress it on
        purpose so the faults surface while they are still cheap. Shakedown does that for benchmark
        task bundles, rehearsing an expensive automated review locally so a rejection costs minutes
        instead of a whole cycle.
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
            {score.falseAlarms} of {score.cleanBundles}
          </div>
          <div className="caption">clean bundles wrongly held</div>
        </div>
        <div className="tile">
          <div className="figure">{score.seconds.toFixed(0)}s</div>
          <div className="caption">to inspect {reports.length} bundles</div>
        </div>
        <div className="tile">
          <div className="figure">{classes.length}</div>
          <div className="caption">defect classes modelled</div>
        </div>
      </div>

      <h2>Who this is for</h2>
      <p className="lede">
        Task authors who write evaluation benchmarks. You ship a problem, an artifact, a reference
        solution and a verifier, then wait on a pipeline that grades the bundle through a sequence of
        gates. A run takes hours, the probe stages spend real money on model trials, and a single
        defect at any gate ends the run and sends you back to the start.
      </p>

      <h2>What it looks at</h2>
      <table className="plain">
        <thead>
          <tr>
            <th>Defect class</th>
            <th>Bundles in corpus</th>
            <th>Caught</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((name) => {
            const planted = reports.filter((entry) => entry.injected === name);
            const found = planted.filter((entry) =>
              entry.findings.some((finding) => finding.defect === name),
            );
            return (
              <tr key={name}>
                <td>{defectLabel(name)}</td>
                <td>{planted.length}</td>
                <td>
                  {found.length} of {planted.length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>See it run</h2>
      <p className="lede">
        <Link href="/report">Open the run report</Link> to walk the corpus bundle by bundle, with the
        evidence behind every finding.
      </p>
    </main>
  );
}
