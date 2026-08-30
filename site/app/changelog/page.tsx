import payload from "@/data/changelog.json";

interface Entry {
  stage: string;
  tried: string;
  why: string;
  evidence: string;
  decision: string;
  kept: boolean;
}

const entries = (payload as { entries: Entry[] }).entries;

export default function ChangelogPage() {
  return (
    <main>
      <h1>Improvement changelog</h1>
      <p className="lede">
        One entry for every meaningful change, with the evidence that prompted the next decision.
        The experiment that was removed is kept here on purpose, because what it taught is the
        reason the mutation probe works the way it does now.
      </p>

      {entries.map((entry) => (
        <section key={entry.stage} className="panel" style={{ marginTop: 18 }}>
          <div className="panelhead">
            <div>
              <h3 style={{ fontFamily: "inherit" }}>{entry.stage}</h3>
              <div className="sub">{entry.tried}</div>
            </div>
            <span className={entry.kept ? "badge clear" : "badge hold"}>
              {entry.kept ? "kept" : "removed"}
            </span>
          </div>
          <dl className="detail" style={{ marginTop: 14 }}>
            <dt>Why</dt>
            <dd>{entry.why}</dd>
            <dt>Evidence</dt>
            <dd className="mono">{entry.evidence}</dd>
            <dt>Decision</dt>
            <dd>{entry.decision}</dd>
          </dl>
        </section>
      ))}
    </main>
  );
}
