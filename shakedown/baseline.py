from __future__ import annotations

import time

from .bundle import Bundle
from .findings import Defect, Finding, Report, Severity
from .runner import run_nop, run_oracle


class HandChecks:
    name = "hand_checks"

    def run(self, bundle: Bundle, timeout: float = 120.0) -> Report:
        started = time.perf_counter()
        findings = []

        oracle = run_oracle(bundle, timeout=timeout)
        nop = run_nop(bundle, timeout=timeout)

        if oracle.reward < 1.0:
            findings.append(
                Finding(
                    defect=Defect.ORACLE_FAILS,
                    severity=Severity.BLOCKING,
                    location="solution/solve.py",
                    summary="The reference solution did not earn full reward.",
                    evidence=f"verify.py reported reward={oracle.reward}.",
                    remedy="Fix the reference or the expectations until the reference passes.",
                    confirmed=True,
                    reporter=self.name,
                )
            )

        if nop.reward > 0.0:
            findings.append(
                Finding(
                    defect=Defect.NOP_PASSES,
                    severity=Severity.BLOCKING,
                    location="tests/verify.py",
                    summary="An empty submission earned reward.",
                    evidence=f"An empty candidate scored reward={nop.reward}.",
                    remedy="Assert on the produced output so a missing result scores zero.",
                    confirmed=True,
                    reporter=self.name,
                )
            )

        return Report(
            bundle=bundle.name,
            findings=findings,
            seconds=time.perf_counter() - started,
            notes=[f"oracle reward {oracle.reward}, nop reward {nop.reward}"],
        )
