import { classNames, comparison } from "@/lib/compare";
import { defectLabel } from "@/lib/data";
import { ArmBars } from "@/components/armbars";
import { Reveal } from "@/components/reveal";
import { ClassDiff } from "@/components/classdiff";

export const metadata = {
  title: "Compare",
  description: "Shakedown against the two checks an author already runs by hand.",
};

function percent(value: number): string {
  return `${Math.round(value * 100)} percent`;
}

export default function ComparePage() {
  const file = comparison();
  const base = file.baseline.score;
  const shake = file.shakedown.score;
  const classes = classNames();
  const total = file.bundles.length;

  const rows = [
    {
      metric: "Planted defects caught",
      baseline: `${base.caught} of ${base.planted}`,
      shakedown: `${shake.caught} of ${shake.planted}`,
      change: `${shake.caught - base.caught} more`,
    },
    {
      metric: "Share of defects caught",
      baseline: percent(base.recall),
      shakedown: percent(shake.recall),
      change: `${Math.round((shake.recall - base.recall) * 100)} points`,
    },
    {
      metric: "Clean bundles wrongly held",
      baseline: `${base.clean_held} of ${base.clean}`,
      shakedown: `${shake.clean_held} of ${shake.clean}`,
      change: "no change",
    },
    {
      metric: "Defect classes reached",
      baseline: `${Object.values(base.by_class).filter((row) => row.caught > 0).length} of ${classes.length}`,
      shakedown: `${Object.values(shake.by_class).filter((row) => row.caught > 0).length} of ${classes.length}`,
      change: "wider coverage",
    },
    {
      metric: `Seconds to inspect ${total} bundles`,
      baseline: base.seconds.toFixed(0),
      shakedown: shake.seconds.toFixed(0),
      change: `${(shake.seconds - base.seconds).toFixed(0)} more`,
    },
  ];

  return (
    <main>
      <h1>Baseline against Shakedown</h1>
      <p className="lede">
        The baseline is the process an author already follows by hand before submitting: run the
        reference solution and check it earns full reward, then run an empty submission and check it
        earns nothing. Both arms see the same {total} bundles and the same labels, and every figure
        below was measured on this machine rather than estimated.
      </p>

      <Reveal>
        <ArmBars />
      </Reveal>

      <h2 className="ruled">Headline</h2>
      <table className="plain">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Hand checks</th>
            <th>Shakedown</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.metric}>
              <td>{row.metric}</td>
              <td>{row.baseline}</td>
              <td>
                <strong>{row.shakedown}</strong>
              </td>
              <td>{row.change}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="ruled">Where the gain comes from</h2>
      <p className="lede short">
        The hand checks only ever see two failure modes, because two runs can only reveal what those
        two runs expose. Everything else needs a probe that goes looking.
      </p>
      <Reveal>
        <ClassDiff
          rows={classes.map((name) => {
            const baseRow = base.by_class[name] ?? { planted: 0, caught: 0 };
            const shakeRow = shake.by_class[name] ?? { planted: 0, caught: 0 };
            return {
              name,
              label: defectLabel(name as never),
              planted: shakeRow.planted || baseRow.planted,
              baseline: baseRow.caught,
              shakedown: shakeRow.caught,
            };
          })}
        />
      </Reveal>

      <h2 className="ruled">What is still missed</h2>
      <p className="lede short">
        Named rather than hidden. Closing them is the next piece of work, and the same corpus will
        measure whether it landed.
      </p>
      <ul className="lede">
        {classes
          .filter((name) => (shake.by_class[name]?.caught ?? 0) === 0)
          .map((name) => (
            <li key={name}>{defectLabel(name as never)}</li>
          ))}
      </ul>
    </main>
  );
}
