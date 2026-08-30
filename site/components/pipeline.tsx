const GATES = ["static", "similarity", "validation", "trials", "review", "gate"];

const X0 = 104;
const BOX_W = 58;
const PITCH = 74;

function gateX(index: number) {
  return X0 + index * PITCH;
}

function Lane({ y, stopAt }: { y: number; stopAt: number | null }) {
  const lastX = gateX(GATES.length - 1) + BOX_W;
  return (
    <g>
      <line x1={X0 - 14} y1={y + 15} x2={lastX} y2={y + 15} className="wire" />
      {GATES.map((name, index) => {
        const failed = stopAt !== null && index === stopAt;
        const skipped = stopAt !== null && index > stopAt;
        return (
          <g key={name} opacity={skipped ? 0.3 : 1}>
            <rect
              x={gateX(index)}
              y={y}
              width={BOX_W}
              height={30}
              rx={3}
              className={failed ? "gatebox bad" : "gatebox ok"}
            />
            <text x={gateX(index) + BOX_W / 2} y={y + 19} className="gatelabel">
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function Pipeline() {
  const stopX = gateX(3) + BOX_W / 2;
  const endX = gateX(GATES.length - 1) + BOX_W;
  return (
    <figure className="figurebox">
      <svg viewBox="0 0 600 210" role="img" aria-labelledby="pipe_title">
        <title id="pipe_title">
          Submitting an unchecked bundle spends hours before the trials gate rejects it. Running
          Shakedown first catches the same defect locally, and every gate then passes.
        </title>

        <text x={0} y={16} className="lanelabel">
          submit and wait
        </text>
        <Lane y={30} stopAt={3} />
        <g className="pipeflight slow">
          <circle r={7} cx={X0 - 14} cy={45} className="token warm" />
        </g>
        <g className="pipeverdict late">
          <line x1={stopX - 9} y1={36} x2={stopX + 9} y2={54} className="cross" />
          <line x1={stopX + 9} y1={36} x2={stopX - 9} y2={54} className="cross" />
          <text x={endX} y={80} className="verdicttext bad">
            rejected, hours gone
          </text>
        </g>

        <text x={0} y={126} className="lanelabel">
          shake it down first
        </text>
        <g>
          <rect x={0} y={140} width={72} height={30} rx={3} className="gatebox self" />
          <text x={36} y={159} className="gatelabel light">
            shakedown
          </text>
        </g>
        <Lane y={140} stopAt={null} />
        <g className="pipeflight fast">
          <circle r={7} cx={X0 - 14} cy={155} className="token cold" />
        </g>
        <g className="pipeverdict early">
          <text x={endX} y={190} className="verdicttext good">
            through, first time
          </text>
        </g>
      </svg>
      <figcaption>
        The gauntlet runs cheap checks first and the paid model trials in the middle, so a defect at
        that depth costs the whole run. Shakedown reproduces the same class of defect on your own
        machine, in seconds, for nothing.
      </figcaption>
    </figure>
  );
}
