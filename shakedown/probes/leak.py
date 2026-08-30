from __future__ import annotations

import re

from ..findings import Defect, Finding, Severity
from .base import Context

TOKEN = re.compile(r"[\w.]{8,}")

COMMON = {
    "instruction",
    "solution",
    "candidate",
    "expected",
    "argparse",
    "pathlib",
    "__main__",
    "readtext",
    "read_text",
    "write_text",
    "json.dumps",
    "json.loads",
    "sys.argv",
    "utf8",
    "output_path",
    "input_path",
}


def _tokens(text: str) -> set[str]:
    return {t for t in TOKEN.findall(text) if t.lower() not in COMMON and not t.isdigit()}


class LeakProbe:
    name = "leak"

    def run(self, ctx: Context) -> list[Finding]:
        bundle = ctx.bundle
        graded = bundle.graded_files()
        if not graded:
            return []

        graded_text = {}
        for path in graded:
            if path.suffix in {".pyc"}:
                continue
            try:
                graded_text[path] = path.read_text(encoding="utf8")
            except (UnicodeDecodeError, OSError):
                continue

        expectation_tokens: dict[str, list] = {}
        for path, text in graded_text.items():
            marker = path.name.lower()
            weight = 2 if any(k in marker for k in ("expected", "answer", "label", "case", "truth")) else 1
            for token in _tokens(text):
                expectation_tokens.setdefault(token, []).append((path, weight))

        if not expectation_tokens:
            return []

        found = []
        for visible in bundle.visible_files():
            try:
                body = visible.read_text(encoding="utf8")
            except (UnicodeDecodeError, OSError):
                continue
            hits = []
            for token in _tokens(body):
                sources = expectation_tokens.get(token)
                if not sources:
                    continue
                if any(weight == 2 for _, weight in sources):
                    hits.append((token, sources[0][0]))
            if len(hits) < 3:
                continue
            hits.sort(key=lambda item: len(item[0]), reverse=True)
            sample = ", ".join(token for token, _ in hits[:5])
            origin = hits[0][1].relative_to(bundle.root)
            found.append(
                Finding(
                    defect=Defect.ANSWER_LEAK,
                    severity=Severity.BLOCKING,
                    location=str(visible.relative_to(bundle.root)),
                    summary=(
                        "Material the solver can read repeats values that only the graded "
                        "expectations should contain, so the answer can be copied rather than derived."
                    ),
                    evidence=(
                        f"{len(hits)} values shared with {origin}, including {sample}."
                    ),
                    remedy="Move the expectations out of the solver visible tree and regenerate any shipped sample from inputs alone.",
                    confirmed=True,
                    reporter=self.name,
                    detail={"shared": len(hits), "origin": str(origin)},
                )
            )
        return found
