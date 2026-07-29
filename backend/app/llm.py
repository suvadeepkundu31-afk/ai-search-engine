import json
import httpx
from app.config import settings


class BaseLLM:
    def chat(self, messages: list[dict], **kwargs) -> str:
        raise NotImplementedError

    def chat_stream(self, messages: list[dict], **kwargs):
        raise NotImplementedError


class OllamaLLM(BaseLLM):
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

    def chat(self, messages: list[dict], model: str | None = None, temperature: float = 0.2) -> str:
        url = f"{self.host}/api/chat"
        payload = self._prepare_payload(messages, model, temperature, stream=False)
        try:
            resp = httpx.post(url, json=payload, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            return (data.get("message") or {}).get("content", "")
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Ollama request failed: {exc}")


class GeminiLLM(BaseLLM):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.timeout = 60.0

    def _convert_messages(self, messages: list[dict]):
        system_instruction = None
        contents = []
        for msg in messages:
            role = msg.get("role")
            text = msg.get("content", "")
            if role == "system":
                system_instruction = {"parts": [{"text": text}]}
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": text}]})
            else:
                contents.append({"role": "user", "parts": [{"text": text}]})
        return system_instruction, contents

    def _extract_text(self, data: dict) -> str:
        candidates = data.get("candidates") or []
        parts = []
        for candidate in candidates:
            content = candidate.get("content") or {}
            for part in content.get("parts", []):
                text = part.get("text")
                if text:
                    parts.append(text)
        return "".join(parts)

    def _make_payload(self, messages: list[dict], temperature: float):
        system_instruction, contents = self._convert_messages(messages)
        payload = {
            "contents": contents,
            "generationConfig": {"temperature": temperature},
        }
        if system_instruction:
            payload["systemInstruction"] = system_instruction
        return payload

    def chat(self, messages: list[dict], temperature: float = 0.7) -> str:
        url = f"{self.base_url}/models/{self.model}:generateContent"
        params = {"key": self.api_key}
        payload = self._make_payload(messages, temperature)
        try:
            resp = httpx.post(url, params=params, json=payload, timeout=self.timeout)
            resp.raise_for_status()
            return self._extract_text(resp.json())
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Gemini request failed: {exc}")

    def chat_stream(self, messages: list[dict], temperature: float = 0.7):
        # Gemini's streaming JSON-array response is not token-friendly via plain HTTP,
        # so we use the non-streaming endpoint and emit the complete answer as one chunk.
        yield self.chat(messages, temperature=temperature)


class LLM(BaseLLM):
    def __init__(self):
        if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            self._provider = GeminiLLM()
        else:
            self._provider = OllamaLLM()

    def chat(self, messages: list[dict], **kwargs) -> str:
        return self._provider.chat(messages, **kwargs)

    def chat_stream(self, messages: list[dict], **kwargs):
        yield from self._provider.chat_stream(messages, **kwargs)


llm = LLM()
