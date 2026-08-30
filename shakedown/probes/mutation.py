from __future__ import annotations

from ..findings import Defect, Finding, Severity
from ..runner import run_candidate
from .base import Context

MUTATIONS = (
    (">=", ">", "loosened an inclusive bound"),
    ("<=", "<", "loosened an inclusive bound"),
    (" and ", " or ", "widened a conjunction"),
    ("sorted(", "reversed(", "changed an ordering"),
    ("== 0", "== 1", "shifted a boundary"),
)


class MutationProbe:
    name = "mutation"

    def run(self, ctx: Context) -> list[Finding]:
        bundle = ctx.bundle
        if ctx.oracle().reward < 1.0:
            return []

        source = bundle.solution
        survivors = []
        for find, replace, description in MUTATIONS:
            if find not in source:
                continue
            mutated = source.replace(find, replace, 1)
            if mutated == source:
                continue
            result = run_candidate(bundle, mutated, timeout=ctx.timeout)
            if result.reward >= 1.0:
                survivors.append((find, replace, description))

        case_dir = bundle.tests_root / "cases"
        case_count = len([p for p in case_dir.iterdir() if not p.name.startswith(".")]) if case_dir.is_dir() else 0

        found = []
        if survivors:
            find, replace, description = survivors[0]
            listing = ", ".join(f"{f} to {r}" for f, r, _ in survivors)
            found.append(
                Finding(
                    defect=Defect.HARDCODABLE,
                    severity=Severity.BLOCKING,
                    location="tests/verify.py",
                    summary=(
                        f"{len(survivors)} of the tried edits to the reference solution still earned full "
                        "reward, so the graded cases do not pin the behaviour they claim to."
                    ),
                    evidence=(
                        f"Replacing {find} with {replace} in solution/solve.py {description} and still scored 1.0. "
                        f"Surviving edits: {listing}. Graded cases present: {case_count}."
                    ),
                    remedy="Add graded cases that separate the mutated behaviour from the correct one, so every guard in the reference is load bearing.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"survivors": len(survivors), "cases": case_count},
                )
            )
        elif case_count == 1:
            found.append(
                Finding(
                    defect=Defect.HARDCODABLE,
                    severity=Severity.ADVISORY,
                    location="tests/cases",
                    summary="A single graded case can be satisfied by returning one stored answer.",
                    evidence=f"tests/cases holds {case_count} case.",
                    remedy="Add unseen cases that vary the inputs so a stored answer cannot pass.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"cases": case_count},
                )
            )
        return found
