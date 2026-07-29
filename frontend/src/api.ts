import type { ChatRequest, ChatResponse, ChatSession, ChatMessage, Document, SearchResult, User } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (resp.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `HTTP ${resp.status}`);
  }
  return resp;
}

export async function register(data: { email: string; username: string; password: string }) {
  const resp = await request("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
  return resp.json();
}

export async function login(data: { username: string; password: string }) {
  const resp = await request("/api/auth/login", {
    method: "POST",
    body: new URLSearchParams(data as Record<string, string>),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return resp.json();
}

export async function me(): Promise<User> {
  const resp = await request("/api/auth/me");
  return resp.json();
}

export async function uploadFile(file: File): Promise<Document> {
  const form = new FormData();
  form.append("file", file);
  const resp = await request("/api/documents/upload", {
    method: "POST",
    body: form,
    headers: {},
  });
  return resp.json();
}

export async function listDocuments(): Promise<Document[]> {
  const resp = await request("/api/documents");
  return resp.json();
}

export async function search(query: string, k = 5): Promise<SearchResult[]> {
  const resp = await request(`/api/search?q=${encodeURIComponent(query)}&k=${k}`);
  return resp.json();
}

export async function chat(data: ChatRequest): Promise<ChatResponse> {
  const resp = await request("/api/chat", { method: "POST", body: JSON.stringify(data) });
  return resp.json();
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const resp = await request("/api/chat/sessions");
  return resp.json();
}

export async function getChatSessionMessages(sessionId: number): Promise<ChatMessage[]> {
  const resp = await request(`/api/chat/sessions/${sessionId}/messages`);
  return resp.json();
}

export interface StreamChunk {
  type: "text" | "sources" | "done" | "error";
  content?: string;
  sources?: { chunk_id: number; document_id: number; filename: string; text: string; score: number }[];
  session_id?: number;
  answer?: string;
  error?: string;
}

export async function* streamChat(data: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `HTTP ${resp.status}`);
  }

  const reader = resp.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      try {
        const parsed: StreamChunk = JSON.parse(payload);
        yield parsed;
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
