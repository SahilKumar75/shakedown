import { ClearIcon, HoldIcon } from "./icons";

const ROWS: { label: string; base: boolean | string; ours: boolean | string }[] = [
  { label: "Reference actually passes", base: true, ours: true },
  { label: "Empty submission actually fails", base: true, ours: true },
  { label: "Expected answers reachable by the solver", base: false, ours: true },
  { label: "Verifier accepts a mutated reference", base: false, ours: true },
  { label: "Same submission scores differently twice", base: false, ours: true },
  { label: "A crash records no reward", base: false, ours: true },
  { label: "Graded output path can be redirected", base: false, ours: true },
  { label: "Instruction leaks the harness mechanics", base: false, ours: true },
  { label: "Evidence attached to every claim", base: false, ours: true },
  { label: "Runs in CI on every pull request", base: false, ours: true },
  { label: "Cost per run", base: "$0", ours: "$0" },
  { label: "Time for 24 bundles", base: "10s", ours: "34s" },
];

function Cell({ value, ours }: { value: boolean | string; ours?: boolean }) {
  if (typeof value === "string") {
    return <span className="vsval">{value}</span>;
  }
  return value ? (
    <span className={ours ? "vsmark yes" : "vsmark yes muted"}>
      <ClearIcon />
    </span>
  ) : (
    <span className="vsmark no">
      <HoldIcon />
    </span>
  );
}

export function Versus() {
  return (
    <div className="versus">
      <div className="vshead">
        <span />
        <span className="vscol">by hand</span>
        <span className="vscol ours">shakedown</span>
      </div>
      {ROWS.map((row) => (
        <div className="vsrow" key={row.label}>
          <span className="vslabel">{row.label}</span>
          <Cell value={row.base} />
          <Cell value={row.ours} ours />
        </div>
      ))}
    </div>
  );
}
