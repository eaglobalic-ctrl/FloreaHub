"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Flower2, ArrowRight, ArrowLeft, Check, Store, MapPin, Tag, FileText } from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";

const STEPS = ["Business Info", "Shop Details", "Specialties", "Done"];
const SPECIALTIES = ["Wedding", "Birthday", "Anniversary", "Corporate", "Sympathy", "Luxury", "Custom", "Subscription", "Daily", "Bridal"];
const STATES = ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Perak", "Sabah", "Sarawak", "Kedah", "Kelantan", "Terengganu", "Pahang", "Negeri Sembilan", "Melaka", "Perlis"];

export default function FloristRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopName: "", ownerName: "", email: "", phone: "",
    state: "", area: "", address: "",
    sameDay: false, deliveryRadius: "10",
    specialties: [] as string[],
    bio: "",
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const toggleSpecialty = (s: string) => set("specialties", form.specialties.includes(s) ? form.specialties.filter(x => x !== s) : [...form.specialties, s]);

  const next = async () => {
    if (step < 2) { setStep(s => s + 1); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(3); }, 2000);
  };

  const canNext = [
    form.shopName && form.ownerName && form.email && form.phone,
    form.state && form.area && form.address,
    form.specialties.length > 0,
  ][step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-emerald-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="text-center mb-10">
          <motion.div variants={fadeUp}>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
                <Flower2 size={18} color="white" strokeWidth={1.8} />
              </div>
              <span className="text-xl font-semibold text-gray-900">Florea<span style={{ color: "var(--primary)" }}>Hub</span></span>
            </Link>
            {step < 3 && (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Flower Shop</h1>
                <p className="text-gray-500">Join 500+ verified florists on FloreaHub. Free to list.</p>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Progress */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "text-white" : i === step ? "text-white" : "bg-gray-100 text-gray-400"}`} style={i <= step ? { background: "var(--primary)" } : {}}>
                  {i < step ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${i === step ? "font-semibold text-gray-900" : "text-gray-400"}`}>{s}</span>
                {i < 2 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-gray-200"}`} style={i < step ? { background: "var(--primary)" } : {}} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card-premium p-8">
              <div className="flex items-center gap-2 mb-6 text-gray-700">
                <Store size={20} style={{ color: "var(--primary)" }} />
                <h2 className="text-lg font-semibold">Business Information</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name</label>
                    <input value={form.shopName} onChange={e => set("shopName", e.target.value)} placeholder="Bloom & Co." className="input-premium w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Name</label>
                    <input value={form.ownerName} onChange={e => set("ownerName", e.target.value)} placeholder="Nurul Aisyah" className="input-premium w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="shop@example.com" className="input-premium w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="01X-XXXXXXX" className="input-premium w-full" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card-premium p-8">
              <div className="flex items-center gap-2 mb-6 text-gray-700">
                <MapPin size={20} style={{ color: "var(--primary)" }} />
                <h2 className="text-lg font-semibold">Shop Location & Delivery</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                    <select value={form.state} onChange={e => set("state", e.target.value)} className="input-premium w-full">
                      <option value="">Select state...</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Area / City</label>
                    <input value={form.area} onChange={e => set("area", e.target.value)} placeholder="Mont Kiara" className="input-premium w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Address</label>
                  <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="No. 12, Jalan Kiara 3..." className="input-premium w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Radius (km)</label>
                  <select value={form.deliveryRadius} onChange={e => set("deliveryRadius", e.target.value)} className="input-premium w-full">
                    {["5", "10", "15", "20", "30", "50"].map(r => <option key={r} value={r}>{r} km</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <input type="checkbox" checked={form.sameDay} onChange={e => set("sameDay", e.target.checked)} className="rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Offer Same-Day Delivery</p>
                    <p className="text-xs text-gray-500">Accept orders before 2 PM for same-day delivery</p>
                  </div>
                </label>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card-premium p-8">
              <div className="flex items-center gap-2 mb-6 text-gray-700">
                <Tag size={20} style={{ color: "var(--primary)" }} />
                <h2 className="text-lg font-semibold">Your Specialties</h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">Select all that apply. This helps customers find your shop.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {SPECIALTIES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.specialties.includes(s) ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                    style={form.specialties.includes(s) ? { background: "var(--primary)", borderColor: "var(--primary)" } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Bio (optional)</label>
                <textarea
                  value={form.bio}
                  onChange={e => set("bio", e.target.value)}
                  rows={3}
                  placeholder="Tell customers what makes your shop special..."
                  className="input-premium w-full resize-none"
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-premium p-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "linear-gradient(135deg, var(--primary), #e87fa8)" }}
              >
                <Check size={36} color="white" strokeWidth={2.5} />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
              <p className="text-gray-500 mb-2 max-w-sm mx-auto">
                Welcome, <strong>{form.shopName}</strong>! Our team will review your application within <strong>24–48 hours</strong>.
              </p>
              <p className="text-sm text-gray-400 mb-8">Check your email at <strong>{form.email}</strong> for updates.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/pricing" className="btn-primary flex items-center justify-center gap-2">
                  <FileText size={16} /> View Pricing Plans
                </Link>
                <Link href="/" className="btn-secondary flex items-center justify-center gap-2">
                  Back to Home
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 3 && (
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(s => s - 1)} className={`flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors ${step === 0 ? "invisible" : ""}`}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              disabled={!canNext || loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>{step < 2 ? "Continue" : "Submit Application"} <ArrowRight size={16} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
