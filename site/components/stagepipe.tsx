const STAGES = [
  { name: "static", note: "shape, metadata, paths", cost: "seconds" },
  { name: "similarity", note: "is this task novel", cost: "seconds" },
  { name: "validation", note: "reference passes, empty fails", cost: "a minute" },
  { name: "pass@2", note: "two paid model attempts", cost: "an hour" },
  { name: "deep review", note: "a model reads the whole bundle", cost: "minutes, paid" },
  { name: "qc", note: "mutates the solver, re-runs", cost: "twenty minutes" },
  { name: "trials", note: "five more paid attempts", cost: "an hour, paid" },
  { name: "gate", note: "accept or send it back", cost: "seconds" },
];

export function StagePipe() {
  return (
    <figure className="figurebox stagepipe">
      <div className="stagerow">
        {STAGES.map((stage, index) => (
          <div className="stage" key={stage.name} style={{ animationDelay: `${index * 90}ms` }}>
            <div className="stagebar">
              <span className="stagefill" style={{ animationDelay: `${index * 90}ms` }} />
            </div>
            <div className="stagename">{stage.name}</div>
            <div className="stagenote">{stage.note}</div>
            <div className="stagecost">{stage.cost}</div>
          </div>
        ))}
      </div>
      <figcaption>
        A bundle walks this in order and stops at the first gate it fails. The expensive stages sit
        in the middle, so the further a defect travels the more it costs to find. Shakedown
        rehearses the checkable half of this on your machine before the first paid stage runs.
      </figcaption>
    </figure>
  );
}
