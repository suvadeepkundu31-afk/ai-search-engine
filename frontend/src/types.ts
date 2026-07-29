export interface User {
  id: number;
  email: string;
  username: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Document {
  id: number;
  filename: string;
  content_type: string;
  status: string;
  created_at: string;
}

export interface Source {
  chunk_id: number;
  document_id: number;
  filename: string;
  text: string;
  score: number;
}

export interface SearchResult extends Source {}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  created_at: string;
}

export interface ChatRequest {
  query: string;
  session_id?: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  session_id: number;
}
