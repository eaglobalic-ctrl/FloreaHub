"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Flower2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, AlertCircle, Store, ShoppingBag } from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<"buyer" | "florist">("buyer");
  const [form, setForm] = useState({ name: "", email: "", password: "", agree: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, role }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.existed) { setError("This email is already registered. Please sign in instead."); return; }
      // Only save to localStorage if approved (buyers) — pending florists can't login yet
      if (data.user.status !== "pending") {
        localStorage.setItem("floreahub_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("user-updated"));
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length >= 8
    ? (form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? "strong" : "medium")
    : form.password.length > 0 ? "weak" : "";

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

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" variants={fadeUp} initial="hidden" animate="show" className="card-premium p-10 text-center">
                {role === "florist" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                      <Check size={28} className="text-amber-600" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Permohonan diterima!</h2>
                    <p className="text-gray-500 mb-4">Terima kasih, {form.name.split(" ")[0]}. Permohonan florist kamu sedang dalam semakan.</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                      <p className="text-sm font-semibold text-amber-800 mb-2">Apa berlaku seterusnya:</p>
                      <ul className="text-sm text-amber-700 space-y-1.5 list-disc list-inside">
                        <li>Team kami akan semak dalam 1-2 hari bekerja</li>
                        <li>Kamu akan dapat email bila approved</li>
                        <li>Selepas approved, login dan setup kedai kamu</li>
                      </ul>
                    </div>
                    <Link href="/" className="btn-secondary w-full flex items-center justify-center gap-2">
                      Kembali ke Laman Utama
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <Check size={28} className="text-emerald-600" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Account created!</h2>
                    <p className="text-gray-500 mb-8">Welcome to FloreaHub, {form.name.split(" ")[0]}. Start exploring flowers.</p>
                    <Link href="/shop" className="btn-primary w-full flex items-center justify-center gap-2">
                      Browse Flowers <ArrowRight size={16} />
                    </Link>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="form">
                <motion.div variants={fadeUp} className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                  <p className="text-gray-500">Join thousands of flower lovers across Malaysia</p>
                </motion.div>

                <motion.div variants={fadeUp} className="card-premium p-8">
                  {/* Role selector */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">I want to...</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("buyer")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${role === "buyer" ? "border-rose-400 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        <ShoppingBag size={20} className={role === "buyer" ? "text-rose-500" : "text-gray-400"} />
                        Buy Flowers
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("florist")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${role === "florist" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        <Store size={20} className={role === "florist" ? "text-emerald-600" : "text-gray-400"} />
                        Sell as Florist
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {role === "florist" ? "Shop / Business name" : "Full name"}
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={role === "florist" ? "Petal Paradise" : "Ahmad Razif"} className="input-premium w-full pl-10" />
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
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        {error}
                      </div>
                    )}
                    <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base" style={role === "florist" ? { background: "var(--accent)" } : {}}>
                      {loading
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><span>{role === "florist" ? "Create Florist Account" : "Create Account"}</span><ArrowRight size={16} /></>}
                    </button>
                  </form>
                  <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>Sign in</Link>
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
