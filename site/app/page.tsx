import Link from "next/link";
import { allReports, outcome } from "@/lib/data";
import { ArmBars } from "@/components/armbars";
import { Coverage } from "@/components/coverage";
import { StagePipe } from "@/components/stagepipe";
import { Reveal } from "@/components/reveal";
import { Steps } from "@/components/steps";

export default function OverviewPage() {
  const score = outcome();
  const reports = allReports();

  return (
    <main>
      <section className="hero">
        <p className="eyebrow rise">Pre submission review for benchmark task bundles</p>
        <h1 className="rise d1">
          Find the defect before the pipeline <em>charges you for it</em>
        </h1>
        <p className="lede rise d2">
          A shakedown run is the trial voyage a ship makes before it enters service. Run one on a
          task bundle and the faults surface while they are still cheap.
        </p>
        <p className="lede rise d2 short">
          Six probes execute the bundle on your machine and report only what they reproduced. No
          key, no service, nothing leaves the room.
        </p>
        <div className="actions rise d3">
          <Link className="button" href="/report">
            Open the run report <span className="arrow">&rarr;</span>
          </Link>
          <Link className="button ghost" href="/method">
            How it decides
          </Link>
        </div>
      </section>

      <Reveal delay={60}>
        <StagePipe />
      </Reveal>

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
          <div className="caption">to inspect {reports.length} bundles</div>
        </div>
        <div className="tile">
          <div className="figure">$0</div>
          <div className="caption">spent on model calls</div>
        </div>
      </div>

      <Reveal as="section">
        <h2 className="ruled">Three moves</h2>
        <Steps />
      </Reveal>

      <Reveal as="section">
        <h2 className="ruled">What it catches</h2>
        <p className="lede short">
          One square per bundle in the corpus, filled when the probe reproduced the planted defect.
        </p>
        <Coverage />
      </Reveal>

      <Reveal as="section">
        <h2 className="ruled">Against doing it by hand</h2>
        <p className="lede short">
          The baseline is what an author already does by hand: run the reference, run an empty
          submission. Same bundles, same labels, both measured here.
        </p>
        <ArmBars />
        <p className="lede short">
          <Link href="/compare">See the full comparison</Link>, class by class and bundle by bundle.
        </p>
      </Reveal>

      <Reveal as="section">
        <h2 className="ruled">Point it at your own bundle</h2>
        <p className="lede short">
          It exits non zero when a bundle would be held and streams each finding as the probe
          reproduces it, so it gates a pull request without a key or a service behind it.
        </p>
        <pre className="shellblock">
          <code>
            <span className="prompt">$</span> python3 -m shakedown.cli run tasks/my_bundle --json
            shakedown.json{"\n"}
            <span className="out">BLOCK oracle_fails solution/solve.py</span>
            {"\n"}
            <span className="out">1 of 1 bundles would be held.</span>
          </code>
        </pre>
      </Reveal>
    </main>
  );
}
