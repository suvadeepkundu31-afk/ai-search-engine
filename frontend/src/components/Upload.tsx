import { useState } from "react";
import { uploadFile } from "../api";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("Uploading...");
    setError("");
    try {
      const data = await uploadFile(file);
      setStatus(`Uploaded ${data.filename} (${data.status})`);
      setFile(null);
    } catch (err: any) {
      setStatus("");
      setError(err.message);
    }
  }

  return (
    <div className="upload">
      <h3>Upload Document</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button type="submit" disabled={!file}>Upload</button>
      </form>
      {status && <p className="success">{status}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
