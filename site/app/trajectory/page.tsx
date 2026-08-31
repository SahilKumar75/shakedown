import { TrajectoryView } from "@/components/trajectoryview";
import { trajectories } from "@/lib/trajectories";

export const metadata = {
  title: "Agent",
  description: "Every step the agent took, including the ones that led nowhere.",
};

export default function TrajectoryPage() {
  const file = trajectories();
  const totals = file.totals;

  return (
    <main>
      <p className="eyebrow">Agent trajectories</p>
      <h1>Where the probes stop, an agent goes</h1>
      <p className="lede">
        Six of the twelve failure classes can be settled by a fixed probe. The rest need
        something that can read a verifier, form an idea about how it could be cheated, write the
        submission that would cheat it, and run it. That is the agent layer, and every step it
        takes is recorded here, including the ones that led nowhere.
      </p>
      <p className="lede">
        It is held to the same rule the probes are. It cannot assert a defect it has not
        reproduced, because the only way it learns anything about behaviour is to execute the
        bundle through a tool.
      </p>

      <div className="scoreboard">
        <div className="tile">
          <div className="figure">{totals.bundles}</div>
          <div className="caption">bundles investigated</div>
        </div>
        <div className="tile">
          <div className="figure">{totals.steps}</div>
          <div className="caption">recorded steps</div>
        </div>
        <div className="tile">
          <div className="figure">{totals.found}</div>
          <div className="caption">defects it reproduced</div>
        </div>
        <div className="tile">
          <div className="figure">{totals.seconds.toFixed(0)}s</div>
          <div className="caption">of model time</div>
        </div>
      </div>

      <TrajectoryView runs={file.runs} />
    </main>
  );
}
