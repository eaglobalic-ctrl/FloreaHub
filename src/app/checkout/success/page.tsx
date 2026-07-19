"use client";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Check, Flower2, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { clearCart } from "@/lib/cart";

export default function CheckoutSuccessPage() {
  useEffect(() => { clearCart(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Flower2 size={18} color="white" strokeWidth={1.8} />
          </div>
          <span className="text-xl font-semibold text-gray-900">Florea<span style={{ color: "var(--primary)" }}>Hub</span></span>
        </Link>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
          style={{ background: "linear-gradient(135deg, #2d6a4f, #40916c)" }}
        >
          <Check size={42} color="white" strokeWidth={2.5} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
          <p className="text-gray-500 mb-2">Your order has been confirmed and sent to the florist.</p>
          <p className="text-sm text-gray-400 mb-8">You'll receive a confirmation email shortly with your order details and tracking.</p>

          <div className="card-premium p-5 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">What happens next?</h3>
            <div className="space-y-3">
              {[
                { step: "1", text: "Your florist receives the order and confirms availability." },
                { step: "2", text: "They'll send you a real photo of your bouquet before dispatch." },
                { step: "3", text: "Fresh flowers delivered to your door on time." },
              ].map(item => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "var(--primary)" }}>
                    {item.step}
                  </div>
                  <p className="text-sm text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/shop" className="btn-primary flex items-center justify-center gap-2 flex-1">
              Continue Shopping <ArrowRight size={15} />
            </Link>
            <Link href="/reminders" className="btn-secondary flex items-center justify-center gap-2 flex-1">
              <Star size={15} /> Set Reminders
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
