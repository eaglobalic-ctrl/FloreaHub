"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ShoppingBag, CreditCard, ArrowRight, Lock, Trash2, Flower2, MapPin, User, Phone, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getCart, removeFromCart, getCartTotal, CartItem } from "@/lib/cart";
import { fadeUp, stagger } from "@/lib/animations";

const PLAN_DETAILS: Record<string, { name: string; price: number; desc: string }> = {
  pro: { name: "Pro Plan (Monthly)", price: 99, desc: "Up to 50 listings, priority placement, analytics" },
  premium: { name: "Premium Plan (Monthly)", price: 199, desc: "Unlimited listings, featured placement, dedicated support" },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan");
  const planDetail = plan ? PLAN_DETAILS[plan] : null;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    recipientName: "", recipientPhone: "",
    address: "", city: "", deliveryDate: "", notes: "",
    sameAsContact: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!planDetail) setCart(getCart());
    const onUpdate = () => setCart(getCart());
    window.addEventListener("cart-updated", onUpdate);

    // Pre-fill from the signed-in session, if any
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        const u = d.user;
        if (u?.name) setForm(f => ({ ...f, name: u.name, recipientName: u.name }));
        if (u?.email) setForm(f => ({ ...f, email: u.email }));
      })
      .catch(() => {});

    return () => window.removeEventListener("cart-updated", onUpdate);
  }, [planDetail]);

  // Sync recipient fields when "same as contact" toggled
  useEffect(() => {
    if (form.sameAsContact) {
      setForm(f => ({ ...f, recipientName: f.name, recipientPhone: f.phone }));
    }
  }, [form.sameAsContact, form.name, form.phone]);

  const items = planDetail ? [{ id: plan!, name: planDetail.name, price: planDetail.price, quantity: 1, image: "", florist: "FloreaHub" }] : cart;
  const subtotal = planDetail ? planDetail.price : getCartTotal(cart);
  const deliveryFee = planDetail ? 0 : 15;
  const total = subtotal + deliveryFee;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) { setError("Please fill in all required fields."); return; }
    if (!planDetail && !form.address) { setError("Please enter a delivery address."); return; }
    setError("");
    setLoading(true);
    try {
      const deliveryAddress = form.address ? `${form.address}, ${form.city}`.trim().replace(/,\s*$/, "") : "";
      const res = await fetch("/api/toyyibpay/create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          name: form.name,
          email: form.email,
          phone: form.phone,
          description: planDetail ? planDetail.name : `FloreaHub Order (${cart.length} item${cart.length > 1 ? "s" : ""})`,
          referenceNo: `FH-${Date.now()}`,
          items: items,
          deliveryFee,
          recipientName: form.sameAsContact ? form.name : form.recipientName,
          recipientPhone: form.sameAsContact ? form.phone : form.recipientPhone,
          deliveryAddress,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError("Payment setup failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!planDetail && cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some beautiful flowers to your cart first.</p>
          <Link href="/shop" className="btn-primary">Browse Flowers</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
                <Flower2 size={15} color="white" strokeWidth={1.8} />
              </div>
              <span className="font-semibold text-gray-900">Florea<span style={{ color: "var(--primary)" }}>Hub</span></span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 text-sm">Checkout</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <motion.div variants={fadeUp} className="lg:col-span-3 space-y-5">

              {/* Contact */}
              <div className="card-premium p-6">
                <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-base">
                  <CreditCard size={17} style={{ color: "var(--primary)" }} /> Contact Details
                </h2>
                <form id="checkout-form" onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ahmad Razif" className="input-premium w-full pl-9" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="input-premium w-full" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01X-XXXXXXX" className="input-premium w-full pl-9" required />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Delivery */}
              {!planDetail && (
                <div className="card-premium p-6">
                  <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-base">
                    <MapPin size={17} style={{ color: "var(--primary)" }} /> Delivery Details
                  </h2>

                  <div className="space-y-4">
                    {/* Same as contact toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div
                        onClick={() => setForm(f => ({ ...f, sameAsContact: !f.sameAsContact }))}
                        className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${form.sameAsContact ? "" : "bg-gray-200"}`}
                        style={form.sameAsContact ? { background: "var(--primary)" } : {}}
                      >
                        <motion.div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" animate={{ left: form.sameAsContact ? "17px" : "2px" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      </div>
                      <span className="text-sm text-gray-600">Recipient is same as contact</span>
                    </label>

                    {!form.sameAsContact && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient Name *</label>
                          <input value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} placeholder="Name of receiver" className="input-premium w-full" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient Phone *</label>
                          <input type="tel" value={form.recipientPhone} onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))} placeholder="Receiver's phone" className="input-premium w-full" required />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address *</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                        <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} placeholder="Street, area, postcode" className="input-premium w-full pl-9 resize-none" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                        <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Kuala Lumpur" className="input-premium w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          <span className="flex items-center gap-1.5"><Calendar size={13} /> Delivery Date</span>
                        </label>
                        <input type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} min={new Date().toISOString().split("T")[0]} className="input-premium w-full" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="flex items-center gap-1.5"><FileText size={13} /> Special Instructions</span>
                      </label>
                      <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Anything special — message card text, preferred delivery time, etc." className="input-premium w-full resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>}

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Lock size={11} />
                <span>Secured by ToyyibPay · SSL encrypted · Your data is protected</span>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <div className="card-premium p-6 sticky top-24">
                <h2 className="font-bold text-gray-900 mb-5">Order Summary</h2>
                <div className="space-y-3 mb-5">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      {!planDetail && item.image && (
                        <div className="w-11 h-11 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          <Image src={item.image} alt={item.name} width={44} height={44} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.florist} · qty {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">RM{item.price * item.quantity}</span>
                        {!planDetail && (
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-400 transition-colors p-0.5">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {planDetail && <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg">{planDetail.desc}</p>}

                <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span><span>RM{subtotal.toFixed(2)}</span>
                  </div>
                  {!planDetail && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Delivery fee</span>
                      <span>{deliveryFee > 0 ? `RM${deliveryFee.toFixed(2)}` : <span className="text-emerald-600">Free</span>}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
                    <span>Total</span>
                    <span style={{ color: "var(--primary)" }}>RM{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  form="checkout-form"
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 text-base"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Pay RM{total.toFixed(2)}</span><ArrowRight size={16} /></>}
                </button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  You will be redirected to ToyyibPay to complete payment
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-2 border-gray-200 border-t-rose-500 rounded-full animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
