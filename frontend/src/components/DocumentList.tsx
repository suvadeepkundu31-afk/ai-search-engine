import { useEffect, useState } from "react";
import { listDocuments } from "../api";
import Upload from "./Upload";
import type { Document } from "../types";

export default function DocumentList() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await listDocuments();
      setDocs(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="page">
      <h1>Documents</h1>
      <Upload />
      {error && <p className="error">{error}</p>}
      <table className="doc-table">
        <thead>
          <tr><th>Filename</th><th>Type</th><th>Status</th><th>Uploaded</th></tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>{d.filename}</td>
              <td>{d.content_type}</td>
              <td>{d.status}</td>
              <td>{new Date(d.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
