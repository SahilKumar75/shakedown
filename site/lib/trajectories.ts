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

const file = payload as unknown as TrajectoryFile;

export function trajectories(): TrajectoryFile {
  return file;
}
