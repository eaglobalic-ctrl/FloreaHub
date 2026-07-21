"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Image as ImageIcon, Loader2, Flower2 } from "lucide-react";

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
};

type ProductContext = { id: string; name: string; price: number; image?: string | null };

export default function ChatWidget({
  floristId, floristName, product,
}: { floristId: string; floristName: string; product?: ProductContext }) {
  const [open, setOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || conversationId || !signedIn) return;
    fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ floristId, product }),
    })
      .then(r => r.json())
      .then(d => { if (d.conversation) setConversationId(d.conversation.id); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, signedIn, conversationId, floristId]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setSignedIn(!!d.user))
      .catch(() => setSignedIn(false))
      .finally(() => setCheckingAuth(false));
  }, [open]);

  const loadMessages = useCallback(() => {
    if (!conversationId) return;
    fetch(`/api/messages?conversationId=${conversationId}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    if (!open || !conversationId) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [open, conversationId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (imageUrl?: string) => {
    if (!conversationId || (!text.trim() && !imageUrl)) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: text.trim() || undefined, imageUrl }),
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
    if (!file || !conversationId) return;
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

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="btn-secondary w-full justify-center flex items-center gap-2"
      >
        <MessageCircle size={15} /> Chat with Seller
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[60] w-full sm:w-96 h-[80vh] sm:h-[560px] bg-white sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "var(--primary)" }}>
                  {floristName[0]}
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate">{floristName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 flex-shrink-0"><X size={17} /></button>
            </div>

            {checkingAuth ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
            ) : !signedIn ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageCircle size={28} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-4">Sign in to chat with this shop.</p>
                <Link href="/login" className="btn-primary text-sm">Sign In</Link>
              </div>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.length === 0 && (
                    <p className="text-center text-xs text-gray-400 mt-6">Say hello! Ask about availability, custom orders, or delivery times.</p>
                  )}
                  {messages.map(m => {
                    const mine = m.sender_role === "buyer";
                    if (m.product_id) {
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <Link href={`/products/${m.product_id}`} className="max-w-[75%] flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl p-2.5 hover:border-gray-200 transition-colors">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {m.product_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.product_image} alt={m.product_name ?? "Product"} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><Flower2 size={16} /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{m.product_name}</p>
                              <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>RM{m.product_price}</p>
                            </div>
                          </Link>
                        </div>
                      );
                    }
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "text-white" : "bg-white border border-gray-100 text-gray-800"}`} style={mine ? { background: "var(--primary)" } : {}}>
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

                <div className="border-t border-gray-100 p-3 bg-white">
                  {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">{error}</p>}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading || !conversationId}
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
                      disabled={!conversationId}
                      className="flex-1 input-premium py-2.5 text-sm"
                    />
                    <button
                      onClick={() => send()}
                      disabled={sending || !text.trim() || !conversationId}
                      className="p-2.5 rounded-xl text-white disabled:opacity-50 flex-shrink-0 transition-colors"
                      style={{ background: "var(--primary)" }}
                    >
                      {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
