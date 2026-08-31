const NODE_W = 148;
const NODE_H = 58;

interface Node {
  id: string;
  x: number;
  y: number;
  title: string;
  sub: string;
  tone: "input" | "probe" | "brain" | "tool" | "out";
}

const NODES: Node[] = [
  { id: "bundle", x: 8, y: 26, title: "bundle", sub: "task + verifier", tone: "input" },
  { id: "probes", x: 196, y: 26, title: "six probes", sub: "deterministic", tone: "probe" },
  { id: "agent", x: 384, y: 26, title: "agent", sub: "claude, tool loop", tone: "brain" },
  { id: "report", x: 600, y: 26, title: "report", sub: "only what ran", tone: "out" },
  { id: "verdict", x: 784, y: 26, title: "verdict", sub: "hold or clear", tone: "out" },

  { id: "read", x: 8, y: 196, title: "read_file", sub: "instruction, verifier", tone: "tool" },
  { id: "list", x: 180, y: 196, title: "list_files", sub: "what ships", tone: "tool" },
  { id: "ref", x: 352, y: 196, title: "run_reference", sub: "expects 1.0", tone: "tool" },
  { id: "empty", x: 524, y: 196, title: "run_empty", sub: "expects 0.0", tone: "tool" },
  { id: "cand", x: 696, y: 196, title: "run_candidate", sub: "it writes this one", tone: "tool" },
];

function node(id: string) {
  return NODES.find((entry) => entry.id === id) as Node;
}

function straight(from: string, to: string) {
  const a = node(from);
  const b = node(to);
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const mid = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

/** Agent down to a tool, and the same curve is reused for the answer coming back. */
function toTool(toolId: string) {
  const agent = node("agent");
  const tool = node(toolId);
  const x1 = agent.x + NODE_W / 2;
  const y1 = agent.y + NODE_H;
  const x2 = tool.x + NODE_W / 2;
  const y2 = tool.y;
  const lift = 74;
  return `M${x1} ${y1} C${x1} ${y1 + lift}, ${x2} ${y2 - lift}, ${x2} ${y2}`;
}

export function AgentGraph() {
  const tools = ["read", "list", "ref", "empty", "cand"];

  return (
    <figure className="graph">
      <svg viewBox="0 0 940 290" role="img" aria-labelledby="graphtitle">
        <title id="graphtitle">
          The bundle goes to six deterministic probes, then to an agent that calls five
          tools in a loop, and only what a tool actually ran reaches the report.
        </title>

        <defs>
          <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0 0 L7 3.5 L0 7 z" className="arrowhead" />
          </marker>
        </defs>

        <g className="edges">
          <path d={straight("bundle", "probes")} className="edge" markerEnd="url(#arrow)" />
          <path d={straight("probes", "agent")} className="edge" markerEnd="url(#arrow)" />
          <path d={straight("agent", "report")} className="edge" markerEnd="url(#arrow)" />
          <path d={straight("report", "verdict")} className="edge" markerEnd="url(#arrow)" />
          {tools.map((tool, index) => (
            <path
              key={tool}
              d={toTool(tool)}
              className="edge dash"
              style={{ animationDelay: `${index * 260}ms` }}
            />
          ))}
        </g>

        <g className="nodes">
          {NODES.map((entry) => (
            <g key={entry.id} className={`gnode ${entry.tone}`}>
              <rect
                x={entry.x}
                y={entry.y}
                width={NODE_W}
                height={NODE_H}
                rx={9}
                className="gbox"
              />
              <rect
                x={entry.x}
                y={entry.y}
                width={4}
                height={NODE_H}
                className="grail"
              />
              <text x={entry.x + 16} y={entry.y + 24} className="gtitle">
                {entry.title}
              </text>
              <text x={entry.x + 16} y={entry.y + 41} className="gsub">
                {entry.sub}
              </text>
            </g>
          ))}
        </g>

        <text x={468} y={166} className="gloop">
          every claim comes back through a run
        </text>
      </svg>

      <figcaption>
        The agent only learns about behaviour by calling one of the five tools, and each of
        those executes the bundle. That is what makes a finding reproducible by construction:
        it cannot assert anything it did not run.
      </figcaption>
    </figure>
  );
}
