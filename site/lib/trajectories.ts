import payload from "@/data/trajectories.json";

export interface Step {
  index: number;
  seconds: number;
  thought: string;
  tool: string | null;
  arguments: Record<string, unknown>;
  result: string;
}

export interface AgentFinding {
  defect: string;
  location: string;
  summary: string;
  evidence: string;
  remedy: string;
}

export interface Run {
  bundle: string;
  model: string;
  verdict: "hold" | "clear";
  seconds: number;
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  stopped: string;
  findings: AgentFinding[];
  steps: Step[];
  planted: string | null;
  probe_findings: { defect: string; location: string; summary: string }[];
}

export interface TrajectoryFile {
  model: string;
  runs: Run[];
  totals: {
    bundles: number;
    steps: number;
    seconds: number;
    found: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

const EMPTY: TrajectoryFile = {
  model: "",
  runs: [],
  totals: {
    bundles: 0,
    steps: 0,
    seconds: 0,
    found: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
  },
};

/**
 * The agent layer needs a key, so a clone that has only run the deterministic probes
 * has no trajectories to show. That is a normal state, not a build failure, so the
 * file ships empty and the page says so rather than the site refusing to compile.
 */
const loaded = payload as unknown as Partial<TrajectoryFile>;
const file: TrajectoryFile = {
  ...EMPTY,
  ...loaded,
  runs: Array.isArray(loaded?.runs) ? (loaded.runs as Run[]) : [],
  totals: { ...EMPTY.totals, ...(loaded?.totals ?? {}) },
};

export function trajectories(): TrajectoryFile {
  return file;
}

export function hasRuns(): boolean {
  return file.runs.length > 0;
}
