const NODE_W = 168;
const NODE_H = 66;

type Tone = "input" | "probe" | "brain" | "tool" | "out";

interface Node {
  id: string;
  x: number;
  y: number;
  title: string;
  sub: string;
  tone: Tone;
  glyph: "play" | "search" | "brain" | "file" | "list" | "run" | "empty" | "flask" | "check";
}

const NODES: Node[] = [
  { id: "bundle", x: 6, y: 30, title: "bundle", sub: "task + verifier", tone: "input", glyph: "play" },
  { id: "probes", x: 224, y: 30, title: "six probes", sub: "deterministic", tone: "probe", glyph: "search" },
  { id: "agent", x: 442, y: 30, title: "agent", sub: "tool loop", tone: "brain", glyph: "brain" },
  { id: "report", x: 660, y: 30, title: "report", sub: "only what ran", tone: "out", glyph: "check" },

  { id: "read", x: 6, y: 214, title: "read_file", sub: "instruction, verifier", tone: "tool", glyph: "file" },
  { id: "list", x: 180, y: 214, title: "list_files", sub: "what ships", tone: "tool", glyph: "list" },
  { id: "ref", x: 354, y: 214, title: "run_reference", sub: "expects 1.0", tone: "tool", glyph: "run" },
  { id: "empty", x: 528, y: 214, title: "run_empty", sub: "expects 0.0", tone: "tool", glyph: "empty" },
  { id: "cand", x: 702, y: 214, title: "run_candidate", sub: "it writes this", tone: "tool", glyph: "flask" },
];

const GLYPHS: Record<Node["glyph"], string> = {
  play: "M6 4.5 13 9 6 13.5z",
  search: "M8 3.2a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zM11.6 11.6 15 15",
  brain: "M5 5.5h8v7H5zM8 2.5v3M6.4 8.6h.01M9.6 8.6h.01",
  file: "M4.5 2.5h5l3 3v8h-8zM9.5 2.5v3h3",
  list: "M4 4.5h9M4 9h9M4 13.5h5",
  run: "M3.5 4 7 7 3.5 10M8 12h5",
  empty: "M4 4h9v9H4zM4 4l9 9",
  flask: "M6.5 2.5v4L3.5 13h9l-3-6.5v-4M5.5 2.5h5",
  check: "M4 8.6 7 11.6l5-6",
};

function node(id: string) {
  return NODES.find((entry) => entry.id === id) as Node;
}

function mainEdge(from: string, to: string) {
  const a = node(from);
  const b = node(to);
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const mid = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

function toolEdge(toolId: string) {
  const agent = node("agent");
  const tool = node(toolId);
  const x1 = agent.x + NODE_W / 2;
  const y1 = agent.y + NODE_H;
  const x2 = tool.x + NODE_W / 2;
  const y2 = tool.y;
  const lift = 80;
  return `M${x1} ${y1} C${x1} ${y1 + lift}, ${x2} ${y2 - lift}, ${x2} ${y2}`;
}

function Port({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={4} className="gport" />;
}

export function AgentGraph() {
  const tools = ["read", "list", "ref", "empty", "cand"];
  const agent = node("agent");

  return (
    <figure className="graph">
      <div className="canvasbar">
        <span className="canvasname">agent workflow</span>
        <span className="canvastools">
          <button type="button" aria-label="Zoom out" disabled>−</button>
          <button type="button" aria-label="Zoom in" disabled>+</button>
          <button type="button" aria-label="Fit to view" disabled>⤢</button>
        </span>
      </div>

      <svg viewBox="0 0 886 300" role="img" aria-labelledby="graphtitle">
        <title id="graphtitle">
          The bundle goes to six deterministic probes, then to an agent that calls five tools in a
          loop, and only what a tool actually ran reaches the report.
        </title>

        <g className="edges">
          {[["bundle", "probes"], ["probes", "agent"], ["agent", "report"]].map(([from, to]) => (
            <path key={`${from}_${to}`} d={mainEdge(from, to)} className="edge" />
          ))}
          {tools.map((tool, index) => (
            <path
              key={tool}
              d={toolEdge(tool)}
              className="edge dash"
              style={{ animationDelay: `${index * 240}ms` }}
            />
          ))}
        </g>

        <g className="ports">
          {[["bundle", "probes"], ["probes", "agent"], ["agent", "report"]].map(([from, to]) => {
            const a = node(from);
            const b = node(to);
            return (
              <g key={`p_${from}`}>
                <Port x={a.x + NODE_W} y={a.y + NODE_H / 2} />
                <Port x={b.x} y={b.y + NODE_H / 2} />
              </g>
            );
          })}
          <Port x={agent.x + NODE_W / 2} y={agent.y + NODE_H} />
          {tools.map((tool) => {
            const entry = node(tool);
            return <Port key={`tp_${tool}`} x={entry.x + NODE_W / 2} y={entry.y} />;
          })}
        </g>

        <g className="nodes">
          {NODES.map((entry) => (
            <g key={entry.id} className={`gnode ${entry.tone}`}>
              <rect
                x={entry.x}
                y={entry.y}
                width={NODE_W}
                height={NODE_H}
                rx={10}
                className="gbox"
              />
              <rect
                x={entry.x + 12}
                y={entry.y + 15}
                width={36}
                height={36}
                rx={9}
                className="gtile"
              />
              <path
                d={GLYPHS[entry.glyph]}
                className="gglyph"
                transform={`translate(${entry.x + 21} ${entry.y + 24}) scale(1.1)`}
              />
              <text x={entry.x + 58} y={entry.y + 30} className="gtitle">
                {entry.title}
              </text>
              <text x={entry.x + 58} y={entry.y + 46} className="gsub">
                {entry.sub}
              </text>
            </g>
          ))}
        </g>

        <text x={443} y={186} className="gloop">
          five tools, and each one executes the bundle
        </text>
      </svg>

      <figcaption>
        The agent has no way to learn anything about behaviour except by calling one of those five
        tools, and every one of them runs the bundle. That is what makes a finding reproducible by
        construction: it cannot assert what it did not run.
      </figcaption>
    </figure>
  );
}
