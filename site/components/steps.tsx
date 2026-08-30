const STEPS = [
  {
    title: "Point it at a bundle",
    body: "A problem, an artifact, a reference solution and a verifier.",
    glyph: (
      <g>
        <path d="M3 10 h13 l4 4 h17 v20 H3 Z" className="gstroke" />
        <path d="M10 22 h20 M10 28 h13" className="gstroke thin" />
      </g>
    ),
  },
  {
    title: "It runs the bundle",
    body: "Six probes execute the code: the reference, an empty submission, mutants, repeats.",
    glyph: (
      <g>
        <circle cx={20} cy={22} r={13} className="gstroke" />
        <path d="M20 13 v9 l7 5" className="gstroke thin" />
        <path d="M20 5 v4 M20 35 v4 M6 22 h4 M30 22 h4" className="gstroke thin" />
      </g>
    ),
  },
  {
    title: "It reports what it reproduced",
    body: "Every finding names the run that proves it. Nothing it cannot demonstrate is reported.",
    glyph: (
      <g>
        <path d="M6 32 l9 -9 l7 6 l12 -15" className="gstroke" />
        <path d="M26 14 h8 v8" className="gstroke thin" />
      </g>
    ),
  },
];

export function Steps() {
  return (
    <ol className="steps">
      {STEPS.map((step, index) => (
        <li key={step.title} style={{ animationDelay: `${index * 110}ms` }}>
          <svg viewBox="0 0 40 44" className="glyph" aria-hidden="true">
            {step.glyph}
          </svg>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
