import payload from "@/data/reports.json";
import type { BundleReport, DefectClass, Outcome, ReportFile } from "./types";

const file = payload as unknown as ReportFile;

export function reportFile(): ReportFile {
  return file;
}

export function allReports(): BundleReport[] {
  return [...file.reports].sort((left, right) => left.bundle.localeCompare(right.bundle));
}

export function reportFor(name: string): BundleReport | undefined {
  return file.reports.find((entry) => entry.bundle === name);
}

export function caught(report: BundleReport): boolean {
  if (!report.injected) {
    return false;
  }
  return report.findings.some((finding) => finding.defect === report.injected);
}

export function falseAlarm(report: BundleReport): boolean {
  return !report.injected && report.verdict === "hold";
}

export function outcome(): Outcome {
  const reports = file.reports;
  const planted = reports.filter((entry) => entry.injected).length;
  const detected = reports.filter((entry) => caught(entry)).length;
  const cleanBundles = reports.filter((entry) => !entry.injected).length;
  const falseAlarms = reports.filter((entry) => falseAlarm(entry)).length;
  const seconds = reports.reduce((total, entry) => total + entry.seconds, 0);
  return { detected, planted, falseAlarms, cleanBundles, seconds };
}

export function defectLabel(defect: DefectClass | null): string {
  if (!defect) {
    return "clean control";
  }
  return defect.split("_").join(" ");
}
