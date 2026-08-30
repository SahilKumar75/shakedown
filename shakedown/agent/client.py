from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request

ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "anthropic/claude-sonnet-4.5"
KEY_VAR = "OPENROUTER_API_KEY"


class AgentUnavailable(RuntimeError):
    pass


def model_name() -> str:
    return os.environ.get("SHAKEDOWN_MODEL", DEFAULT_MODEL)


def have_key() -> bool:
    return bool(os.environ.get(KEY_VAR, "").strip())


def _key() -> str:
    value = os.environ.get(KEY_VAR, "").strip()
    if not value:
        raise AgentUnavailable(
            f"{KEY_VAR} is not set. The agent layer calls a model through OpenRouter, "
            "so export a key before running it. The deterministic probes need no key "
            "and run without one."
        )
    return value


class Client:
    """A small OpenRouter chat client over the standard library.

    No third party package is involved, so the whole project stays installable with
    nothing but Python. The key is read from the environment at call time and is
    never written to a trajectory, a report or the console.
    """

    def __init__(self, model: str | None = None, timeout: float = 120.0):
        self.model = model or model_name()
        self.timeout = timeout
        self.calls = 0
        self.prompt_tokens = 0
        self.completion_tokens = 0

    def complete(self, messages: list[dict], tools: list[dict] | None = None) -> dict:
        body = {
            "model": self.model,
            "messages": messages,
            "temperature": 0,
        }
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"

        request = urllib.request.Request(
            ENDPOINT,
            data=json.dumps(body).encode("utf8"),
            headers={
                "Authorization": f"Bearer {_key()}",
                "Content-Type": "application/json",
                "X-Title": "Shakedown",
            },
            method="POST",
        )

        started = time.perf_counter()
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                payload = json.loads(response.read().decode("utf8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf8", "replace")[:400]
            raise AgentUnavailable(f"OpenRouter returned {error.code}: {detail}") from None
        except urllib.error.URLError as error:
            raise AgentUnavailable(f"OpenRouter could not be reached: {error.reason}") from None

        self.calls += 1
        usage = payload.get("usage") or {}
        self.prompt_tokens += int(usage.get("prompt_tokens") or 0)
        self.completion_tokens += int(usage.get("completion_tokens") or 0)

        choices = payload.get("choices") or []
        if not choices:
            raise AgentUnavailable("OpenRouter returned no choices")
        message = choices[0].get("message") or {}
        message["_seconds"] = round(time.perf_counter() - started, 3)
        return message
