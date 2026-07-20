"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShoppingBag, Clock, CheckCircle, Package, Truck, XCircle, ArrowRight, Flower2, Star } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp, stagger } from "@/lib/animations";

type Order = {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  delivery_address?: string;
  florist_id?: string;
  order_items?: { product_name: string; florist_name: string; price: number; quantity: number; product_image?: string }[];
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
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (!d.user) { setLoading(false); return; }
        setUser(d.user);
        return fetch(`/api/orders?buyerEmail=${encodeURIComponent(d.user.email)}`)
          .then(r => r.json())
          .then(od => setOrders(od.orders ?? []))
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  const submitReview = async (order: Order, rating: number, comment: string) => {
    if (!order.florist_id || !user) return;
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floristId: order.florist_id, orderId: order.id, rating, comment }),
      });
      if (res.ok) {
        setReviewedOrderIds(prev => new Set(prev).add(order.id));
        setReviewingOrderId(null);
      }
    } catch { /* ignore */ }
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
                    <div className="space-y-2 mb-4">
                      {order.order_items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-gray-800">{item.product_name}</span>
                            <span className="text-gray-400 mx-1.5">×{item.quantity}</span>
                            <span className="text-xs text-gray-400">{item.florist_name}</span>
                          </div>
                          <span className="font-semibold text-gray-700">RM{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
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

                  {order.status === "delivered" && order.florist_id && (
                    reviewedOrderIds.has(order.id) ? (
                      <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-emerald-600 flex items-center gap-1.5">
                        <Star size={13} className="fill-emerald-600" /> Terima kasih atas review anda!
                      </p>
                    ) : reviewingOrderId === order.id ? (
                      <ReviewForm
                        onSubmit={(rating, comment) => submitReview(order, rating, comment)}
                        onCancel={() => setReviewingOrderId(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setReviewingOrderId(order.id)}
                        className="mt-3 pt-3 border-t border-gray-100 w-full text-left text-xs font-medium flex items-center gap-1.5 hover:opacity-80"
                        style={{ color: "var(--primary)" }}
                      >
                        <Star size={13} /> Leave a Review
                      </button>
                    )
                  )}
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
