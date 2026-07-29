import json
import httpx
from app.config import settings


class LLM:
    def __init__(self):
        self.host = settings.OLLAMA_HOST.rstrip("/")
        self.timeout = 180.0

    def _prepare_payload(self, messages: list[dict], model: str | None, temperature: float, stream: bool):
        return {
            "model": model or settings.OLLAMA_MODEL,
            "messages": messages,
            "stream": stream,
            "options": {"temperature": temperature},
        }

    def _parse_line(self, line: str) -> tuple[str | None, bool]:
        """Parse a single NDJSON line from Ollama. Returns (content, done)."""
        text = line.strip()
        if not text:
            return None, False
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return None, False
        if data.get("done"):
            return None, True
        message = data.get("message") or {}
        return message.get("content"), False

    def chat_stream(self, messages: list[dict], model: str | None = None, temperature: float = 0.2):
        url = f"{self.host}/api/chat"
        payload = self._prepare_payload(messages, model, temperature, stream=True)
        try:
            with httpx.stream("POST", url, json=payload, timeout=self.timeout) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    content, done = self._parse_line(line)
                    if done:
                        break
                    if content:
                        yield content
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Ollama stream failed: {exc}")

    def chat(
        self,
        messages: list[dict],
        model: str | None = None,
        temperature: float = 0.2,
    ) -> str:
        url = f"{self.host}/api/chat"
        payload = self._prepare_payload(messages, model, temperature, stream=False)
        try:
            resp = httpx.post(url, json=payload, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            return (data.get("message") or {}).get("content", "")
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Ollama request failed: {exc}")


llm = LLM()
