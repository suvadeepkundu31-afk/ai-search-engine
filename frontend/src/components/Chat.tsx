import { useEffect, useRef, useState, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Plus, MessageSquare, Copy, Check, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { streamChat, listChatSessions, getChatSessionMessages, chat } from "../api";
import type { ChatMessage, ChatSession } from "../types";
import Markdown from "./Markdown";

export default function Chat() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSessionMessages(Number(sessionId));
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function loadSessions() {
    try {
      const data = await listChatSessions();
      setSessions(data);
    } catch (err: any) {
      toast.error("Failed to load chat history");
    }
  }

  async function loadSessionMessages(id: number) {
    setLoading(true);
    try {
      const data = await getChatSessionMessages(id);
      setMessages(data);
    } catch (err: any) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    navigate("/chat");
    setInput("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMessage]);
    const currentInput = input;
    setInput("");
    setStreaming(true);

    const assistantId = Date.now() + 1;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: [],
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, assistantMessage]);

    try {
      const id = sessionId ? Number(sessionId) : undefined;
      let currentSessionId = id;

      // Attempt streaming endpoint first
      let streamed = false;
      try {
        for await (const chunk of streamChat({ query: currentInput, session_id: id })) {
          streamed = true;
          if (chunk.type === "text" && chunk.content) {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId ? { ...msg, content: msg.content + chunk.content } : msg
              )
            );
          } else if (chunk.type === "sources" && chunk.sources) {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId ? { ...msg, sources: chunk.sources } : msg
              )
            );
          } else if (chunk.type === "done") {
            if (chunk.session_id) currentSessionId = chunk.session_id;
            if (chunk.answer) {
              setMessages((m) =>
                m.map((msg) => (msg.id === assistantId ? { ...msg, content: chunk.answer! } : msg))
              );
            }
          } else if (chunk.type === "error") {
            toast.error(chunk.error || "Stream error");
          }
        }
      } catch (streamErr: any) {
        if (streamed) throw streamErr;
        // Fallback to non-streaming endpoint
        const resp = await chat({ query: currentInput, session_id: id });
        currentSessionId = resp.session_id;
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: resp.answer, sources: resp.sources }
              : msg
          )
        );
      }

      if (!sessionId && currentSessionId) {
        navigate(`/chat/${currentSessionId}`, { replace: true });
        loadSessions();
      } else {
        loadSessions();
      }
    } catch (err: any) {
      toast.error(err.message || "Chat failed");
      setMessages((m) => m.filter((msg) => msg.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  }

  const activeTitle = sessions.find((s) => String(s.id) === sessionId)?.title || "New chat";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute z-20 sm:relative w-72 h-full glass border-r-0 sm:border-r border-white/[0.08] flex flex-col"
          >
            <div className="p-4 border-b border-white/[0.08]">
              <button onClick={startNewChat} className="w-full btn-primary flex items-center justify-center gap-2">
                <Plus size={16} /> New chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-6">No chats yet</div>
              )}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/chat/${s.id}`)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                    String(s.id) === sessionId ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare size={14} />
                  <span className="truncate flex-1">{s.title}</span>
                  <Clock size={12} className="opacity-50" />
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition"
            aria-label="Toggle history"
          >
            <MessageSquare size={18} />
          </button>
          <span className="text-sm text-slate-400 truncate">{activeTitle}</span>
          <button onClick={startNewChat} className="ml-auto btn-ghost flex items-center gap-2 text-sm">
            <Plus size={16} /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-slate-500"
            >
              <MessageSquare size={40} className="mb-3 text-cyan-500/50" />
              <p className="text-lg font-medium text-slate-300">Start a conversation with Zeee</p>
              <p className="text-sm">Ask anything about your documents.</p>
            </motion.div>
          )}

          {loading && (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="glass p-4 animate-pulse">
                  <div className="h-3 w-1/4 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-full bg-white/5 rounded" />
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {messages.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-md"
                      : "glass rounded-bl-md"
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 opacity-80">
                    {m.role === "user" ? "You" : "Zeee"}
                  </div>
                  <div className={m.role === "user" ? "" : "prose-zeee"}>
                    {m.role === "user" ? (
                      <p className="leading-relaxed">{m.content}</p>
                    ) : (
                      <Markdown content={m.content || (streaming && idx === messages.length - 1 ? "Zeee is thinking…" : "")} />
                    )}
                  </div>
                  {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.sources.map((s) => (
                        <span
                          key={s.chunk_id}
                          className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                        >
                          {s.filename}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.role === "assistant" && m.content && (
                    <CopyButton text={m.content} />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-white/[0.08]">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative flex items-center glass-strong rounded-2xl pr-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Zeee anything..."
                disabled={streaming}
                className="flex-1 bg-transparent px-4 py-3.5 outline-none text-slate-100 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className="btn-primary p-2.5 rounded-xl"
                aria-label="Send"
              >
                {streaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition"
      aria-label="Copy message"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
    </button>
  );
}
