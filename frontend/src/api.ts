import type { ChatRequest } from "./types";

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

export async function me() {
  const resp = await request("/api/auth/me");
  return resp.json();
}

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const resp = await request("/api/documents/upload", {
    method: "POST",
    body: form,
    headers: {},
  });
  return resp.json();
}

export async function listDocuments() {
  const resp = await request("/api/documents");
  return resp.json();
}

export async function search(query: string, k = 5) {
  const resp = await request(`/api/search?q=${encodeURIComponent(query)}&k=${k}`);
  return resp.json();
}

export async function chat(data: ChatRequest) {
  const resp = await request("/api/chat", { method: "POST", body: JSON.stringify(data) });
  return resp.json();
}

