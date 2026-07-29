import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Loader2, FileCheck } from "lucide-react";
import toast from "react-hot-toast";
import { uploadFile } from "../api";

interface UploadProps {
  onUpload?: () => void;
}

export default function Upload({ onUpload }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadFile(file);
      toast.success(`${data.filename} uploaded`);
      setFile(null);
      onUpload?.();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass p-6 h-fit"
    >
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <UploadCloud size={20} className="text-cyan-400" /> Upload
      </h2>
      <p className="text-sm text-slate-500 mb-4">PDF, DOCX, or TXT files</p>

      <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-white/[0.03] transition cursor-pointer">
        <UploadCloud size={28} className="text-slate-500 mb-2" />
        <span className="text-sm text-slate-400">
          {file ? file.name : "Click to select a file"}
        </span>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full mt-4 btn-primary flex items-center justify-center gap-2"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileCheck size={16} />}
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </motion.form>
  );
}
