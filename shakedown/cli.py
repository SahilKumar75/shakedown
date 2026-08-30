from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import bundle as bundle_module
from .findings import Report
from .orchestrator import Gauntlet


def _held(report: Report, fail_on: str) -> bool:
    if fail_on == "never":
        return False
    if fail_on == "any":
        return bool(report.findings)
    return bool(report.blocking)


def _streamer(quiet: bool):
    if quiet:
        return None

    def announce(target, finding):
        mark = "BLOCK" if finding.severity.value == "blocking" else "note "
        print(
            f"  {mark} {finding.defect.value:20} {finding.location}",
            file=sys.stderr,
            flush=True,
        )

    return announce


def _write_json(path: Path | None, payload) -> None:
    if path is None:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def _run(args: argparse.Namespace) -> int:
    try:
        target = bundle_module.load(args.path)
    except bundle_module.BundleError as error:
        print(f"Shakedown could not read that bundle. {error}", file=sys.stderr)
        return 2
    gauntlet = Gauntlet(timeout=args.timeout, on_finding=_streamer(args.quiet))
    report = gauntlet.run(target)
    if args.format == "json":
        print(report.to_json())
    elif not args.quiet:
        print(report.render())
    _write_json(args.json, report.to_dict())
    return 1 if _held(report, args.fail_on) else 0


def _sweep(args: argparse.Namespace) -> int:
    bundles = bundle_module.discover(args.path)
    if not bundles:
        print(f"No bundles found under {args.path}", file=sys.stderr)
        return 2
    gauntlet = Gauntlet(timeout=args.timeout, on_finding=_streamer(args.quiet))
    held = 0
    reports = []
    for target in bundles:
        report = gauntlet.run(target)
        reports.append(report.to_dict())
        marker = "hold " if report.blocking else "clear"
        names = ", ".join(sorted({f.defect.value for f in report.blocking})) or "none"
        print(f"{marker} {target.name:36} {report.seconds:6.1f}s  {names}")
        held += 1 if _held(report, args.fail_on) else 0
    print(f"\n{held} of {len(bundles)} bundles would be held.")
    _write_json(args.json, {"bundles": len(bundles), "held": held, "reports": reports})
    return 1 if held else 0


def _agent(args: argparse.Namespace) -> int:
    from .agent import AgentUnavailable, investigate

    try:
        target = bundle_module.load(args.path)
    except bundle_module.BundleError as error:
        print(f"Shakedown could not read that bundle. {error}", file=sys.stderr)
        return 2

    known = []
    if not args.alone:
        known = Gauntlet(timeout=args.timeout).run(target).findings

    def announce(step):
        if args.quiet:
            return
        label = step["tool"] or "thinking"
        print(f"  step {step['index']:2}  {label}", file=sys.stderr, flush=True)

    try:
        trail, found = investigate(
            target,
            known=known,
            max_steps=args.max_steps,
            timeout=args.timeout,
            on_step=announce,
        )
    except AgentUnavailable as error:
        print(str(error), file=sys.stderr)
        return 3

    _write_json(args.trajectory, trail.to_dict())
    if args.format == "json":
        print(trail.to_json())
    else:
        print(f"\n{target.name}: the agent took {len(trail.steps)} steps in {trail.seconds:.1f}s")
        print(f"model {trail.model}, {trail.calls} calls, ended because it {trail.stopped}")
        if not found:
            print("It reproduced nothing the probes had not already found.")
        for finding in found:
            print(f"\n  {finding.defect.value} at {finding.location}")
            print(f"  {finding.summary}")
            print(f"  evidence: {finding.evidence}")
    return 1 if found and args.fail_on != "never" else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="shakedown",
        description="Rehearse an expensive benchmark review pipeline locally, before you submit.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    def shared(target):
        target.add_argument("path", type=Path)
        target.add_argument("--timeout", type=float, default=120.0)
        target.add_argument(
            "--json",
            type=Path,
            default=None,
            metavar="PATH",
            help="write the machine readable report here as well",
        )
        target.add_argument(
            "--fail-on",
            dest="fail_on",
            default="blocking",
            choices=["blocking", "any", "never"],
            help="which findings make the command exit non zero",
        )
        target.add_argument(
            "--quiet",
            action="store_true",
            help="print only the summary, for a pipeline log",
        )

    run = sub.add_parser("run", help="inspect one bundle")
    shared(run)
    run.add_argument("--format", default="text", choices=["text", "json"])
    run.set_defaults(handler=_run)

    sweep = sub.add_parser("sweep", help="inspect every bundle in a directory")
    shared(sweep)
    sweep.set_defaults(handler=_sweep)

    agent = sub.add_parser(
        "agent",
        help="send an agent after the classes the deterministic probes cannot reach",
    )
    shared(agent)
    agent.add_argument("--format", default="text", choices=["text", "json"])
    agent.add_argument("--max-steps", dest="max_steps", type=int, default=14)
    agent.add_argument(
        "--trajectory",
        type=Path,
        default=None,
        metavar="PATH",
        help="write the full step by step trajectory here",
    )
    agent.add_argument(
        "--alone",
        action="store_true",
        help="do not run the deterministic probes first",
    )
    agent.set_defaults(handler=_agent)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.handler(args)


if __name__ == "__main__":
    raise SystemExit(main())
