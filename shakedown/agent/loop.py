from __future__ import annotations

import json
import time
from dataclasses import dataclass, field

from ..bundle import Bundle
from ..findings import Defect, Finding, Severity
from .client import Client
from .tools import SCHEMA, Toolbox, bundle_brief

SYSTEM = """You review benchmark task bundles before they are submitted to an expensive
automated pipeline. A bundle holds a problem statement, an artifact, a reference solution
and a verifier that grades a submission and prints a reward.

You hold one rule above every other: report a defect only when you have reproduced it with
a tool call in this session. A suspicion you did not demonstrate is not a finding, and
saying nothing is the correct answer for a healthy bundle. A wrong finding costs the author
the same cycle the review was meant to save.

The deterministic probes have already run and their findings are given to you. Do not
repeat them. Your value is in the classes they cannot reach, which need a candidate written
on purpose to test one idea:

  answer_leak      the expected answers are reachable from material THE SOLVER can see,
                   so a submission can read the answer instead of computing it. Only
                   instruction.md and env/ are shipped into the solver's image;
                   solution/ and tests/ are not. You can read those to review them, but
                   a reference solution you can read is not a leak, because the solver
                   never receives it. If a SHIPPED file holds what a graded case
                   expects, prove it: write a candidate that reads that file, copies it
                   out and does nothing else, and run it
  hardcodable      the verifier accepts a submission that returns fixed values, because it
                   never varies its inputs
  weak_verifier    the verifier passes something that plainly does not do the task
  path_escape      the verifier can be made to grade a file the submission wrote or moved
  nondeterministic the same submission does not always earn the same reward

Work in short steps and do not spend them all reading. Read the verifier first, because it
tells you what is compared and where the cases live, then look at what the submission can
see, then write the shortest candidate that would earn reward without doing the task and
run it. Let the reward decide.

Two candidates that fail teach you more than ten that repeat the same idea. If a candidate
earns no reward, change the idea rather than the wording. Leave yourself steps to finish:
call report as soon as you have either reproduced something or convinced yourself there is
nothing to reproduce, and put the run that proves each finding in its evidence field."""


