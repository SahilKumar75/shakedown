from __future__ import annotations

import json
import platform
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def timed(label: str, command: list[str], display: str) -> dict:
    started = time.perf_counter()
    proc = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    elapsed = time.perf_counter() - started
    print(f"{label:22} {elapsed:7.2f}s exit {proc.returncode}")
    return {
        "label": label,
        "command": display,
        "seconds": round(elapsed, 2),
        "exit_code": proc.returncode,
    }


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="repro_") as tmp:
        corpus = Path(tmp) / "corpus"
        reports = Path(tmp) / "reports.json"
        compare = Path(tmp) / "compare.json"

        steps = [
            timed(
                "generate corpus",
                [sys.executable, "corpus/generate.py", str(corpus), "24", "7"],
                "python3 corpus/generate.py corpus_out 24 7",
            ),
            timed(
                "run gauntlet",
                [sys.executable, "tools/emit_reports.py", str(corpus), str(reports)],
                "python3 tools/emit_reports.py corpus_out site/data/reports.json",
            ),
            timed(
                "run comparison",
                [sys.executable, "tools/emit_compare.py", str(corpus), str(compare)],
                "python3 tools/emit_compare.py corpus_out site/data/compare.json",
            ),
        ]

    payload = {
        "machine": {
            "python": platform.python_version(),
            "platform": platform.platform(),
            "processor": platform.machine(),
        },
        "steps": steps,
        "total_seconds": round(sum(step["seconds"] for step in steps), 2),
        "dollars": 0.0,
    }

    target = ROOT / "site" / "data" / "repro.json"
    target.write_text(json.dumps(payload, indent=2), encoding="utf8")
    print(f"\ntotal {payload['total_seconds']}s, wrote {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
