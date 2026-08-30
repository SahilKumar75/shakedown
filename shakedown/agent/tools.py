from __future__ import annotations

import json
from pathlib import Path

from ..bundle import Bundle
from ..runner import run_candidate, run_nop, run_oracle

MAX_CHARS = 2600


def _clip(text: str, limit: int = MAX_CHARS) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + f"\n... clipped, {len(text) - limit} more characters"


SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": (
                "List every file in the bundle, with its size and whether the agent under "
                "review would be able to see it or only the verifier can."
            ),
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read one file from the bundle by its path relative to the bundle root.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "e.g. tests/verify.py"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_reference",
            "description": (
                "Run the bundle's own reference solution through the verifier and return the "
                "reward it earns. A healthy bundle returns 1.0."
            ),
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_empty",
            "description": (
                "Run an empty submission that does nothing through the verifier. A healthy "
                "bundle returns 0.0, because doing nothing must not earn reward."
            ),
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_candidate",
            "description": (
                "Run a candidate submission you write yourself through the bundle's verifier "
                "and return its reward, exit code and output. This is how a suspicion becomes "
                "a demonstration: write the shortest program that would earn reward without "
                "doing the task, and see whether the verifier accepts it."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "source": {
                        "type": "string",
                        "description": "Complete Python source for the candidate submission.",
                    },
                    "why": {
                        "type": "string",
                        "description": "One line saying what this run would prove if it passed.",
                    },
                },
                "required": ["source", "why"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "report",
            "description": (
                "Finish. Report only defects you actually reproduced with a run above, and "
                "report none at all if nothing reproduced."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "findings": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "defect": {
                                    "type": "string",
                                    "enum": [
                                        "answer_leak",
                                        "hardcodable",
                                        "weak_verifier",
                                        "nondeterministic",
                                        "path_escape",
                                        "undetermined_rule",
                                    ],
                                },
                                "location": {"type": "string"},
                                "summary": {"type": "string"},
                                "evidence": {
                                    "type": "string",
                                    "description": "The run that proves it, and what it returned.",
                                },
                                "remedy": {"type": "string"},
                            },
                            "required": ["defect", "location", "summary", "evidence", "remedy"],
                        },
                    },
                    "verdict": {"type": "string", "enum": ["hold", "clear"]},
                },
                "required": ["findings", "verdict"],
            },
        },
    },
]


class Toolbox:
    """The tools the agent is allowed to use, each of which runs real code.

    The agent cannot assert a defect it has not demonstrated, because the only way it
    can learn anything about behaviour is to execute the bundle through these calls.
    """

    def __init__(self, bundle: Bundle, timeout: float = 120.0):
        self.bundle = bundle
        self.timeout = timeout
        self.runs: list[dict] = []
        self._seen: dict[tuple[str, str], str] = {}

    def call(self, name: str, args: dict) -> str:
        handler = getattr(self, f"_{name}", None)
        if handler is None:
            return f"There is no tool called {name}."
        # Repeating a call verbatim cannot teach the agent anything it was not already
        # told, and every repeat costs a step it will want at the end. Hand back the
        # first answer with a nudge rather than running the bundle again.
        key = (name, json.dumps(args, sort_keys=True, default=str))
        if key in self._seen:
            return (
                self._seen[key]
                + "\n\n(You already made this exact call. Nothing has changed since. "
                "Try a different idea, or call report.)"
            )
        try:
            answer = handler(args)
        except Exception as error:  # a tool failure is data for the agent, not a crash
            answer = f"{type(error).__name__}: {error}"
        self._seen[key] = answer
        return answer

    # ------------------------------------------------------------------ reading

    def _list_files(self, args: dict) -> str:
        graded = {p.resolve() for p in self.bundle.graded_files()}
        lines = []
        for path in sorted(self.bundle.root.rglob("*")):
            if not path.is_file() or "__pycache__" in path.parts:
                continue
            where = "verifier only" if path.resolve() in graded else "visible to the agent"
            lines.append(
                f"{path.relative_to(self.bundle.root)}  {path.stat().st_size} bytes  {where}"
            )
        return "\n".join(lines)

    def _read_file(self, args: dict) -> str:
        rel = str(args.get("path", "")).strip()
        target = (self.bundle.root / rel).resolve()
        if not str(target).startswith(str(self.bundle.root.resolve())):
            return "That path is outside the bundle."
        if not target.is_file():
            return f"{rel} is not a file in this bundle."
        return _clip(target.read_text(encoding="utf8", errors="replace"))

    # ------------------------------------------------------------------ running

    def _record(self, action: str, result, note: str = "") -> str:
        self.runs.append(
            {
                "action": action,
                "reward": result.reward,
                "seconds": round(result.seconds, 3),
                "exit_code": result.exit_code,
                "timed_out": result.timed_out,
                "note": note,
            }
        )
        head = f"reward={result.reward} exit={result.exit_code} in {result.seconds:.2f}s"
        tail = _clip((result.stdout or "") + (result.stderr or ""), 900)
        return f"{head}\n{tail}"

    def _run_reference(self, args: dict) -> str:
        return self._record("reference", run_oracle(self.bundle, timeout=self.timeout))

    def _run_empty(self, args: dict) -> str:
        return self._record("empty", run_nop(self.bundle, timeout=self.timeout))

    def _run_candidate(self, args: dict) -> str:
        source = str(args.get("source", ""))
        if not source.strip():
            return "A candidate needs source to run."
        result = run_candidate(self.bundle, source, timeout=self.timeout)
        return self._record("candidate", result, str(args.get("why", "")))

    def _report(self, args: dict) -> str:
        return "reported"


def bundle_brief(bundle: Bundle) -> str:
    files = []
    for path in sorted(bundle.root.rglob("*")):
        if path.is_file() and "__pycache__" not in path.parts:
            files.append(str(path.relative_to(bundle.root)))
    listing = "\n".join(f"  {name}" for name in files)
    return f"Bundle {bundle.name} at {Path(bundle.root).name}\n{listing}"
