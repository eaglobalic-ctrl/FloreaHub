"use client";
import { Fragment, useState } from "react";
import { motion } from "motion/react";
import { Check, Zap, Star, Building2, ArrowRight, Flower2, Minus } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp, stagger } from "@/lib/animations";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Flower2,
    price: { monthly: 0, yearly: 0 },
    badge: null,
    desc: "Perfect for new florists testing the waters.",
    color: "#6b7280",
    features: [
      "Up to 5 product listings",
      "Basic shop profile",
      "FloreaHub branding",
      "Standard support",
      "Access to FloreaHub customers",
    ],
    cta: "Get Started Free",
    href: "/register/florist",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    price: { monthly: 99, yearly: 79 },
    badge: "Most Popular",
    desc: "Everything you need to grow your flower business.",
    color: "var(--primary)",
    features: [
      "Up to 50 product listings",
      "Priority search placement",
      "Real-Photo Promise badge",
      "Analytics dashboard",
      "Same-day delivery badge",
      "Custom shop banner",
      "Email support",
    ],
    cta: "Start Pro",
    href: "/checkout?plan=pro",
  },
  {
    id: "premium",
    name: "Premium",
    icon: Star,
    price: { monthly: 199, yearly: 159 },
    badge: "Best Value",
    desc: "For established florists serious about scaling.",
    color: "#2d6a4f",
    features: [
      "Unlimited product listings",
      "Featured homepage placement",
      "Verified Premium badge",
      "Advanced analytics & reports",
      "Subscription delivery support",
      "Dedicated account manager",
      "WhatsApp priority support",
      "Custom promotional campaigns",
    ],
    cta: "Start Premium",
    href: "/checkout?plan=premium",
  },
];

const COMPARISON = [
  {
    group: "Listings & Visibility",
    rows: [
      { label: "Product listings", values: ["Up to 5", "Up to 50", "Unlimited"] },
      { label: "Search placement", values: [false, "Priority", "Featured homepage"] },
      { label: "Shop banner", values: [false, false, true] },
      { label: "Verified badge", values: [false, "Real-Photo Promise", "Verified Premium"] },
      { label: "Same-day delivery badge", values: [false, true, true] },
    ],
  },
  {
    group: "Growth Tools",
    rows: [
      { label: "Analytics dashboard", values: [false, "Standard", "Advanced + reports"] },
      { label: "Promotional campaigns", values: [false, false, true] },
      { label: "Subscription delivery support", values: [false, false, true] },
    ],
  },
  {
    group: "Support",
    rows: [
      { label: "Support channel", values: ["Standard", "Email", "WhatsApp priority"] },
      { label: "Dedicated account manager", values: [false, false, true] },
    ],
  },
];

function ComparisonCell({ value, color }: { value: string | boolean; color: string }) {
  if (value === true) return <Check size={16} style={{ color }} strokeWidth={2.5} className="mx-auto" />;
  if (value === false) return <Minus size={14} className="text-gray-300 mx-auto" />;
  return <span className="text-sm text-gray-700 font-medium">{value}</span>;
}

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <>
      <Navbar />
      <main>
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 tracking-widest uppercase" style={{ background: "rgba(181,41,78,0.08)", color: "var(--primary)" }}>Pricing</span>
              <h1 className="text-heading text-gray-900 mb-4">Simple, transparent pricing</h1>
              <p className="text-subheading text-gray-500 max-w-xl mx-auto">Start free, upgrade when you're ready. No hidden fees, no long-term contracts.</p>

              {/* Toggle */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <span className={`text-sm font-medium ${!yearly ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
                <button
                  onClick={() => setYearly(!yearly)}
                  className="relative w-12 h-6 rounded-full transition-colors"
                  style={{ background: yearly ? "var(--primary)" : "#d1d5db" }}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${yearly ? "translate-x-7" : "translate-x-1"}`} />
                </button>
                <span className={`text-sm font-medium ${yearly ? "text-gray-900" : "text-gray-400"}`}>
                  Yearly <span className="text-emerald-600 font-semibold">Save 20%</span>
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {PLANS.map((plan, i) => {
                const Icon = plan.icon;
                const price = yearly ? plan.price.yearly : plan.price.monthly;
                const isPopular = plan.badge === "Most Popular";
                return (
                  <motion.div
                    key={plan.id}
                    variants={fadeUp}
                    className={`relative rounded-2xl p-8 border transition-all ${isPopular ? "shadow-2xl scale-105 border-transparent" : "border-gray-200 bg-white hover:shadow-lg"}`}
                    style={isPopular ? { background: "#fff", borderColor: "var(--primary)", boxShadow: `0 0 0 2px var(--primary), 0 25px 50px rgba(181,41,78,0.12)` } : {}}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: plan.color }}>
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}18` }}>
                        <Icon size={20} style={{ color: plan.color }} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    </div>
                    <div className="mb-2">
                      {price === 0 ? (
                        <span className="text-4xl font-bold text-gray-900">Free</span>
                      ) : (
                        <><span className="text-4xl font-bold text-gray-900">RM{price}</span><span className="text-gray-400 text-sm">/mo</span></>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <Check size={15} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} strokeWidth={2.5} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.href}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${isPopular ? "text-white" : "text-gray-900 bg-gray-100 hover:bg-gray-200"}`}
                      style={isPopular ? { background: "var(--primary)" } : {}}
                    >
                      {plan.cta} <ArrowRight size={15} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Full comparison */}
            <motion.div variants={fadeUp} className="mt-20">
              <h2 className="text-center text-xl font-bold text-gray-900 mb-2">Compare every feature</h2>
              <p className="text-center text-sm text-gray-500 mb-10">Everything included in each plan, side by side.</p>

              <div className="card-premium overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-medium text-gray-500 px-6 py-4 sticky left-0 bg-white">Feature</th>
                      {PLANS.map(plan => (
                        <th key={plan.id} className="px-6 py-4 text-center">
                          <span className="flex items-center justify-center gap-1.5 font-bold text-gray-900">
                            <plan.icon size={14} style={{ color: plan.color }} />
                            {plan.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((group) => (
                      <Fragment key={group.group}>
                        <tr className="bg-gray-50/70">
                          <td colSpan={PLANS.length + 1} className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0">
                            {group.group}
                          </td>
                        </tr>
                        {group.rows.map((row) => (
                          <tr key={row.label} className="border-b border-gray-50 last:border-0">
                            <td className="px-6 py-3.5 text-gray-600 sticky left-0 bg-white">{row.label}</td>
                            {row.values.map((value, i) => (
                              <td key={PLANS[i].id} className="px-6 py-3.5 text-center">
                                <ComparisonCell value={value} color={PLANS[i].color} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Enterprise */}
            <motion.div variants={fadeUp} className="mt-10 card-premium p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Building2 size={22} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Enterprise / Florist Chain</h3>
                  <p className="text-sm text-gray-500">Multiple branches, custom integrations, dedicated SLA. Let's talk.</p>
                </div>
              </div>
              <Link href="/contact" className="btn-secondary flex items-center gap-2 whitespace-nowrap">
                Contact Sales <ArrowRight size={15} />
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}
