from __future__ import annotations

import time

from .bundle import Bundle
from .findings import Finding, Report
from .probes import DETERMINISTIC_PROBES, Context
from .runner import start_recording, stop_recording


def _key(finding: Finding) -> tuple[str, str]:
    return (finding.defect.value, finding.location)


def _rank(finding: Finding) -> tuple[int, int, str]:
    return (
        0 if finding.severity.value == "blocking" else 1,
        0 if finding.confirmed else 1,
        finding.defect.value,
    )


class Gauntlet:
    def __init__(self, probes=None, timeout: float = 120.0):
        self.probes = list(probes) if probes is not None else list(DETERMINISTIC_PROBES)
        self.timeout = timeout

    def run(self, bundle: Bundle) -> Report:
        started = time.perf_counter()
        ctx = Context(bundle=bundle, timeout=self.timeout)
        collected: dict[tuple[str, str], Finding] = {}
        trace = []

        for probe in self.probes:
            probe_started = time.perf_counter()
            executions = start_recording()
            produced = []
            error_note = ""
            try:
                for finding in probe.run(ctx):
                    produced.append(finding)
                    key = _key(finding)
                    existing = collected.get(key)
                    if existing is None or (not existing.confirmed and finding.confirmed):
                        collected[key] = finding
            except Exception as error:
                error_note = f"{type(error).__name__}: {error}"
                ctx.note(f"probe {probe.name} stopped early: {error_note}")
            captured = stop_recording()
            trace.append(
                {
                    "probe": probe.name,
                    "seconds": round(time.perf_counter() - probe_started, 3),
                    "executions": captured,
                    "found": [finding.defect.value for finding in produced],
                    "error": error_note,
                }
            )

        findings = sorted(collected.values(), key=_rank)
        report = Report(
            bundle=bundle.name,
            findings=findings,
            seconds=time.perf_counter() - started,
            dollars=ctx.dollars,
            notes=ctx.notes,
        )
        report.trace = trace
        return report
