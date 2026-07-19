"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Flower2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", agree: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1500);
  };

  const strength = form.password.length >= 8 ? (form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? "strong" : "medium") : form.password.length > 0 ? "weak" : "";

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white" style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          ))}
        </div>
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Flower2 size={18} color="white" strokeWidth={1.8} />
          </div>
          <span className="text-xl font-semibold text-white">FloreaHub</span>
        </Link>
        <div className="relative z-10 space-y-6">
          {[
            { title: "Real-Photo Promise", desc: "See the actual bouquet before it ships." },
            { title: "Freshness Guarantee", desc: "Not fresh? We replace it, no questions asked." },
            { title: "Occasion Reminders", desc: "Never forget birthdays or anniversaries again." },
          ].map(f => (
            <div key={f.title} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={12} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-white/60 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-md">
          <motion.div variants={fadeUp} className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
                <Flower2 size={18} color="white" strokeWidth={1.8} />
              </div>
              <span className="text-xl font-semibold text-gray-900">Florea<span style={{ color: "var(--primary)" }}>Hub</span></span>
            </Link>
          </motion.div>

          {done ? (
            <motion.div variants={fadeUp} className="card-premium p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Check size={28} className="text-emerald-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account created!</h2>
              <p className="text-gray-500 mb-8">Welcome to FloreaHub, {form.name.split(" ")[0]}. Start exploring.</p>
              <Link href="/" className="btn-primary w-full flex items-center justify-center gap-2">
                Browse Flowers <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div variants={fadeUp} className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                <p className="text-gray-500">Join thousands of flower lovers across Malaysia</p>
              </motion.div>

              <motion.div variants={fadeUp} className="card-premium p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ahmad Razif" className="input-premium w-full pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="input-premium w-full pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type={showPass ? "text" : "password"} required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" className="input-premium w-full pl-10 pr-11" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {strength && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                          {["weak", "medium", "strong"].map((lvl, i) => (
                            <div key={lvl} className="h-1 flex-1 rounded-full transition-colors" style={{ background: ["weak","medium","strong"].indexOf(strength) >= i ? (strength === "strong" ? "#2d6a4f" : strength === "medium" ? "#f59e0b" : "#ef4444") : "#e5e7eb" }} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{strength}</span>
                      </div>
                    )}
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" required checked={form.agree} onChange={e => setForm(f => ({ ...f, agree: e.target.checked }))} className="mt-0.5 rounded" />
                    <span className="text-sm text-gray-600">
                      I agree to FloreaHub's{" "}
                      <Link href="/terms" className="underline" style={{ color: "var(--primary)" }}>Terms</Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline" style={{ color: "var(--primary)" }}>Privacy Policy</Link>
                    </span>
                  </label>
                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><span>Create Account</span><ArrowRight size={16} /></>}
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>Sign in</Link>
                </p>
              </motion.div>

              <motion.p variants={fadeUp} className="text-center text-sm text-gray-400 mt-6">
                Are you a florist?{" "}
                <Link href="/register/florist" className="underline text-gray-600">Register your shop</Link>
              </motion.p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
