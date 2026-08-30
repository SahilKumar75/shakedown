from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import bundle as bundle_module
from .orchestrator import Gauntlet


def _run(args: argparse.Namespace) -> int:
    try:
        target = bundle_module.load(args.path)
    except bundle_module.BundleError as error:
        print(f"Shakedown could not read that bundle. {error}", file=sys.stderr)
        return 2
    report = Gauntlet(timeout=args.timeout).run(target)
    if args.format == "json":
        print(report.to_json())
    else:
        print(report.render())
    return 1 if report.blocking else 0


def _sweep(args: argparse.Namespace) -> int:
    bundles = bundle_module.discover(args.path)
    if not bundles:
        print(f"No bundles found under {args.path}", file=sys.stderr)
        return 2
    gauntlet = Gauntlet(timeout=args.timeout)
    held = 0
    for target in bundles:
        report = gauntlet.run(target)
        marker = "hold " if report.blocking else "clear"
        names = ", ".join(sorted({f.defect.value for f in report.blocking})) or "none"
        print(f"{marker} {target.name:36} {report.seconds:6.1f}s  {names}")
        held += 1 if report.blocking else 0
    print(f"\n{held} of {len(bundles)} bundles would be held.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="shakedown",
        description="Rehearse an expensive benchmark review pipeline locally, before you submit.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="inspect one bundle")
    run.add_argument("path", type=Path)
    run.add_argument("format", nargs="?", default="text", choices=["text", "json"])
    run.add_argument("timeout", nargs="?", type=float, default=120.0)
    run.set_defaults(handler=_run)

    sweep = sub.add_parser("sweep", help="inspect every bundle in a directory")
    sweep.add_argument("path", type=Path)
    sweep.add_argument("timeout", nargs="?", type=float, default=120.0)
    sweep.set_defaults(handler=_sweep)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.handler(args)


if __name__ == "__main__":
    raise SystemExit(main())
