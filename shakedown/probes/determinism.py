from __future__ import annotations

import re

from ..findings import Defect, Finding, Severity
from ..runner import run_oracle
from .base import Context

UNSEEDED = (
    (re.compile(r"random\.SystemRandom"), "random.SystemRandom cannot be seeded"),
    (re.compile(r"os\.urandom"), "os.urandom draws fresh entropy on every run"),
    (re.compile(r"secrets\."), "the secrets module draws fresh entropy on every run"),
    (re.compile(r"uuid\.uuid4"), "uuid4 changes on every run"),
    (re.compile(r"time\.time\(\)"), "the wall clock changes on every run"),
)

SEEDED = re.compile(r"(random\.seed\(|Random\(\s*\d|default_rng\(\s*\d|manual_seed\()")


class DeterminismProbe:
    name = "determinism"

    def run(self, ctx: Context) -> list[Finding]:
        bundle = ctx.bundle
        found = []

        graded_sources = []
        for path in bundle.graded_files():
            if path.suffix != ".py":
                continue
            try:
                graded_sources.append((path, path.read_text(encoding="utf8")))
            except (UnicodeDecodeError, OSError):
                continue

        static_hits = []
        for path, text in graded_sources:
            for pattern, reason in UNSEEDED:
                if pattern.search(text) and not SEEDED.search(text):
                    static_hits.append((path, reason))

        first = ctx.oracle()
        if first.reward < 1.0:
            return []
        second = run_oracle(bundle, timeout=ctx.timeout)
        drifted = second.reward != first.reward

        if drifted:
            found.append(
                Finding(
                    defect=Defect.NONDETERMINISTIC,
                    severity=Severity.BLOCKING,
                    location="tests/verify.py",
                    summary="The same reference solution scored differently on two identical runs.",
                    evidence=f"Run one scored {first.reward}, run two scored {second.reward}, with no change in between.",
                    remedy="Seed every source of randomness in the graded path with a fixed constant so the same submission always scores the same.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"first": first.reward, "second": second.reward},
                )
            )
        elif static_hits:
            path, reason = static_hits[0]
            found.append(
                Finding(
                    defect=Defect.NONDETERMINISTIC,
                    severity=Severity.BLOCKING,
                    location=str(path.relative_to(bundle.root)),
                    summary="The graded path draws randomness that cannot be reproduced, so scores can drift between runs.",
                    evidence=f"{reason}, and no fixed seed is set in the same file.",
                    remedy="Seed every source of randomness in the graded path with a fixed constant.",
                    confirmed=False,
                    reporter=self.name,
                    detail={"reason": reason},
                )
            )
        return found
