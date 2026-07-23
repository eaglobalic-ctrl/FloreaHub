"use client";
import { useState, useEffect } from "react";
import { Star, MessageSquarePlus, Check } from "lucide-react";
import { toast } from "@/components/Toast";

const DISMISS_KEY = "floreahub_testimonial_dismissed";

// "Nanti" only skips the full nagging card on future visits — it never
// removes the ability to leave a testimonial. Once collapsed, a small
// permanent link stays clickable so someone who said "later" can still
// come back and submit whenever they actually want to.
type Stage = "card" | "collapsed" | "form" | "done";

export default function TestimonialPrompt({ context }: { context: "buyer" | "seller" }) {
  const [stage, setStage] = useState<Stage>("collapsed");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setStage(localStorage.getItem(DISMISS_KEY) === "1" ? "collapsed" : "card");
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setStage("collapsed");
  };

  const submit = async () => {
    if (!comment.trim()) { toast.error("Tulis sikit pengalaman anda dulu."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      localStorage.setItem(DISMISS_KEY, "1");
      setStage("done");
    } catch { toast.error("Gagal hantar."); }
    setSubmitting(false);
  };

  if (stage === "collapsed") {
    return (
      <button onClick={() => setStage("form")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4">
        <MessageSquarePlus size={13} /> Bagi testimoni tentang FloreaHub
      </button>
    );
  }

  return (
    <div className="card-premium p-5 mb-6 border-rose-100 bg-rose-50/40">
      {stage === "done" ? (
        <div className="flex items-center gap-3 text-sm text-emerald-700">
          <Check size={18} /> Terima kasih! Testimoni anda akan disemak sebelum dipaparkan.
        </div>
      ) : stage === "card" ? (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <MessageSquarePlus size={20} className="text-rose-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {context === "buyer" ? "Suka pengalaman guna FloreaHub?" : "Suka jual di FloreaHub?"}
              </p>
              <p className="text-xs text-gray-500">Kongsi testimoni ringkas — mungkin dipaparkan di homepage.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => setStage("form")} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--primary)" }}>
              Tulis Testimoni
            </button>
            <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">Nanti</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={20} className={n <= rating ? "text-amber-400" : "text-gray-200"} fill="currentColor" />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Kongsi pengalaman anda guna FloreaHub..."
            rows={3}
            className="input-premium w-full text-sm mb-3 resize-none"
          />
          <div className="flex items-center gap-2">
            <button onClick={submit} disabled={submitting} className="text-xs px-4 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: "var(--primary)" }}>
              {submitting ? "..." : "Hantar"}
            </button>
            <button onClick={() => setStage(localStorage.getItem(DISMISS_KEY) === "1" ? "collapsed" : "card")} className="text-xs text-gray-400 hover:text-gray-600">Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}
