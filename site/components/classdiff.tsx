import { ClearIcon, HoldIcon } from "./icons";

export interface ClassRow {
  name: string;
  label: string;
  planted: number;
  baseline: number;
  shakedown: number;
}

function Dots({ filled, total, tone }: { filled: number; total: number; tone: string }) {
  return (
    <span className="dots">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={index < filled ? `dot ${tone}` : "dot"}
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </span>
  );
}

export function ClassDiff({ rows }: { rows: ClassRow[] }) {
  return (
    <div className="classdiff">
      <div className="cdhead">
        <span>class</span>
        <span>hand checks</span>
        <span>shakedown</span>
        <span>change</span>
      </div>
      {rows.map((row) => {
        const gained = row.shakedown > row.baseline;
        const missed = row.shakedown === 0;
        return (
          <div className={gained ? "cdrow gained" : "cdrow"} key={row.name}>
            <span className="cdname">{row.label}</span>
            <span className="cdcell">
              <Dots filled={row.baseline} total={row.planted} tone="base" />
              <span className="cdnum">
                {row.baseline}/{row.planted}
              </span>
            </span>
            <span className="cdcell">
              <Dots filled={row.shakedown} total={row.planted} tone="ours" />
              <span className="cdnum">
                {row.shakedown}/{row.planted}
              </span>
            </span>
            <span className={gained ? "cddelta up" : missed ? "cddelta none" : "cddelta"}>
              {gained ? (
                <>
                  <ClearIcon /> plus {row.shakedown - row.baseline}
                </>
              ) : missed ? (
                <>
                  <HoldIcon /> still open
                </>
              ) : (
                "no change"
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