@dataclass
class Trajectory:
    bundle: str
    model: str
    steps: list[dict] = field(default_factory=list)
    findings: list[dict] = field(default_factory=list)
    verdict: str = "clear"
    seconds: float = 0.0
    calls: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    stopped: str = "reported"

    def to_dict(self) -> dict:
        return {
            "bundle": self.bundle,
            "model": self.model,
            "verdict": self.verdict,
            "seconds": round(self.seconds, 2),
            "calls": self.calls,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "stopped": self.stopped,
            "findings": self.findings,
            "steps": self.steps,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


def _as_finding(raw: dict) -> Finding | None:
    try:
        defect = Defect(raw.get("defect", ""))
    except ValueError:
        return None
    return Finding(
        defect=defect,
        severity=Severity.BLOCKING,
        location=str(raw.get("location", "")),
        summary=str(raw.get("summary", "")),
        evidence=str(raw.get("evidence", "")),
        remedy=str(raw.get("remedy", "")),
        confirmed=True,
        reporter="agent",
    )


KEEP_TAIL = 14


def _trim(messages: list[dict], keep: int = KEEP_TAIL) -> list[dict]:
    """Hold the window down so a long investigation does not cost more every step.

    The two opening messages carry the rules and the bundle, so they always stay. Older
    tool output is replaced by a line saying it happened, which keeps the shape of the
    conversation valid for the API while dropping the bulk the agent has already used.
    """
    if len(messages) <= keep + 2:
        return messages
    head, tail = messages[:2], messages[-keep:]
    while tail and tail[0].get("role") == "tool":
        tail = tail[1:]
    dropped = len(messages) - len(head) - len(tail)
    if dropped <= 0:
        return messages
    marker = {
        "role": "user",
        "content": (
            f"({dropped} earlier messages have been dropped to keep this session cheap. "
            "You have already read the bundle and run what you ran; do not repeat those "
            "calls. Move to a new idea or call report.)"
        ),
    }
    return head + [marker] + tail


def investigate(
    bundle: Bundle,
    known: list[Finding] | None = None,
    max_steps: int = 14,
    timeout: float = 120.0,
    client: Client | None = None,
    on_step=None,
) -> tuple[Trajectory, list[Finding]]:
    """Run one agent over one bundle and return its trajectory and its findings."""
    agent = client or Client()
    box = Toolbox(bundle, timeout=timeout)
    already = "\n".join(
        f"  {f.defect.value} at {f.location}: {f.summary}" for f in (known or [])
    ) or "  none"

    messages = [
        {"role": "system", "content": SYSTEM},
        {
            "role": "user",
            "content": (
                f"{bundle_brief(bundle)}\n\n"
                f"What the deterministic probes already reported:\n{already}\n\n"
                "Investigate what they cannot reach. Reproduce or report nothing."
            ),
        },
    ]

    trail = Trajectory(bundle=bundle.name, model=agent.model)
    started = time.perf_counter()
    found: list[Finding] = []
    nudged = False

    for index in range(max_steps):
        messages = _trim(messages)
        message = agent.complete(messages, tools=SCHEMA)
        seconds = message.pop("_seconds", 0.0)
        calls = message.get("tool_calls") or []
        step = {
            "index": len(trail.steps) + 1,
            "seconds": seconds,
            "thought": (message.get("content") or "").strip(),
            "tool": None,
            "arguments": {},
            "result": "",
        }
        messages.append({k: v for k, v in message.items() if k != "_seconds"})

        if not calls:
            # A model that answers in prose has stopped using its tools, but it has not
            # necessarily finished. Ask once for the report, and only give up if the next
            # turn is prose as well, so a run always ends with a verdict when it can.
            if nudged:
                step["result"] = "answered in prose twice, stopping"
                trail.steps.append(step)
                if on_step:
                    on_step(step)
                trail.stopped = "gave up without reporting"
                break
            nudged = True
            step["result"] = "answered in prose, asked for the report"
            trail.steps.append(step)
            if on_step:
                on_step(step)
            messages.append(
                {
                    "role": "user",
                    "content": (
                        "Call report now. Put in it only what you reproduced with a run in "
                        "this session, and report nothing if nothing reproduced."
                    ),
                }
            )
            continue

        for call in calls:
            function = call.get("function") or {}
            name = function.get("name", "")
            try:
                args = json.loads(function.get("arguments") or "{}")
            except json.JSONDecodeError:
                args = {}

            if name == "report":
                for raw in args.get("findings") or []:
                    finding = _as_finding(raw)
                    if finding is not None:
                        found.append(finding)
                        trail.findings.append(raw)
                trail.verdict = "hold" if found else "clear"
                step.update({"tool": name, "arguments": args, "result": "reported"})
                trail.steps.append(step)
                if on_step:
                    on_step(step)
                trail.seconds = time.perf_counter() - started
                trail.calls = agent.calls
                trail.prompt_tokens = agent.prompt_tokens
                trail.completion_tokens = agent.completion_tokens
                return trail, found

            output = box.call(name, args)
            step = dict(step, index=len(trail.steps) + 1)
            step.update({"tool": name, "arguments": args, "result": output[:2000]})
            trail.steps.append(step)
            if on_step:
                on_step(step)
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call.get("id", ""),
                    "content": output,
                }
            )
    else:
        trail.stopped = f"reached the {max_steps} step ceiling"

    trail.seconds = time.perf_counter() - started
    trail.calls = agent.calls
    trail.prompt_tokens = agent.prompt_tokens
    trail.completion_tokens = agent.completion_tokens
    trail.verdict = "hold" if found else "clear"
    return trail, found
