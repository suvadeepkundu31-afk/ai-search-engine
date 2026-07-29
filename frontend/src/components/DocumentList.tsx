import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, File } from "lucide-react";
import toast from "react-hot-toast";
import { listDocuments } from "../api";
import Upload from "./Upload";
import type { Document } from "../types";

export default function DocumentList() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await listDocuments();
      setDocs(data);
    } catch (err: any) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">Documents</h1>
          <p className="text-slate-400">Upload and manage your knowledge base.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Upload onUpload={load} />
          </div>

          <div className="lg:col-span-2 space-y-3">
            {loading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass p-4 animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-white/10 rounded" />
                      <div className="h-3 w-1/4 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && docs.map((d, idx) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass p-4 flex items-center gap-4 hover:bg-white/[0.06] transition"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center text-cyan-300">
                  {d.content_type.includes("pdf") ? <FileText size={20} /> : <File size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-200 truncate">{d.filename}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{d.content_type}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {d.status}
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </motion.div>
            ))}

            {!loading && docs.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <FileText size={40} className="mx-auto mb-3 text-slate-600" />
                <p>No documents uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
