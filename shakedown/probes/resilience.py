from __future__ import annotations

from ..findings import Defect, Finding, Severity
from ..runner import REWARD_PATTERN, run_candidate
from .base import Context

CRASHING = (
    "import sys\n"
    "\n"
    "if __name__ == '__main__':\n"
    "    raise RuntimeError('candidate failed while working')\n"
)

REDIRECT_TEMPLATE = (
    "import os\n"
    "import sys\n"
    "import tempfile\n"
    "\n"
    "REFERENCE = {source!r}\n"
    "\n"
    "if __name__ == '__main__':\n"
    "    given_output = sys.argv[2]\n"
    "    elsewhere = tempfile.mkdtemp(prefix='outside_')\n"
    "    real_output = os.path.join(elsewhere, 'answer')\n"
    "    sys.argv = [sys.argv[0], sys.argv[1], real_output]\n"
    "    exec(compile(REFERENCE, 'reference', 'exec'), {{'__name__': '__main__'}})\n"
    "    if os.path.exists(given_output):\n"
    "        os.remove(given_output)\n"
    "    os.symlink(real_output, given_output)\n"
)


class ResilienceProbe:
    name = "resilience"

    def run(self, ctx: Context) -> list[Finding]:
        bundle = ctx.bundle
        found = []

        crashed = run_candidate(bundle, CRASHING, timeout=ctx.timeout)
        reported = bool(REWARD_PATTERN.search(crashed.stdout + crashed.stderr))
        if not reported or crashed.exit_code != 0:
            reason = "print no reward line" if not reported else f"exit with code {crashed.exit_code}"
            found.append(
                Finding(
                    defect=Defect.GRACELESS_FAILURE,
                    severity=Severity.BLOCKING,
                    location="tests/verify.py",
                    summary=(
                        "When a candidate fails part way the verifier does not record a zero, "
                        "so a genuine failure is indistinguishable from a broken harness."
                    ),
                    evidence=f"A candidate that raises on start up made the verifier {reason}.",
                    remedy="Wrap the graded run so every path, including exceptions, records a reward and exits cleanly.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"exit_code": crashed.exit_code, "reward_line": reported},
                )
            )

        if ctx.oracle().reward >= 1.0:
            redirect = REDIRECT_TEMPLATE.format(source=bundle.solution)
            escaped = run_candidate(bundle, redirect, timeout=ctx.timeout)
            if escaped.reward >= 1.0:
                found.append(
                    Finding(
                        defect=Defect.PATH_ESCAPE,
                        severity=Severity.BLOCKING,
                        location="tests/verify.py",
                        summary=(
                            "The graded output path can be a link to a file outside the case directory "
                            "and the verifier still reads it, so a submission controls where graded bytes live."
                        ),
                        evidence="A candidate that wrote its answer to a directory outside the case tree and left a link behind scored 1.0.",
                        remedy="Reject a graded path that is a link, and require the resolved path to stay inside the case directory.",
                        confirmed=True,
                        reporter=self.name,
                        detail={"reward": escaped.reward},
                    )
                )
        return found
