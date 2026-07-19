"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Check, RefreshCw, Heart, Star, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp, stagger } from "@/lib/animations";

const PLANS = [
  {
    id: "weekly",
    label: "Weekly",
    price: 65,
    saving: null,
    desc: "Fresh flowers every week — perfect for home or office.",
    deliveries: 4,
    perDelivery: "RM16.25",
    icon: RefreshCw,
  },
  {
    id: "monthly",
    label: "Monthly",
    price: 120,
    saving: "Save 15%",
    desc: "Once a month — ideal for special occasions or as a gift.",
    deliveries: 1,
    perDelivery: "RM120",
    icon: Heart,
    popular: true,
  },
  {
    id: "biweekly",
    label: "Bi-Weekly",
    price: 95,
    saving: "Save 10%",
    desc: "Every two weeks — a perfect balance of freshness and value.",
    deliveries: 2,
    perDelivery: "RM47.50",
    icon: Star,
  },
];

const OCCASIONS = ["Birthday", "Anniversary", "Office", "Self-care", "Mother's Day", "Valentine's"];
const PREFERENCES = ["Roses", "Lilies", "Sunflowers", "Mixed bouquet", "Tropical", "Pastel"];

export default function SubscriptionPage() {
  const [selected, setSelected] = useState("monthly");
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [occasion, setOccasion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (item: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);

  const selectedPlan = PLANS.find(p => p.id === selected)!;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-rose-50 to-white">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div variants={fadeUp}>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 tracking-widest uppercase" style={{ background: "rgba(181,41,78,0.08)", color: "var(--primary)" }}>Flower Subscription</span>
              <h1 className="text-heading text-gray-900 mb-4">Fresh flowers, on your schedule</h1>
              <p className="text-subheading text-gray-500 max-w-2xl mx-auto mb-10">
                Subscribe and receive curated fresh bouquets delivered to your door. New blooms every week, fortnight, or month — you choose.
              </p>
            </motion.div>

            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-premium p-10 max-w-md mx-auto text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg, var(--primary), #e87fa8)" }}>
                  <Check size={28} color="white" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Started!</h2>
                <p className="text-gray-500 mb-6">Your first delivery will arrive on <strong>{startDate || "your chosen date"}</strong>. We'll send a confirmation to your email.</p>
                <Link href="/" className="btn-primary w-full flex items-center justify-center gap-2">Back to FloreaHub <ArrowRight size={15} /></Link>
              </motion.div>
            ) : (
              <>
                {/* Step 1: Pick plan */}
                {step === 1 && (
                  <motion.div variants={fadeUp}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                      {PLANS.map(plan => {
                        const Icon = plan.icon;
                        const isActive = selected === plan.id;
                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSelected(plan.id)}
                            className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all ${isActive ? "border-transparent shadow-lg" : "border-gray-200 bg-white hover:border-gray-300"}`}
                            style={isActive ? { borderColor: "var(--primary)", background: "rgba(181,41,78,0.03)" } : {}}
                          >
                            {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "var(--primary)" }}>Most Popular</div>}
                            {plan.saving && <div className="absolute top-4 right-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{plan.saving}</div>}
                            <div className="flex items-center gap-2 mb-3">
                              <Icon size={18} style={{ color: isActive ? "var(--primary)" : "#9ca3af" }} />
                              <span className="font-semibold text-gray-900">{plan.label}</span>
                            </div>
                            <div className="mb-2">
                              <span className="text-3xl font-bold text-gray-900">RM{plan.price}</span>
                              <span className="text-gray-400 text-sm">/cycle</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{plan.desc}</p>
                            <p className="text-xs text-gray-400">{plan.deliveries} delivery/cycle · {plan.perDelivery} per delivery</p>
                            {isActive && (
                              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--primary)" }}>
                                <Check size={13} strokeWidth={2.5} /> Selected
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2 mx-auto">
                      Customise My Subscription <ArrowRight size={16} />
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Preferences */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-8 max-w-lg mx-auto text-left">
                    <h3 className="font-bold text-gray-900 mb-1">Customise Your Bouquet</h3>
                    <p className="text-sm text-gray-500 mb-5">Tell us your preferences so we curate the perfect blooms for you.</p>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Flower preferences</label>
                      <div className="flex flex-wrap gap-2">
                        {PREFERENCES.map(p => (
                          <button key={p} type="button" onClick={() => toggle(p, prefs, setPrefs)} className={`px-3 py-1.5 rounded-full text-sm border transition-all ${prefs.includes(p) ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:border-gray-300"}`} style={prefs.includes(p) ? { background: "var(--primary)", borderColor: "var(--primary)" } : {}}>{p}</button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary occasion</label>
                      <div className="relative">
                        <select value={occasion} onChange={e => setOccasion(e.target.value)} className="input-premium w-full appearance-none">
                          <option value="">Select occasion...</option>
                          {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">First delivery date</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-premium w-full" />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                      <Link href={`/checkout?plan=subscription&freq=${selected}&amount=${selectedPlan.price}`} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        Subscribe — RM{selectedPlan.price}/cycle <ArrowRight size={15} />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </section>

        {/* Perks */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">Every subscription includes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: "✦", title: "Curated Blooms", desc: "Hand-selected by expert florists based on your preferences." },
                { icon: "✦", title: "Real-Photo Preview", desc: "See your bouquet before it ships — always." },
                { icon: "✦", title: "Free Delivery", desc: "Included in your subscription price, always." },
                { icon: "✦", title: "Pause Anytime", desc: "Going on holiday? Pause your subscription with one click." },
              ].map(p => (
                <div key={p.title} className="text-center">
                  <div className="text-2xl mb-3" style={{ color: "var(--primary)" }}>{p.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{p.title}</h3>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
