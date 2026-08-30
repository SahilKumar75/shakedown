from __future__ import annotations

import re

from ..findings import Defect, Finding, Severity
from .base import Context

CLOCK = re.compile(
    r"(time limit|time budget|wall clock|run clock|clock of \w+|runs out of time|"
    r"before the clock|against that clock|budget your compute|your session|session ends|"
    r"when you stop working|minutes remaining|hour budget|allotted time|run out of time|"
    r"\d+ seconds? (of|to) (run|work|compute)|every attempt a run)",
    re.IGNORECASE,
)

SCORING = re.compile(
    r"(partial credit|scores? higher|earn(s)? more points|worth \d+ points|"
    r"graded on a curve|partly right|counts for \d+ percent|scores? the submission|"
    r"reward 1\.0|reward of 1|scored as reward|awards? you reward)",
    re.IGNORECASE,
)


class WordingProbe:
    name = "wording"

    def run(self, ctx: Context) -> list[Finding]:
        text = ctx.bundle.instruction
        found = []

        for pattern, defect_note, remedy in (
            (
                CLOCK,
                "describes the harness run clock",
                "State the deliverable and how it is judged in terms of the files on disk, never in terms of elapsed time.",
            ),
            (
                SCORING,
                "describes the scoring mechanics",
                "Remove the scoring language. Grading is all or nothing and the wording should not imply otherwise.",
            ),
        ):
            match = pattern.search(text)
            if not match:
                continue
            line_number = text[: match.start()].count("\n") + 1
            phrase = match.group(0)
            found.append(
                Finding(
                    defect=Defect.FORBIDDEN_WORDING,
                    severity=Severity.BLOCKING,
                    location=f"instruction.md line {line_number}",
                    summary=f"The instruction {defect_note}, which the static gate rejects.",
                    evidence=f"Line {line_number} contains the phrase {phrase!r}.",
                    remedy=remedy,
                    confirmed=True,
                    reporter=self.name,
                    detail={"phrase": phrase, "line": line_number},
                )
            )
        return found
