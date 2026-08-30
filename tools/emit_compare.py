from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from shakedown import discover
from shakedown.baseline import HandChecks
from shakedown.orchestrator import Gauntlet


def score(entries: list[dict]) -> dict:
    planted = [e for e in entries if e["injected"]]
    clean = [e for e in entries if not e["injected"]]
    caught = [e for e in planted if e["injected"] in e["defects"]]
    held_clean = [e for e in clean if e["verdict"] == "hold"]
    seconds = sum(e["seconds"] for e in entries)
    return {
        "planted": len(planted),
        "caught": len(caught),
        "clean": len(clean),
        "clean_held": len(held_clean),
        "seconds": round(seconds, 2),
        "recall": round(len(caught) / len(planted), 4) if planted else 0.0,
        "by_class": {},
    }


def by_class(entries: list[dict]) -> dict:
    table: dict[str, dict[str, int]] = {}
    for entry in entries:
        planted = entry["injected"]
        if not planted:
            continue
        row = table.setdefault(planted, {"planted": 0, "caught": 0})
        row["planted"] += 1
        if planted in entry["defects"]:
            row["caught"] += 1
    return table


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: emit_compare.py <corpus_dir> <output_json>", file=sys.stderr)
        return 2

    corpus_dir = Path(argv[1]).resolve()
    output = Path(argv[2]).resolve()

    labels_path = corpus_dir / "labels.json"
    labels = {}
    if labels_path.is_file():
        labels = json.loads(labels_path.read_text(encoding="utf8")).get("labels", {})

    gauntlet = Gauntlet()
    hand = HandChecks()

    baseline_rows = []
    shakedown_rows = []
    per_bundle = []

    for bundle in discover(corpus_dir):
        injected = labels.get(bundle.name)

        hand_report = hand.run(bundle)
        gauntlet_report = gauntlet.run(bundle)

        hand_entry = {
            "bundle": bundle.name,
            "injected": injected,
            "verdict": hand_report.verdict,
            "seconds": hand_report.seconds,
            "defects": sorted({f.defect.value for f in hand_report.findings}),
        }
        shake_entry = {
            "bundle": bundle.name,
            "injected": injected,
            "verdict": gauntlet_report.verdict,
            "seconds": gauntlet_report.seconds,
            "defects": sorted({f.defect.value for f in gauntlet_report.findings}),
        }

        baseline_rows.append(hand_entry)
        shakedown_rows.append(shake_entry)
        per_bundle.append(
            {
                "bundle": bundle.name,
                "injected": injected,
                "baseline_caught": bool(injected and injected in hand_entry["defects"]),
                "shakedown_caught": bool(injected and injected in shake_entry["defects"]),
            }
        )
        print(f"{bundle.name:28} baseline {hand_entry['verdict']:5} shakedown {shake_entry['verdict']}")

    baseline_score = score(baseline_rows)
    shakedown_score = score(shakedown_rows)
    baseline_score["by_class"] = by_class(baseline_rows)
    shakedown_score["by_class"] = by_class(shakedown_rows)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(
            {
                "corpus": corpus_dir.name,
                "baseline": {"name": "hand checks", "score": baseline_score},
                "shakedown": {"name": "shakedown gauntlet", "score": shakedown_score},
                "bundles": per_bundle,
            },
            indent=2,
        ),
        encoding="utf8",
    )
    print(
        f"\nbaseline caught {baseline_score['caught']} of {baseline_score['planted']}, "
        f"shakedown caught {shakedown_score['caught']} of {shakedown_score['planted']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
