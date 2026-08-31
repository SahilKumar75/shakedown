import Link from "next/link";
import { allReports, outcome } from "@/lib/data";
import { comparison } from "@/lib/compare";
import { trajectories } from "@/lib/trajectories";
import { ArmBars } from "@/components/armbars";
import { Bento } from "@/components/bento";
import { BundleScan } from "@/components/bundlescan";
import { CountUp } from "@/components/countup";
import { Coverage } from "@/components/coverage";
import { Magnetic } from "@/components/magnetic";
import { Reveal } from "@/components/reveal";
import { StagePipe } from "@/components/stagepipe";
import { AgentLoading } from "@/components/agentloading";
import { Steps } from "@/components/steps";
import { Aurora, GridField, Marquee, Pill, TerminalDemo } from "@/components/surfaces";
import { RevealCompare } from "@/components/revealcompare";
import { Versus } from "@/components/versus";
import { ProbeStatus } from "@/components/probestatus";

const CLASSES = [
  "answer leak",
  "oracle fails",
  "nop passes",
  "weak verifier",
  "hardcodable",
  "nondeterministic",
  "undetermined rule",
  "graceless failure",
  "path escape",
  "forbidden wording",
  "unwitnessed encoding",
  "slow oracle",
];

export default function OverviewPage() {
  const score = outcome();
  const reports = allReports();
  const arms = comparison();
  const agent = trajectories();
  const lift = arms.shakedown.score.caught - arms.baseline.score.caught;
  const shakeClasses = Object.values(arms.shakedown.score.by_class).filter(
    (row) => row.caught > 0,
  ).length;
  const baseClasses = Object.values(arms.baseline.score.by_class).filter(
    (row) => row.caught > 0,
  ).length;

  return (
    <main className="landing">
      <Aurora />
      <GridField />

      <section className="hero">
        <div className="herotext">
          <Pill>micro1 agentic workflows hackathon</Pill>
          <h1 className="rise d1">
            Find the defect before the pipeline <em>charges you for it</em>
          </h1>
          <p className="lede rise d2">
            Shakedown rehearses an expensive benchmark review pipeline on your machine, before you
            submit, so a rejection costs seconds instead of a whole cycle.
          </p>
          <div className="actions rise d3">
            <Magnetic>
              <Link className="button shine" href="/report">
                See a live review <span className="arrow">&rarr;</span>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link className="button ghost" href="/reproduce">
                Reproduce it yourself
              </Link>
            </Magnetic>
          </div>
          <div className="trustbar rise d3">
            <span>
              <strong>
                <CountUp value={score.detected} />
              </strong>{" "}
              of {score.planted} planted defects caught
            </span>
            <span className="tsep" />
            <span>
              <strong>
                <CountUp value={score.falseAlarms} />
              </strong>{" "}
              false alarms
            </span>
            <span className="tsep" />
            <span>
              <strong>$0</strong> per run
            </span>
          </div>
        </div>
        <BundleScan />
      </section>

      <Marquee items={CLASSES} />

      <Reveal as="section" className="band">
        <div className="bandhead">
          <Pill tone="done">the product</Pill>
          <h2>A review that has already run the code</h2>
          <p className="lede short">
            Point it at a bundle. It executes, reproduces, and reports only what it proved.
          </p>
        </div>
        <div className="split">
          <TerminalDemo />
          <div className="splitnote">
            <Steps />
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="band">
        <Bento />
      </Reveal>

      <Reveal as="section" className="band">
        <div className="bandhead">
          <Pill tone="success">measured</Pill>
          <h2>Against the two checks an author already runs</h2>
          <p className="lede short">
            Same {reports.length} bundles, same labels, both arms measured on this machine. The
            baseline is the manual process: run the reference, then run an empty submission.
          </p>
        </div>
        <RevealCompare />
        <p className="draghint">Drag the divider. Same bundle, reviewed both ways.</p>
        <ArmBars />
        <div className="liftrow">
          <span className="liftfig">
            +<CountUp value={lift} />
          </span>
          <span className="liftnote">
            more defects caught than doing it by hand, reaching {shakeClasses} classes instead of{" "}
            {baseClasses}
          </span>
        </div>
      </Reveal>

      <Reveal as="section" className="band">
        <div className="bandhead">
          <Pill tone="success">side by side</Pill>
          <h2>What each one can actually tell you</h2>
          <p className="lede short">
            Both arms get the same bundles. The difference is how many questions each can answer.
          </p>
        </div>
        <Versus />
      </Reveal>

      <Reveal as="section" className="band">
        <div className="bandhead">
          <Pill>live corpus</Pill>
          <h2>Every probe, every bundle</h2>
          <p className="lede short">
            One tick per bundle. Red is a defect that probe reproduced, and hovering a tick names
            it.
          </p>
        </div>
        <ProbeStatus reports={reports} />
      </Reveal>

      <Reveal as="section" className="band">
        <div className="bandhead">
          <Pill>coverage</Pill>
          <h2>What it catches, and what it does not</h2>
          <p className="lede short">
            One square per bundle, filled when the probe reproduced the planted defect.
          </p>
        </div>
        <Coverage />
      </Reveal>

      <Reveal as="section" className="band">
        <div className="bandhead">
          <Pill tone="done">the agent layer</Pill>
          <h2>Where a fixed probe cannot go</h2>
          <p className="lede short">
            {agent.totals.bundles} bundles investigated across {agent.totals.steps} recorded steps,
            each one replayable on the trajectory page.
          </p>
        </div>
        <div className="split">
          <AgentLoading />
          <div className="splitnote">
            <p className="lede short">
              The agent gets the probes as tools, so every claim it makes has a run behind it. This
              replays the shape of one investigation; the real ones are recorded step by step.
            </p>
            <Link className="button ghost" href="/trajectory">
              Read a trajectory
            </Link>
          </div>
        </div>
        <StagePipe />
      </Reveal>

      <Reveal as="section" className="cta">
        <h2>Run it against your own bundle</h2>
        <p>Three commands, no key, no account, nothing uploaded.</p>
        <Magnetic>
          <Link className="button shine" href="/reproduce">
            Reproduce the whole thing <span className="arrow">&rarr;</span>
          </Link>
        </Magnetic>
      </Reveal>
    </main>
  );
}
