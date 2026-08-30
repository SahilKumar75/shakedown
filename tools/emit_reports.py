from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from shakedown import discover
from shakedown.orchestrator import Gauntlet


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: emit_reports.py <corpus_dir> <output_json>", file=sys.stderr)
        return 2

    corpus_dir = Path(argv[1]).resolve()
    output = Path(argv[2]).resolve()

    labels_path = corpus_dir / "labels.json"
    labels = {}
    distribution = {}
    if labels_path.is_file():
        payload = json.loads(labels_path.read_text(encoding="utf8"))
        labels = payload.get("labels", {})
        distribution = payload.get("distribution", {})

    gauntlet = Gauntlet()
    reports = []
    for bundle in discover(corpus_dir):
        report = gauntlet.run(bundle)
        entry = report.to_dict()
        entry["injected"] = labels.get(bundle.name)
        entry["theme"] = bundle.meta.get("task", {}).get("theme", "")
        entry["summary"] = bundle.meta.get("task", {}).get("summary", "")
        reports.append(entry)
        marker = entry["verdict"]
        print(f"{marker:5} {bundle.name:28} {report.seconds:6.1f}s {entry['injected'] or 'clean'}")

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(
            {
                "corpus": corpus_dir.name,
                "count": len(reports),
                "distribution": distribution,
                "reports": reports,
            },
            indent=2,
        ),
        encoding="utf8",
    )
    print(f"\nwrote {len(reports)} reports to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
