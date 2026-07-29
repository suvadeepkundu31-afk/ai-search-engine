import httpx
from app.config import settings


class LLM:
    def __init__(self):
        self.host = settings.OLLAMA_HOST.rstrip("/")
        self.timeout = 120.0

    def chat(
        self,
        messages: list[dict],
        model: str | None = None,
        temperature: float = 0.2,
    ) -> str:
        model = model or settings.OLLAMA_MODEL
        url = f"{self.host}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature},
        }
        try:
            response = httpx.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Ollama request failed: {exc}")


llm = LLM()
