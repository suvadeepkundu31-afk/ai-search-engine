import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, Sparkles, Loader2 } from "lucide-react";
import { search } from "../api";
import type { SearchResult } from "../types";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await search(query);
      setResults(data);
    } catch (err: any) {
      // Handled by global toast in future; for now no-op
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start pt-24 sm:pt-32 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text">Zeee</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto">
          AI-powered semantic search across your documents.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-2xl"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl opacity-50 blur group-hover:opacity-75 transition duration-300" />
          <div className="relative flex items-center glass-strong rounded-2xl">
            <SearchIcon className="ml-4 text-slate-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your documents..."
              className="flex-1 bg-transparent px-4 py-4 text-slate-100 placeholder:text-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="mr-2 btn-primary flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>
      </motion.form>

      <div className="w-full max-w-3xl mt-10 space-y-4">
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass p-5 animate-pulse">
                <div className="h-4 w-1/3 bg-white/10 rounded mb-3" />
                <div className="h-3 w-full bg-white/5 rounded" />
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {!loading && searched && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-slate-500 py-10"
            >
              No matching documents found.
            </motion.div>
          )}

          {!loading && results.map((r, idx) => (
            <motion.div
              key={r.chunk_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass p-5 hover:bg-white/[0.06] transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sky-300 group-hover:text-cyan-300 transition">
                  {r.filename}
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                  score {r.score.toFixed(3)}
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{r.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
