from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any


class Severity(str, Enum):
    BLOCKING = "blocking"
    ADVISORY = "advisory"


class Defect(str, Enum):
    ANSWER_LEAK = "answer_leak"
    ORACLE_FAILS = "oracle_fails"
    NOP_PASSES = "nop_passes"
    WEAK_VERIFIER = "weak_verifier"
    HARDCODABLE = "hardcodable"
    NONDETERMINISTIC = "nondeterministic"
    UNDETERMINED_RULE = "undetermined_rule"
    GRACELESS_FAILURE = "graceless_failure"
    PATH_ESCAPE = "path_escape"
    FORBIDDEN_WORDING = "forbidden_wording"
    UNWITNESSED_ENCODING = "unwitnessed_encoding"
    SLOW_ORACLE = "slow_oracle"


DEFECT_TITLES = {
    Defect.ANSWER_LEAK: "Expected answer reachable from agent visible material",
    Defect.ORACLE_FAILS: "Reference solution does not earn full reward",
    Defect.NOP_PASSES: "Empty submission earns reward",
    Defect.WEAK_VERIFIER: "Verifier accepts a submission that does not do the work",
    Defect.HARDCODABLE: "Graded cases too narrow to force a general solution",
    Defect.NONDETERMINISTIC: "Graded material varies between identical runs",
    Defect.UNDETERMINED_RULE: "Decisive rule is not derivable from agent visible material",
    Defect.GRACELESS_FAILURE: "Failing path does not record a zero reward",
    Defect.PATH_ESCAPE: "Graded output path can be redirected outside the sandbox",
    Defect.FORBIDDEN_WORDING: "Instruction describes harness timing or scoring mechanics",
    Defect.UNWITNESSED_ENCODING: "Graded cases use encodings the shipped material never shows",
    Defect.SLOW_ORACLE: "Reference solution runs past the review budget",
}


@dataclass
class Finding:
    defect: Defect
    severity: Severity
    location: str
    summary: str
    evidence: str
    remedy: str
    confirmed: bool = False
    reporter: str = ""
    detail: dict[str, Any] = field(default_factory=dict)

    @property
    def title(self) -> str:
        return DEFECT_TITLES[self.defect]

    def to_dict(self) -> dict[str, Any]:
        out = asdict(self)
        out["defect"] = self.defect.value
        out["severity"] = self.severity.value
        out["title"] = self.title
        return out


@dataclass
class Report:
    bundle: str
    findings: list[Finding] = field(default_factory=list)
    seconds: float = 0.0
    dollars: float = 0.0
    notes: list[str] = field(default_factory=list)

    @property
    def blocking(self) -> list[Finding]:
        return [f for f in self.findings if f.severity is Severity.BLOCKING]

    @property
    def verdict(self) -> str:
        return "hold" if self.blocking else "clear"

    def defects(self) -> set[Defect]:
        return {f.defect for f in self.findings}

    def to_dict(self) -> dict[str, Any]:
        return {
            "bundle": self.bundle,
            "verdict": self.verdict,
            "seconds": round(self.seconds, 3),
            "dollars": round(self.dollars, 6),
            "findings": [f.to_dict() for f in self.findings],
            "notes": self.notes,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)

    def render(self) -> str:
        lines = [f"Shakedown report for {self.bundle}", ""]
        if not self.findings:
            lines.append("No defects found. The bundle is clear to submit.")
            lines.append("")
        for index, finding in enumerate(self.findings, start=1):
            mark = "BLOCKING" if finding.severity is Severity.BLOCKING else "advisory"
            stamp = "reproduced" if finding.confirmed else "suspected"
            lines.append(f"{index}. [{mark}] {finding.title}")
            lines.append(f"   defect   {finding.defect.value} ({stamp}, found by {finding.reporter})")
            lines.append(f"   where    {finding.location}")
            lines.append(f"   what     {finding.summary}")
            lines.append(f"   evidence {finding.evidence}")
            lines.append(f"   fix      {finding.remedy}")
            lines.append("")
        lines.append(f"Verdict {self.verdict} in {self.seconds:.1f} seconds for {self.dollars:.4f} dollars.")
        return "\n".join(lines)
