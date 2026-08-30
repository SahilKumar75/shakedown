"""Fail the build when the site claims a verdict the bench no longer earns.

The site publishes measured results. If a change to a probe moves them and nobody
refreshes the data, the site is stating something untrue about the code beside it.
This turns that into a build failure rather than something a reader has to notice.

The sweep output carries no corpus labels, so the comparison here is per bundle
verdicts, which both files hold and which is what a reader of the site actually
relies on.
"""

from __future__ import annotations

import json
import sys


def verdicts(payload: dict) -> dict[str, str]:
    return {
        str(report.get("bundle")): str(report.get("verdict"))
        for report in payload.get("reports", [])
    }


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: check_claims.py <sweep json> <site reports json>", file=sys.stderr)
        return 2

    with open(argv[1], encoding="utf8") as handle:
        fresh = verdicts(json.load(handle))
    with open(argv[2], encoding="utf8") as handle:
        published = verdicts(json.load(handle))

    missing = sorted(set(published) - set(fresh))
    added = sorted(set(fresh) - set(published))
    moved = sorted(
        name for name in set(fresh) & set(published) if fresh[name] != published[name]
    )

    held_now = sum(1 for value in fresh.values() if value == "hold")
    held_published = sum(1 for value in published.values() if value == "hold")
    print(f"this run   {len(fresh)} bundles, {held_now} held")
    print(f"site says  {len(published)} bundles, {held_published} held")

    if not (missing or added or moved):
        print("\nThe site states what the bench measures.")
        return 0

    for name in moved:
        print(f"  {name}: site says {published[name]}, this run says {fresh[name]}")
    for name in missing:
        print(f"  {name}: on the site, absent from this run")
    for name in added:
        print(f"  {name}: in this run, absent from the site")
    print(
        "\nRe-run tools/emit_reports.py and tools/emit_compare.py, then commit the data.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
