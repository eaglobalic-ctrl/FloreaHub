"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShoppingBag, Clock, CheckCircle, Package, Truck, XCircle, ArrowRight, Flower2, Star } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp, stagger } from "@/lib/animations";
import { toast } from "@/components/Toast";
import TestimonialPrompt from "@/components/TestimonialPrompt";

type Order = {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  delivery_address?: string;
  florist_id?: string;
  tracking_number?: string | null;
  courier?: string | null;
  buyer_confirmed_at?: string | null;
  order_items?: { product_id?: string | null; product_name: string; florist_name: string; price: number; quantity: number; product_image?: string }[];
};

function ReviewForm({ onSubmit, onCancel }: { onSubmit: (rating: number, comment: string) => Promise<void>; onCancel: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(rating, comment);
    setSubmitting(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => setRating(n)}>
            <Star size={20} className={n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        placeholder="Macam mana pengalaman awak dengan florist ni?"
        className="input-premium w-full resize-none text-sm"
      />
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-xs py-2 px-4 disabled:opacity-50">
          {submitting ? "Menghantar..." : "Hantar Review"}
        </button>
        <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700 px-2">Batal</button>
      </div>
    </div>
  );
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:    <Clock size={14} className="text-amber-500" />,
  processing: <Package size={14} className="text-blue-500" />,
  ready:      <Package size={14} className="text-purple-500" />,
  delivering: <Truck size={14} className="text-indigo-500" />,
  delivered:  <CheckCircle size={14} className="text-emerald-500" />,
  cancelled:  <XCircle size={14} className="text-red-400" />,
};

const STATUS_LABEL: Record<string, string> = {
  pending:    "Order Confirmed",
  processing: "Florist Preparing",
  ready:      "Ready for Pickup",
  delivering: "Out for Delivery",
  delivered:  "Delivered",
  cancelled:  "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700 border-amber-100",
  processing: "bg-blue-50 text-blue-700 border-blue-100",
  ready:      "bg-purple-50 text-purple-700 border-purple-100",
  delivering: "bg-indigo-50 text-indigo-700 border-indigo-100",
  delivered:  "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled:  "bg-red-50 text-red-500 border-red-100",
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [reviewingKey, setReviewingKey] = useState<string | null>(null);
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirmReceipt = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, confirmReceipt: true }),
      });
      const data = await res.json();
      if (data.error) return;
      setOrders(list => list.map(o => o.id === orderId ? { ...o, buyer_confirmed_at: new Date().toISOString() } : o));
    } finally {
      setConfirmingId(null);
    }
  };

  // A review is per (order, product) — buying two different products in one
  // order should let a buyer rate each one separately, right where they see
  // that product, instead of one generic review for the whole order.
  const reviewKey = (orderId: string, productId?: string | null) => `${orderId}::${productId ?? "none"}`;

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (!d.user) { setLoading(false); return; }
        setUser(d.user);
        fetch("/api/reviews?mine=1")
          .then(r => r.json())
          .then(rd => setReviewedKeys(new Set((rd.reviews ?? []).map((r: { order_id: string; product_id?: string | null }) => reviewKey(r.order_id, r.product_id)))))
          .catch(() => {});
        return fetch(`/api/orders?buyerEmail=${encodeURIComponent(d.user.email)}`)
          .then(r => r.json())
          .then(od => setOrders(od.orders ?? []))
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  const submitReview = async (order: Order, productId: string | null | undefined, rating: number, comment: string) => {
    if (!order.florist_id || !user) return;
    const key = reviewKey(order.id, productId);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floristId: order.florist_id, productId: productId ?? null, orderId: order.id, rating, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewedKeys(prev => new Set(prev).add(key));
        setReviewingKey(null);
      } else {
        toast.error(data.error || "Failed to submit review.");
        if (res.status === 409) setReviewedKeys(prev => new Set(prev).add(key));
      }
    } catch { toast.error("Failed to submit review."); }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view orders</h2>
            <p className="text-gray-500 mb-6">You need to be logged in to see your order history.</p>
            <Link href="/login" className="btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
                <Flower2 size={13} color="white" strokeWidth={1.8} />
              </div>
            </Link>
            <span className="text-gray-400 text-sm">/</span>
            <span className="text-gray-600 text-sm">My Orders</span>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {user.name.split(" ")[0]}</p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <TestimonialPrompt context="buyer" />
          </motion.div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="card-premium p-6 h-28 animate-pulse bg-gray-100 rounded-2xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <motion.div variants={fadeUp} className="card-premium p-12 text-center">
              <ShoppingBag size={40} className="text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Start browsing our beautiful flower collection.</p>
              <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
                Browse Flowers <ArrowRight size={15} />
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={stagger} className="space-y-4">
              {orders.map(order => (
                <motion.div key={order.id} variants={fadeUp} className="card-premium p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-mono text-gray-400 mb-1">{order.id}</p>
                      <p className="text-sm text-gray-500">{timeAgo(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLOR[order.status] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                        {STATUS_ICON[order.status]}
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </div>
                  </div>

                  {order.order_items && order.order_items.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {order.order_items.map((item, i) => {
                        const key = reviewKey(order.id, item.product_id);
                        const canReview = order.status === "delivered" && order.florist_id && item.product_id;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-medium text-gray-800">{item.product_name}</span>
                                <span className="text-gray-400 mx-1.5">×{item.quantity}</span>
                                <span className="text-xs text-gray-400">{item.florist_name}</span>
                              </div>
                              <span className="font-semibold text-gray-700">RM{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            {canReview && (
                              reviewedKeys.has(key) ? (
                                <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1.5">
                                  <Star size={12} className="fill-emerald-600" /> Terima kasih atas review anda!
                                </p>
                              ) : reviewingKey === key ? (
                                <ReviewForm
                                  onSubmit={(rating, comment) => submitReview(order, item.product_id, rating, comment)}
                                  onCancel={() => setReviewingKey(null)}
                                />
                              ) : (
                                <button
                                  onClick={() => setReviewingKey(key)}
                                  className="mt-1.5 text-xs font-medium flex items-center gap-1.5 hover:opacity-80"
                                  style={{ color: "var(--primary)" }}
                                >
                                  <Star size={12} /> Review this product
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {order.tracking_number && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                      <Truck size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-600">{order.courier || "Courier"}</span>
                      {order.tracking_number.startsWith("http") ? (
                        <a href={order.tracking_number} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 truncate">
                          courier tracking link (opens {order.courier || "courier"} site)
                        </a>
                      ) : (
                        <><span className="text-gray-400">tracking:</span><span className="font-mono">{order.tracking_number}</span></>
                      )}
                    </div>
                  )}

                  {order.status === "delivered" && !order.buyer_confirmed_at && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
                      <p className="text-xs text-amber-800 mb-2">Dah terima pesanan ni? Sahkan supaya florist boleh terima bayaran.</p>
                      <button onClick={() => handleConfirmReceipt(order.id)} disabled={confirmingId === order.id} className="btn-primary text-xs py-2 px-4 w-full justify-center disabled:opacity-60">
                        {confirmingId === order.id ? "Confirming..." : "Confirm Received"}
                      </button>
                    </div>
                  )}
                  {order.buyer_confirmed_at && (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-600 mb-3">
                      <CheckCircle size={12} /> Receipt confirmed
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-sm">
                      {order.delivery_address && (
                        <p className="text-gray-500 text-xs truncate max-w-[200px]">{order.delivery_address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="font-bold text-gray-900" style={{ color: "var(--primary)" }}>RM{Number(order.total).toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
