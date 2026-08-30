from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

from ..bundle import Bundle
from ..findings import Finding
from ..runner import RunResult, run_nop, run_oracle


@dataclass
class Context:
    bundle: Bundle
    timeout: float = 120.0
    cache: dict[str, RunResult] = field(default_factory=dict)
    dollars: float = 0.0
    notes: list[str] = field(default_factory=list)

    def oracle(self) -> RunResult:
        if "oracle" not in self.cache:
            self.cache["oracle"] = run_oracle(self.bundle, timeout=self.timeout)
        return self.cache["oracle"]

    def nop(self) -> RunResult:
        if "nop" not in self.cache:
            self.cache["nop"] = run_nop(self.bundle, timeout=self.timeout)
        return self.cache["nop"]

    def note(self, message: str) -> None:
        self.notes.append(message)


class Probe(Protocol):
    name: str

    def run(self, ctx: Context) -> list[Finding]: ...
