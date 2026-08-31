from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request

ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
ANTHROPIC_KEY = "ANTHROPIC_API_KEY"
DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5"

# Everything below speaks the OpenAI chat completions shape, so one code path serves
# all of them and only the endpoint, the key and the default model differ.
OPENAI_LIKE = {
    "openrouter": {
        "endpoint": "https://openrouter.ai/api/v1/chat/completions",
        "key": "OPENROUTER_API_KEY",
        "model": "anthropic/claude-sonnet-4.5",
        "hint": "an OpenRouter key from openrouter.ai",
    },
    "groq": {
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "key": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
        "hint": "a Groq key from console.groq.com",
    },
    "gemini": {
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "key": "GEMINI_API_KEY",
        "model": "gemini-2.5-flash",
        "hint": "a Gemini key from aistudio.google.com",
    },
}

# Checked in this order, so whichever key is present is simply used.
ORDER = ("anthropic", "groq", "gemini", "openrouter")


class AgentUnavailable(RuntimeError):
    pass


def _env(name: str) -> str:
    return os.environ.get(name, "").strip()


def _key_for(name: str) -> str:
    return ANTHROPIC_KEY if name == "anthropic" else OPENAI_LIKE[name]["key"]


def provider() -> str:
    """Whichever provider has a key in the environment, in a fixed order.

    SHAKEDOWN_PROVIDER overrides it. Nothing here is hardcoded to one vendor: the
    agent layer is the same loop whichever model answers, which is also the point
    of keeping the tools rather than the model as the thing that does the work.
    """
    forced = _env("SHAKEDOWN_PROVIDER").lower()
    if forced in ORDER:
        return forced
    for name in ORDER:
        if _env(_key_for(name)):
            return name
    return "openrouter"


def have_key() -> bool:
    return any(_env(_key_for(name)) for name in ORDER)


def model_name() -> str:
    chosen = _env("SHAKEDOWN_MODEL")
    if chosen:
        return chosen
    name = provider()
    return DEFAULT_ANTHROPIC_MODEL if name == "anthropic" else OPENAI_LIKE[name]["model"]


def _require(name: str, hint: str) -> str:
    value = _env(name)
    if not value:
        raise AgentUnavailable(
            f"{name} is not set. {hint} The deterministic probes need no key and "
            "run without one."
        )
    return value


def _post(url: str, headers: dict, body: dict, timeout: float) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf8", "replace")[:400]
        raise AgentUnavailable(f"{url} returned {error.code}: {detail}") from None
    except urllib.error.URLError as error:
        raise AgentUnavailable(f"{url} could not be reached: {error.reason}") from None


