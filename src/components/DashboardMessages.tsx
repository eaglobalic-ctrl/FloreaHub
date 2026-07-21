"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Send, Image as ImageIcon, Loader2, MessageCircle, Flower2, Star, ArrowUpRight } from "lucide-react";

type Conversation = {
  id: string;
  buyer_id: string;
  florist_unread_count: number;
  last_message_at: string;
  users?: { id: string; name: string } | null;
};

type Message = {
  id: string;
  sender_role: "buyer" | "florist";
  content: string | null;
  image_url: string | null;
  created_at: string;
  product_id?: string | null;
  product_name?: string | null;
  product_price?: number | null;
  product_image?: string | null;
  product_original_price?: number | null;
  product_rating?: number | null;
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 1) return `${d}d ago`;
  if (d === 1) return "Yesterday";
  if (h >= 1) return `${h}h ago`;
  return "Just now";
};

export default function DashboardMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(() => {
    fetch("/api/conversations?role=florist")
      .then(r => r.json())
      .then(d => setConversations(d.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoadingConvos(false));
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const loadMessages = useCallback(() => {
    if (!selectedId) return;
    fetch(`/api/messages?conversationId=${selectedId}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .catch(() => {});
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (imageUrl?: string) => {
    if (!selectedId || (!text.trim() && !imageUrl)) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, content: text.trim() || undefined, imageUrl }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setText("");
      loadMessages();
    } catch {
      setError("Couldn't send message. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleImage = async (file: File | undefined) => {
    if (!file || !selectedId) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "chat");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      await send(data.url);
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const selected = conversations.find(c => c.id === selectedId);

  return (
    <div className="card-premium overflow-hidden grid grid-cols-1 sm:grid-cols-[260px_1fr] h-[600px]">
      {/* Conversation list */}
      <div className="border-r border-gray-100 overflow-y-auto overscroll-contain">
        {loadingConvos ? (
          <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            <MessageCircle size={24} className="mx-auto mb-2 text-gray-200" />
            No conversations yet.
          </div>
        ) : (
          conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full flex items-center gap-3 p-3.5 border-b border-gray-50 text-left transition-colors ${selectedId === c.id ? "bg-gray-50" : "hover:bg-gray-50"}`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "var(--primary)" }}>
                {c.users?.name?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.users?.name ?? "Buyer"}</p>
                <p className="text-xs text-gray-400">{timeAgo(c.last_message_at)}</p>
              </div>
              {c.florist_unread_count > 0 && (
                <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)" }}>
                  {c.florist_unread_count}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Thread */}
      <div className="flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Select a conversation to view messages.</div>
        ) : (
          <>
            <div className="px-4 py-3.5 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">{selected.users?.name ?? "Buyer"}</p>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 bg-gray-50">
              {messages.map(m => {
                const mine = m.sender_role === "florist";
                if (m.product_id) {
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <Link href={`/products/${m.product_id}`} target="_blank" className="max-w-[75%] w-64 block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all group">
                        <div className="w-full h-28 bg-gray-100 overflow-hidden">
                          {m.product_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.product_image} alt={m.product_name ?? "Product"} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Flower2 size={20} /></div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug mb-1">{m.product_name}</p>
                          {m.product_rating != null && (
                            <div className="flex items-center gap-1 mb-1">
                              <Star size={10} className="text-amber-400" fill="currentColor" />
                              <span className="text-[11px] text-gray-500">{Number(m.product_rating).toFixed(1)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>RM{m.product_price}</span>
                            {m.product_original_price != null && m.product_original_price > (m.product_price ?? 0) && (
                              <span className="text-[11px] text-gray-400 line-through">RM{m.product_original_price}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--primary)" }}>
                            View Product <ArrowUpRight size={11} />
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "text-white" : "bg-white border border-gray-100 text-gray-800"}`} style={mine ? { background: "var(--primary)" } : {}}>
                      {m.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.image_url} alt="Shared" className="rounded-lg mb-1.5 max-w-full" />
                      )}
                      {m.content && <p className="leading-relaxed">{m.content}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-100 p-3">
              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {uploading ? <Loader2 size={17} className="animate-spin" /> : <ImageIcon size={17} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImage(e.target.files?.[0])} />
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message..."
                  className="flex-1 input-premium py-2.5 text-sm"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => send()}
                  disabled={sending || !text.trim()}
                  className="p-2.5 rounded-xl text-white disabled:opacity-50 flex-shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
