from __future__ import annotations

from ..findings import Defect, Finding, Severity
from .base import Context


class ExecutionProbe:
    name = "execution"

    def run(self, ctx: Context) -> list[Finding]:
        found = []
        oracle = ctx.oracle()
        nop = ctx.nop()
        budget = ctx.bundle.budget_seconds()

        if oracle.reward < 1.0:
            tail = (oracle.stderr or oracle.stdout).strip().splitlines()
            excerpt = tail[-1] if tail else "no output"
            found.append(
                Finding(
                    defect=Defect.ORACLE_FAILS,
                    severity=Severity.BLOCKING,
                    location="solution/solve.py",
                    summary=(
                        "The shipped reference solution scored "
                        f"{oracle.reward} where the pipeline requires 1.0, so review stops "
                        "before any probe runs."
                    ),
                    evidence=f"verify.py reported reward={oracle.reward} in {oracle.seconds:.2f}s. Last line: {excerpt}",
                    remedy="Fix the reference solution or the graded expectations until the reference earns full reward on every case.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"reward": oracle.reward, "seconds": oracle.seconds},
                )
            )

        if nop.reward > 0.0:
            found.append(
                Finding(
                    defect=Defect.NOP_PASSES,
                    severity=Severity.BLOCKING,
                    location="tests/verify.py",
                    summary=(
                        "A candidate that does nothing at all scored "
                        f"{nop.reward}, so the verifier is not testing the work."
                    ),
                    evidence=f"An empty candidate that exits immediately scored reward={nop.reward}.",
                    remedy="Assert on the produced output. A missing or empty result must score zero.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"reward": nop.reward},
                )
            )

        if oracle.timed_out:
            found.append(
                Finding(
                    defect=Defect.SLOW_ORACLE,
                    severity=Severity.BLOCKING,
                    location="solution/solve.py",
                    summary="The reference solution did not finish inside the run timeout.",
                    evidence=f"Execution was cut off after {oracle.seconds:.1f}s.",
                    remedy="Make the reference faster or raise the declared budget so the pipeline can validate it.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"seconds": oracle.seconds},
                )
            )
        elif oracle.reward >= 1.0 and oracle.seconds > budget:
            found.append(
                Finding(
                    defect=Defect.SLOW_ORACLE,
                    severity=Severity.ADVISORY,
                    location="task.toml",
                    summary=(
                        f"The reference took {oracle.seconds:.1f}s against a declared budget of {budget:.0f}s."
                    ),
                    evidence=f"Measured {oracle.seconds:.2f}s, declared oracle_seconds={budget:.0f}.",
                    remedy="Raise the declared budget or speed up the reference. A slower review machine will fail this outright.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"seconds": oracle.seconds, "budget": budget},
                )
            )

        ctx.note(f"oracle reward {oracle.reward} in {oracle.seconds:.2f}s, nop reward {nop.reward}")
        return found
