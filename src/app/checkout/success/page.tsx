"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check, Flower2, ArrowRight, ShoppingBag, MapPin, Phone, Clock, Package, Loader2, Star, MessageCircle } from "lucide-react";
import Link from "next/link";
import { clearCart } from "@/lib/cart";

type Order = {
  id: string; total: number; status: string; payment_status: string;
  recipient_name?: string; recipient_phone?: string; delivery_address?: string;
  created_at: string; bill_code?: string;
  order_items?: { product_name: string; florist_name: string; price: number; quantity: number }[];
  florists?: { id: string; name: string } | null;
};

const STATUS_STEPS = [
  { key: "pending",    label: "Order Confirmed",   desc: "Your order has been received" },
  { key: "processing", label: "Florist Preparing",  desc: "Florist is arranging your flowers" },
  { key: "ready",      label: "Ready for Pickup",   desc: "Waiting for delivery pickup" },
  { key: "delivering", label: "Out for Delivery",   desc: "On the way to you" },
  { key: "delivered",  label: "Delivered",          desc: "Enjoy your flowers!" },
];

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const messageSeller = async (floristId: string) => {
    setMessagingId(floristId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floristId }),
      });
      const data = await res.json();
      if (data.conversation?.id) {
        router.push(`/messages?conversationId=${data.conversation.id}`);
      } else {
        router.push("/messages");
      }
    } catch {
      router.push("/messages");
    } finally {
      setMessagingId(null);
    }
  };

  useEffect(() => {
    // ToyyibPay sends every outcome here (success, failed, cancelled) —
    // status_id=1 is the only one that actually means paid. Anything else
    // must NOT show "Payment Successful" or clear the cart.
    const statusId = searchParams.get("status_id") || searchParams.get("status");
    if (statusId && statusId !== "1") {
      router.replace("/checkout/failed");
      return;
    }

    clearCart();

    // ToyyibPay returns: ?billcode=XXX&refno=FH-XXX&status_id=1
    // A multi-seller cart creates one order row per florist sharing the
    // same bill_code/reference group, so either lookup can return several.
    const refno = searchParams.get("refno") || searchParams.get("billExternalReferenceNo");
    const billcode = searchParams.get("billcode");

    const fetchOrders = async () => {
      if (refno) {
        const res = await fetch(`/api/orders?id=${refno}`).catch(() => null);
        if (res?.ok) {
          const d = await res.json();
          if (d.orders?.length) { setOrders(d.orders); setLoading(false); return; }
        }
      }
      if (billcode) {
        const res = await fetch(`/api/orders?billCode=${billcode}`).catch(() => null);
        if (res?.ok) {
          const d = await res.json();
          if (d.orders?.length) { setOrders(d.orders); setLoading(false); return; }
        }
      }
      setLoading(false);
    };

    fetchOrders();
  }, [searchParams]);

  const totalPaid = orders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Flower2 size={18} color="white" strokeWidth={1.8} />
          </div>
          <span className="text-xl font-semibold text-gray-900">Florea<span style={{ color: "var(--primary)" }}>Hub</span></span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Success icon */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
              style={{ background: "linear-gradient(135deg, #2d6a4f, #40916c)" }}
            >
              <Check size={36} color="white" strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500">Your order has been confirmed and sent to the florist.</p>
          </div>

          {/* Order details */}
          {loading ? (
            <div className="card-premium p-8 flex items-center justify-center mb-5">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : orders.length > 0 ? (
            <>
              {orders.length > 1 && (
                <div className="flex justify-between items-center mb-4 px-1">
                  <p className="text-sm text-gray-500">{orders.length} sellers · shipped separately</p>
                  <p className="font-bold text-gray-900">Total Paid <span style={{ color: "var(--primary)" }}>RM{totalPaid.toFixed(2)}</span></p>
                </div>
              )}

              {orders.map(order => {
                const currentStep = STATUS_STEPS.findIndex(s => s.key === order.status);
                return (
                  <div key={order.id} className="mb-5">
                    {/* Order summary card */}
                    <div className="card-premium p-6 mb-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                          {orders.length > 1 ? (order.order_items?.[0]?.florist_name ?? "Order") : "Order Summary"}
                        </h3>
                        <span className="text-xs font-mono text-gray-400">{order.id}</span>
                      </div>

                      {/* Items */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                          {order.order_items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-medium text-gray-800">{item.product_name}</span>
                                <span className="text-gray-400 ml-1.5">×{item.quantity}</span>
                                {orders.length === 1 && <p className="text-xs text-gray-400">{item.florist_name}</p>}
                              </div>
                              <span className="font-semibold text-gray-900">RM{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-gray-900 mb-5">
                        <span>{orders.length > 1 ? "Subtotal + delivery" : "Total Paid"}</span>
                        <span style={{ color: "var(--primary)" }}>RM{Number(order.total).toFixed(2)}</span>
                      </div>

                      {/* Delivery info */}
                      {(order.recipient_name || order.delivery_address) && (
                        <div className="space-y-2 text-sm">
                          {order.recipient_name && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Package size={13} className="text-gray-400 flex-shrink-0" />
                              {order.recipient_name}
                            </div>
                          )}
                          {order.recipient_phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone size={13} className="text-gray-400 flex-shrink-0" />
                              {order.recipient_phone}
                            </div>
                          )}
                          {order.delivery_address && (
                            <div className="flex items-start gap-2 text-gray-600">
                              <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                              {order.delivery_address}
                            </div>
                          )}
                        </div>
                      )}

                      {order.florists?.id && (
                        <button
                          onClick={() => messageSeller(order.florists!.id)}
                          disabled={messagingId === order.florists.id}
                          className="btn-secondary w-full mt-5 flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-60"
                        >
                          {messagingId === order.florists.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : <MessageCircle size={15} />}
                          Message {order.florists.name}
                        </button>
                      )}
                    </div>

                    {/* Order tracker */}
                    <div className="card-premium p-6">
                      <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                        <Clock size={15} style={{ color: "var(--primary)" }} /> Order Status
                      </h3>
                      <div className="space-y-4">
                        {STATUS_STEPS.slice(0, 4).map((step, i) => {
                          const done = i <= currentStep;
                          const active = i === currentStep;
                          return (
                            <div key={step.key} className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${done ? "shadow-sm" : "bg-gray-100"}`}
                                style={done ? { background: active ? "var(--primary)" : "var(--accent)" } : {}}>
                                {done ? <Check size={12} color="white" strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${active ? "text-gray-900" : done ? "text-gray-600" : "text-gray-300"}`}>{step.label}</p>
                                <p className={`text-xs ${active ? "text-gray-500" : "text-gray-300"}`}>{step.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            /* Generic success (no order found) */
            <div className="card-premium p-6 mb-5">
              <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
              <div className="space-y-3">
                {[
                  "Your florist receives the order and confirms availability.",
                  "They'll send you a real photo of your bouquet before dispatch.",
                  "Fresh flowers delivered to your door on time.",
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "var(--primary)" }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/shop" className="btn-primary flex items-center justify-center gap-2 flex-1 py-3">
              <ShoppingBag size={15} /> Continue Shopping
            </Link>
            <Link href="/reminders" className="btn-secondary flex items-center justify-center gap-2 flex-1 py-3">
              <Star size={15} /> Set Reminders
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Questions? <Link href="/contact" className="underline hover:text-gray-600">Contact support</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
