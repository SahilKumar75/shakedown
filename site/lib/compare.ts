import payload from "@/data/compare.json";

export interface ClassRow {
  planted: number;
  caught: number;
}

export interface Score {
  planted: number;
  caught: number;
  clean: number;
  clean_held: number;
  seconds: number;
  recall: number;
  by_class: Record<string, ClassRow>;
}

export interface Arm {
  name: string;
  score: Score;
}

export interface CompareFile {
  corpus: string;
  baseline: Arm;
  shakedown: Arm;
  bundles: {
    bundle: string;
    injected: string | null;
    baseline_caught: boolean;
    shakedown_caught: boolean;
  }[];
}

const file = payload as unknown as CompareFile;

export function comparison(): CompareFile {
  return file;
}

export function classNames(): string[] {
  return Array.from(
    new Set([
      ...Object.keys(file.baseline.score.by_class),
      ...Object.keys(file.shakedown.score.by_class),
    ]),
  ).sort();
}
