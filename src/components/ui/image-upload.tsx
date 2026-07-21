"use client";
import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

export default function ImageUpload({
  value, onChange, folder, shape = "square",
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  shape?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      onChange(data.url);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const box = shape === "wide" ? "w-full h-32" : "w-20 h-20";

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`relative ${box} rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Upload size={18} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-white" />
            </div>
          )}
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X size={11} />
            </button>
          )}
        </div>
        <div className="flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-xs py-2 px-3.5 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : value ? "Change Photo" : "Upload Photo"}
          </button>
          <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, WEBP or GIF. Max 5MB.</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
