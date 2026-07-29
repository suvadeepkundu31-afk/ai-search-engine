from openai import OpenAI
from app.config import settings


class LLM:
    def __init__(self):
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            self.client = None

    def chat(
        self,
        messages: list[dict],
        model: str | None = None,
        max_tokens: int = 512,
        temperature: float = 0.2,
    ) -> str:
        if not self.client:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        model = model or settings.OPENAI_CHAT_MODEL
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content


llm = LLM()
