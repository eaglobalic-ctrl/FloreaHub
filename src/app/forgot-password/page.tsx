"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Flower2, Mail, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch { /* ignore — always show the generic success state */ }
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-md">
        <motion.div variants={fadeUp} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Flower2 size={20} color="white" strokeWidth={1.8} />
            </div>
            <span className="text-xl font-semibold text-gray-900">Florea<span style={{ color: "var(--primary)" }}>Hub</span></span>
          </Link>
        </motion.div>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-premium p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm mb-8">
              We've sent a password reset link to <strong>{email}</strong>. Check your spam folder if you don't see it.
            </p>
            <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2">
              Back to Sign In <ArrowRight size={15} />
            </Link>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="card-premium p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset your password</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-premium w-full pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Send Reset Link</span><ArrowRight size={16} /></>}
              </button>
            </form>
            <div className="mt-5 text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1.5 transition-colors">
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
