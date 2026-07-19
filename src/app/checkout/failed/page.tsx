"use client";
import { motion } from "motion/react";
import { XCircle, ArrowLeft, Flower2, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function CheckoutFailedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Flower2 size={18} color="white" strokeWidth={1.8} />
          </div>
          <span className="text-xl font-semibold text-gray-900">Florea<span style={{ color: "var(--primary)" }}>Hub</span></span>
        </Link>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }} className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-8">
          <XCircle size={48} className="text-red-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Failed</h1>
          <p className="text-gray-500 mb-2">Your payment could not be processed.</p>
          <p className="text-sm text-gray-400 mb-8">No charges have been made. Please try again or use a different payment method.</p>

          <div className="card-premium p-5 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Common reasons for failure:</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex gap-2"><span className="text-red-400">•</span>Insufficient funds in your account</li>
              <li className="flex gap-2"><span className="text-red-400">•</span>Bank declined the transaction</li>
              <li className="flex gap-2"><span className="text-red-400">•</span>Incorrect card details or OTP timeout</li>
              <li className="flex gap-2"><span className="text-red-400">•</span>Internet connection was interrupted</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/checkout" className="btn-primary flex items-center justify-center gap-2 flex-1">
              <RefreshCw size={15} /> Try Again
            </Link>
            <Link href="/shop" className="btn-secondary flex items-center justify-center gap-2 flex-1">
              <ArrowLeft size={15} /> Back to Shop
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400">Need help? <Link href="/contact" className="underline">Contact our support team</Link></p>
        </motion.div>
      </motion.div>
    </div>
  );
}
