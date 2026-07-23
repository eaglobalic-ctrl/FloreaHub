"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Flower2, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check } from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="card-premium p-10 text-center max-w-md">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-500 text-sm mb-6">This password reset link is incomplete. Please request a new one.</p>
          <Link href="/forgot-password" className="btn-primary">Request New Link</Link>
        </div>
      </div>
    );
  }

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

        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-premium p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated</h2>
            <p className="text-gray-500 text-sm mb-8">Please sign in with your new password.</p>
            <button onClick={() => router.push("/login")} className="btn-primary w-full flex items-center justify-center gap-2">
              Sign In <ArrowRight size={15} />
            </button>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="card-premium p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Set New Password</h1>
            <p className="text-gray-500 text-sm mb-6">Enter a new password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type={showPass ? "text" : "password"} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className="input-premium w-full pl-10 pr-11" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input type={showPass ? "text" : "password"} required minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-type password" className="input-premium w-full" />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Set New Password</span><ArrowRight size={16} /></>}
              </button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-emerald-50">
        <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
