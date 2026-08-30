from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

from .bundle import Bundle

REWARD_PATTERN = re.compile(r"reward\s*=\s*(\d*\.?\d+)")

NOP_SOURCE = "import sys\n\nif __name__ == '__main__':\n    sys.exit(0)\n"

_recorder: list[dict] | None = None


def start_recording() -> list[dict]:
    global _recorder
    _recorder = []
    return _recorder


def stop_recording() -> list[dict]:
    global _recorder
    captured = _recorder or []
    _recorder = None
    return captured


def _record(action: str, detail: dict) -> None:
    if _recorder is not None:
        _recorder.append({"action": action, **detail})


@dataclass
class RunResult:
    reward: float
    seconds: float
    exit_code: int
    stdout: str
    stderr: str
    timed_out: bool = False

    @property
    def passed(self) -> bool:
        return self.reward >= 1.0


def _parse_reward(text: str) -> float:
    matches = REWARD_PATTERN.findall(text)
    if not matches:
        return 0.0
    try:
        return float(matches[-1])
    except ValueError:
        return 0.0


def run_candidate(bundle: Bundle, source: str, timeout: float = 120.0) -> RunResult:
    with tempfile.TemporaryDirectory(prefix="shakedown_") as tmp:
        work = Path(tmp) / bundle.root.name
        shutil.copytree(bundle.root, work)
        candidate = work / "candidate_solve.py"
        candidate.write_text(source, encoding="utf8")
        started = time.perf_counter()
        try:
            proc = subprocess.run(
                [sys.executable, str(work / "tests" / "verify.py"), str(candidate)],
                cwd=work,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired as expired:
            elapsed = time.perf_counter() - started
            return RunResult(
                reward=0.0,
                seconds=elapsed,
                exit_code=124,
                stdout=expired.stdout.decode("utf8", "replace") if expired.stdout else "",
                stderr=expired.stderr.decode("utf8", "replace") if expired.stderr else "",
                timed_out=True,
            )
        elapsed = time.perf_counter() - started
        blob = proc.stdout + proc.stderr
        reward = _parse_reward(blob)
        _record(
            "run_candidate",
            {
                "reward": reward,
                "seconds": round(elapsed, 3),
                "exit_code": proc.returncode,
                "reward_line": bool(REWARD_PATTERN.search(blob)),
                "source_bytes": len(source),
            },
        )
        return RunResult(
            reward=reward,
            seconds=elapsed,
            exit_code=proc.returncode,
            stdout=proc.stdout,
            stderr=proc.stderr,
        )


def run_on_cases(bundle: Bundle, source: str, timeout: float = 60.0) -> dict[str, bytes] | None:
    case_dir = bundle.tests_root / "cases"
    if not case_dir.is_dir():
        return None
    cases = sorted(p for p in case_dir.iterdir() if p.is_file() and not p.name.startswith("."))
    if not cases:
        return None

    produced: dict[str, bytes] = {}
    with tempfile.TemporaryDirectory(prefix="shakedown_cases_") as tmp:
        base = Path(tmp)
        candidate = base / "candidate.py"
        candidate.write_text(source, encoding="utf8")
        for index, case in enumerate(cases):
            target = base / f"out_{index}"
            try:
                subprocess.run(
                    [sys.executable, str(candidate), str(case), str(target)],
                    cwd=base,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )
            except subprocess.TimeoutExpired:
                produced[case.name] = b"<timeout>"
                continue
            produced[case.name] = target.read_bytes() if target.is_file() else b"<absent>"
    return produced


def run_oracle(bundle: Bundle, timeout: float = 120.0) -> RunResult:
    return run_candidate(bundle, bundle.solution, timeout=timeout)


def run_nop(bundle: Bundle, timeout: float = 120.0) -> RunResult:
    return run_candidate(bundle, NOP_SOURCE, timeout=timeout)


def run_mutant(bundle: Bundle, find: str, replace: str, timeout: float = 120.0) -> RunResult | None:
    source = bundle.solution
    if find not in source:
        return None
    return run_candidate(bundle, source.replace(find, replace, 1), timeout=timeout)