class Client:
    """One chat client over two providers, speaking the same shape to the loop.

    Whichever provider is in use, `complete` takes OpenAI shaped messages and tool
    definitions and returns an OpenAI shaped assistant message, so the agent loop
    does not know or care which one answered. Keys are read from the environment at
    call time and are never written to a trajectory, a report or the console.
    """

    def __init__(self, model: str | None = None, timeout: float = 120.0):
        self.provider = provider()
        self.model = model or model_name()
        self.timeout = timeout
        self.calls = 0
        self.prompt_tokens = 0
        self.completion_tokens = 0

    # ------------------------------------------------------------------ public

    def complete(self, messages: list[dict], tools: list[dict] | None = None) -> dict:
        started = time.perf_counter()
        if self.provider == "anthropic":
            message = self._anthropic(messages, tools)
        else:
            message = self._openai_like(messages, tools)
        self.calls += 1
        message["_seconds"] = round(time.perf_counter() - started, 3)
        return message

    # -------------------------------------------------------------- openrouter

    def _openai_like(self, messages: list[dict], tools: list[dict] | None) -> dict:
        spec = OPENAI_LIKE[self.provider]
        key = _require(
            spec["key"],
            f"The agent layer calls a model, so export {spec['hint']} "
            "(any of ANTHROPIC_API_KEY, GROQ_API_KEY, GEMINI_API_KEY or "
            "OPENROUTER_API_KEY will do).",
        )
        body: dict = {"model": self.model, "messages": messages, "temperature": 0}
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"

        payload = _post(
            spec["endpoint"],
            {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "X-Title": "Shakedown",
            },
            body,
            self.timeout,
        )

        usage = payload.get("usage") or {}
        self.prompt_tokens += int(usage.get("prompt_tokens") or 0)
        self.completion_tokens += int(usage.get("completion_tokens") or 0)

        choices = payload.get("choices") or []
        if not choices:
            raise AgentUnavailable(f"{self.provider} returned no choices")
        return dict(choices[0].get("message") or {})

    # --------------------------------------------------------------- anthropic

    def _anthropic(self, messages: list[dict], tools: list[dict] | None) -> dict:
        key = _require(
            ANTHROPIC_KEY,
            "The agent layer calls a model, so export an Anthropic key "
            "from console.anthropic.com.",
        )
        system, turns = self._to_anthropic(messages)
        body: dict = {
            "model": self.model,
            "max_tokens": 2048,
            "temperature": 0,
            "messages": turns,
        }
        if system:
            body["system"] = system
        if tools:
            body["tools"] = [
                {
                    "name": tool["function"]["name"],
                    "description": tool["function"].get("description", ""),
                    "input_schema": tool["function"].get("parameters")
                    or {"type": "object", "properties": {}},
                }
                for tool in tools
            ]

        payload = _post(
            ANTHROPIC_ENDPOINT,
            {
                "x-api-key": key,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            body,
            self.timeout,
        )

        usage = payload.get("usage") or {}
        self.prompt_tokens += int(usage.get("input_tokens") or 0)
        self.completion_tokens += int(usage.get("output_tokens") or 0)
        return self._from_anthropic(payload)

    @staticmethod
    def _to_anthropic(messages: list[dict]) -> tuple[str, list[dict]]:
        """OpenAI shaped history in, Anthropic shaped history out."""
        system_parts: list[str] = []
        turns: list[dict] = []

        for message in messages:
            role = message.get("role")

            if role == "system":
                system_parts.append(str(message.get("content") or ""))
                continue

            if role == "tool":
                block = {
                    "type": "tool_result",
                    "tool_use_id": message.get("tool_call_id", ""),
                    "content": str(message.get("content") or ""),
                }
                # Anthropic wants consecutive tool results inside one user turn.
                if turns and turns[-1]["role"] == "user" and isinstance(turns[-1]["content"], list):
                    turns[-1]["content"].append(block)
                else:
                    turns.append({"role": "user", "content": [block]})
                continue

            if role == "assistant":
                blocks: list[dict] = []
                text = (message.get("content") or "").strip()
                if text:
                    blocks.append({"type": "text", "text": text})
                for call in message.get("tool_calls") or []:
                    function = call.get("function") or {}
                    try:
                        args = json.loads(function.get("arguments") or "{}")
                    except json.JSONDecodeError:
                        args = {}
                    blocks.append(
                        {
                            "type": "tool_use",
                            "id": call.get("id", ""),
                            "name": function.get("name", ""),
                            "input": args,
                        }
                    )
                if blocks:
                    turns.append({"role": "assistant", "content": blocks})
                continue

            turns.append({"role": "user", "content": str(message.get("content") or "")})

        return "\n\n".join(part for part in system_parts if part), turns

    @staticmethod
    def _from_anthropic(payload: dict) -> dict:
        """Anthropic reply out, OpenAI shaped assistant message in its place."""
        text_parts: list[str] = []
        calls: list[dict] = []
        for block in payload.get("content") or []:
            if block.get("type") == "text":
                text_parts.append(block.get("text", ""))
            elif block.get("type") == "tool_use":
                calls.append(
                    {
                        "id": block.get("id", ""),
                        "type": "function",
                        "function": {
                            "name": block.get("name", ""),
                            "arguments": json.dumps(block.get("input") or {}),
                        },
                    }
                )
        message: dict = {"role": "assistant", "content": "".join(text_parts)}
        if calls:
            message["tool_calls"] = calls
        return message
