"""Run the agent over a slice of the corpus and write its trajectories for the site.

    python3 tools/emit_trajectories.py corpus_out/main site/data/trajectories.json [names...]

With no names it picks one bundle per defect class that the deterministic probes are
known to miss, plus a clean control, because those are the cases the agent exists for
and a clean control is the only way to show it does not invent findings.

Needs OPENROUTER_API_KEY. Nothing is written unless a real run produced it.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from shakedown import bundle as bundle_module  # noqa: E402
from shakedown.agent import AgentUnavailable, investigate, model_name  # noqa: E402
from shakedown.orchestrator import Gauntlet  # noqa: E402

WANTED = ("answer_leak", "nondeterministic", "path_escape", None)


def pick(root: Path) -> list[str]:
    labels = json.loads((root / "labels.json").read_text())["bundles"]
    chosen: list[str] = []
    for want in WANTED:
        for name, row in sorted(labels.items()):
            if row.get("defect") == want and name not in chosen:
                chosen.append(name)
                break
    return chosen


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print(__doc__, file=sys.stderr)
        return 2
    root = Path(argv[1])
    out = Path(argv[2])
    names = argv[3:] or pick(root)

    labels = json.loads((root / "labels.json").read_text())["bundles"]

    # Resume: a run that already completed is kept rather than paid for twice. A
    # model call can fail on credit or rate limit half way through a sweep, and
    # losing four minutes of completed work to the fifth failure is not acceptable.
    runs = []
    done = set()
    if out.exists():
        try:
            previous = json.loads(out.read_text())
            for row in previous.get("runs", []):
                if row.get("bundle") in names:
                    runs.append(row)
                    done.add(row["bundle"])
        except (json.JSONDecodeError, OSError):
            pass
    if done:
        print(f"resuming, {len(done)} already recorded: {sorted(done)}", flush=True)

    def save():
        payload = {
            "model": model_name(),
            "runs": runs,
            "totals": {
                "bundles": len(runs),
                "steps": sum(len(run["steps"]) for run in runs),
                "seconds": round(sum(run["seconds"] for run in runs), 1),
                "found": sum(len(run["findings"]) for run in runs),
                "prompt_tokens": sum(run["prompt_tokens"] for run in runs),
                "completion_tokens": sum(run["completion_tokens"] for run in runs),
            },
        }
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, indent=2) + "\n")

    for name in names:
        if name in done:
            continue
        target = bundle_module.load(root / name)
        probes = Gauntlet().run(target)
        print(f"{name}: probes found {len(probes.findings)}, sending the agent in", flush=True)
        started = time.perf_counter()
        try:
            trail, found = investigate(target, known=probes.findings, max_steps=26)
        except AgentUnavailable as error:
            print(str(error), file=sys.stderr)
            if runs:
                save()
                print(f"kept {len(runs)} completed runs in {out}", file=sys.stderr)
            return 3
        row = trail.to_dict()
        row["planted"] = labels.get(name, {}).get("defect")
        row["probe_findings"] = [
            {"defect": f.defect.value, "location": f.location, "summary": f.summary}
            for f in probes.findings
        ]
        runs.append(row)
        save()
        print(
            f"  {len(trail.steps)} steps, {len(found)} findings, "
            f"{time.perf_counter() - started:.1f}s",
            flush=True,
        )

    save()
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
