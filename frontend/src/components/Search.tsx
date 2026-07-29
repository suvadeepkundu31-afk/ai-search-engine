import { useState } from "react";
import { search } from "../api";
import type { SearchResult } from "../types";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await search(query);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Semantic Search</h1>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask or search..."
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="results">
        {results.map((r) => (
          <div key={r.chunk_id} className="result-card">
            <h4>{r.filename} <span className="score">({r.score.toFixed(3)})</span></h4>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
