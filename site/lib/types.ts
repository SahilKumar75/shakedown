export type Severity = "blocking" | "advisory";

export type DefectClass =
  | "answer_leak"
  | "oracle_fails"
  | "nop_passes"
  | "weak_verifier"
  | "hardcodable"
  | "nondeterministic"
  | "undetermined_rule"
  | "graceless_failure"
  | "path_escape"
  | "forbidden_wording"
  | "unwitnessed_encoding"
  | "slow_oracle";

export interface Finding {
  defect: DefectClass;
  title: string;
  severity: Severity;
  location: string;
  summary: string;
  evidence: string;
  remedy: string;
  confirmed: boolean;
  reporter: string;
  detail: Record<string, unknown>;
}

export interface Execution {
  action: string;
  reward: number;
  seconds: number;
  exit_code: number;
  reward_line: boolean;
  source_bytes: number;
}

export interface TraceStep {
  probe: string;
  seconds: number;
  executions: Execution[];
  found: DefectClass[];
  error: string;
}

export interface BundleReport {
  bundle: string;
  verdict: "hold" | "clear";
  seconds: number;
  dollars: number;
  findings: Finding[];
  notes: string[];
  trace: TraceStep[];
  injected: DefectClass | null;
  theme: string;
  summary: string;
}

export interface ReportFile {
  corpus: string;
  count: number;
  distribution: Record<string, number>;
  reports: BundleReport[];
}

export interface Outcome {
  detected: number;
  planted: number;
  falseAlarms: number;
  cleanBundles: number;
  seconds: number;
}
