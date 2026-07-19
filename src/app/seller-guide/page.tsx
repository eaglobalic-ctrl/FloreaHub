import { motion } from "motion/react";
import { ArrowRight, Store, Camera, TrendingUp, Star, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const STEPS = [
  { n: "01", icon: Store, title: "Register Your Shop", desc: "Fill in your business details, location, and specialties. Approval takes 24–48 hours. Free to list.", color: "#b5294e" },
  { n: "02", icon: Camera, title: "Upload Your Products", desc: "Add photos, descriptions, and pricing for your arrangements. The better your photos, the more orders you get.", color: "#7c3aed" },
  { n: "03", icon: ShieldCheck, title: "Get Verified", desc: "Our team reviews your shop for quality. Get the Verified badge to build instant trust with buyers.", color: "#2d6a4f" },
  { n: "04", icon: Zap, title: "Start Receiving Orders", desc: "Orders come in via your dashboard. Confirm, prepare, photograph, and dispatch — all managed in one place.", color: "#f59e0b" },
  { n: "05", icon: TrendingUp, title: "Grow with Analytics", desc: "Track revenue, top-selling products, and customer reviews. Use insights to improve and scale.", color: "#3b82f6" },
  { n: "06", icon: Star, title: "Earn Reviews & Repeat Customers", desc: "Great service earns 5-star reviews. Reviews drive more visibility, more orders, and loyal customers.", color: "#b5294e" },
];

const FAQS = [
  { q: "How much does it cost to list on FloreaHub?", a: "Listing is free on the Starter plan. Pro (RM99/month) and Premium (RM199/month) plans unlock advanced features, priority placement, and analytics." },
  { q: "How do I receive payments?", a: "Customers pay via ToyyibPay (FPX or credit card). Funds are transferred to your registered bank account within 3–5 business days after delivery confirmation." },
  { q: "Can I offer same-day delivery?", a: "Yes. Enable same-day delivery in your shop settings. Orders before 2 PM qualify. You set your own delivery radius." },
  { q: "What is the Real-Photo Promise?", a: "Before dispatching any order, you send the customer a photo of their prepared bouquet via the FloreaHub platform. This builds trust and reduces disputes significantly." },
  { q: "Is there a commission?", a: "FloreaHub charges a platform fee of 5% per transaction. There are no hidden charges — you keep 95% of every sale." },
];

export default function SellerGuidePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-20" style={{ background: "linear-gradient(135deg, #b5294e 0%, #7c1d35 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-5">Grow your flower business<br />with FloreaHub</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">Join 500+ florists across Malaysia who are earning more, reaching more customers, and building a brand they're proud of.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register/florist" className="bg-white font-semibold px-7 py-3.5 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors" style={{ color: "var(--primary)" }}>
                Register Your Shop <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors">
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Active Florists" },
              { value: "5%", label: "Commission Only" },
              { value: "50K+", label: "Monthly Customers" },
              { value: "RM0", label: "To Start" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-gray-900 mb-1" style={{ color: "var(--primary)" }}>{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">How it works</h2>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 hidden md:block" />
              <div className="space-y-10">
                {STEPS.map(({ n, icon: Icon, title, desc, color }) => (
                  <div key={n} className="flex gap-6 items-start relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 border-4 border-gray-50" style={{ background: `${color}15` }}>
                      <Icon size={24} style={{ color }} />
                    </div>
                    <div className="pt-1">
                      <span className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-1 block">{n}</span>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Seller FAQ</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="card-premium p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{q}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gray-950 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to grow your flower business?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Free to join. First month on us. No credit card required.</p>
          <Link href="/register/florist" className="btn-primary inline-flex items-center gap-2 text-base py-3.5 px-8">
            Register Your Shop Free <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
