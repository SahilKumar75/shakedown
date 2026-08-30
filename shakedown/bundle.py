from __future__ import annotations

import tomllib
from dataclasses import dataclass
from pathlib import Path


class BundleError(Exception):
    pass


REQUIRED = (
    "task.toml",
    "instruction.md",
    "solution/solve.py",
    "tests/verify.py",
)


@dataclass
class Bundle:
    root: Path
    meta: dict

    @property
    def name(self) -> str:
        return str(self.meta.get("task", {}).get("name", self.root.name))

    @property
    def instruction(self) -> str:
        return (self.root / "instruction.md").read_text(encoding="utf8")

    @property
    def solution(self) -> str:
        return (self.root / "solution" / "solve.py").read_text(encoding="utf8")

    @property
    def verifier(self) -> str:
        return (self.root / "tests" / "verify.py").read_text(encoding="utf8")

    @property
    def env_root(self) -> Path:
        return self.root / "env"

    @property
    def tests_root(self) -> Path:
        return self.root / "tests"

    def visible_files(self) -> list[Path]:
        out = [self.root / "instruction.md"]
        if self.env_root.is_dir():
            out.extend(sorted(p for p in self.env_root.rglob("*") if p.is_file()))
        return out

    def graded_files(self) -> list[Path]:
        if not self.tests_root.is_dir():
            return []
        return sorted(p for p in self.tests_root.rglob("*") if p.is_file())

    def read_visible_text(self, limit: int = 20000) -> str:
        chunks = []
        for path in self.visible_files():
            try:
                body = path.read_text(encoding="utf8")
            except (UnicodeDecodeError, OSError):
                body = f"<binary {path.stat().st_size} bytes>"
            chunks.append(f"### {path.relative_to(self.root)}\n{body}")
        joined = "\n\n".join(chunks)
        return joined[:limit]

    def budget_seconds(self) -> float:
        return float(self.meta.get("limits", {}).get("oracle_seconds", 60))


def load(root: str | Path) -> Bundle:
    path = Path(root).resolve()
    if not path.is_dir():
        raise BundleError(f"{path} is not a directory")
    missing = [name for name in REQUIRED if not (path / name).is_file()]
    if missing:
        raise BundleError(f"{path.name} is missing {', '.join(missing)}")
    with (path / "task.toml").open("rb") as handle:
        meta = tomllib.load(handle)
    return Bundle(root=path, meta=meta)


def discover(root: str | Path) -> list[Bundle]:
    base = Path(root).resolve()
    found = []
    for candidate in sorted(base.iterdir()):
        if candidate.is_dir() and (candidate / "task.toml").is_file():
            found.append(load(candidate))
    return found
