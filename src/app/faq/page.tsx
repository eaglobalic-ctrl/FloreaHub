"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeUp, stagger } from "@/lib/animations";

const FAQS = [
  {
    category: "Orders & Delivery",
    items: [
      { q: "How does same-day delivery work?", a: "Order before 2 PM and our nearest verified florist will prepare and deliver your flowers the same day. Look for the 'Same-Day' badge on products and florist profiles." },
      { q: "Can I track my flower delivery?", a: "Yes. Once your florist dispatches your order, you'll receive an SMS and email with tracking details. You can also view order status in real time from your account." },
      { q: "What is the delivery fee?", a: "Delivery fees vary by florist and location. The exact fee is shown at checkout before you pay. Some florists offer free delivery above a minimum order value." },
      { q: "Can I schedule delivery for a future date?", a: "Absolutely. During checkout, select your preferred delivery date. We recommend ordering at least 2–3 days in advance for special occasions." },
    ],
  },
  {
    category: "Real-Photo Promise",
    items: [
      { q: "What is the Real-Photo Promise?", a: "Before your florist dispatches your order, they send you a photo of the actual bouquet they've prepared. What you see is exactly what arrives at your door — no substitutions without approval." },
      { q: "What if the real photo doesn't match what I ordered?", a: "You can request changes or a full replacement before dispatch. If you're unsatisfied, contact our support team and we'll resolve it immediately — including a full refund if necessary." },
    ],
  },
  {
    category: "Freshness Guarantee",
    items: [
      { q: "What happens if my flowers aren't fresh?", a: "If your flowers wilt within 48 hours of delivery under normal conditions, contact us with a photo. We'll arrange a free replacement from the same florist — no questions asked." },
      { q: "How do I ensure flower longevity?", a: "Trim stems at a 45° angle, change water every 2 days, keep away from direct sunlight and drafts, and use the flower food sachet included in your order." },
    ],
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods are accepted?", a: "We accept FPX online banking (all Malaysian banks) and credit/debit cards via ToyyibPay, a PCI-compliant Malaysian payment gateway." },
      { q: "Is my payment information secure?", a: "Yes. Payments are processed by ToyyibPay with SSL encryption. FloreaHub never stores your card details." },
      { q: "Can I get a refund?", a: "Refunds are available for cancelled orders (before dispatch) or unresolved quality complaints. Approved refunds are processed within 3–7 business days." },
    ],
  },
  {
    category: "Florists & Accounts",
    items: [
      { q: "How do I find florists near me?", a: "Use the 'Find Florists' page and filter by location. You can search by state, area, delivery time, and specialty." },
      { q: "How do I register as a florist?", a: "Visit our florist registration page, fill in your shop details, and our team will review within 24–48 hours. It's free to list on the Starter plan." },
      { q: "Can I leave a review for a florist?", a: "Yes. After your order is delivered and confirmed, you'll receive an email invitation to leave a review. Reviews are verified purchases only." },
    ],
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(i => !search || i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase())),
  })).filter(cat => cat.items.length > 0);

  return (
    <>
      <Navbar />
      <main className="py-20 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h1 className="text-heading text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-subheading text-gray-500 mb-8">Everything you need to know about FloreaHub.</p>
            <div className="relative max-w-lg mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="input-premium w-full pl-11 py-3.5"
              />
            </div>
          </motion.div>

          <div className="space-y-8">
            {filtered.map(cat => (
              <motion.div key={cat.category} variants={fadeUp}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{cat.category}</h2>
                <div className="space-y-2">
                  {cat.items.map(({ q, a }) => (
                    <div key={q} className="card-premium overflow-hidden">
                      <button
                        onClick={() => setOpen(open === q ? null : q)}
                        className="w-full flex items-center justify-between p-5 text-left gap-4"
                      >
                        <span className="font-semibold text-gray-900 text-sm">{q}</span>
                        <ChevronDown size={18} className={`flex-shrink-0 text-gray-400 transition-transform ${open === q ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {open === q && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">{a}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-sm">No results for "{search}". Try a different keyword.</p>
              </div>
            )}
          </div>

          <motion.div variants={fadeUp} className="mt-14 card-premium p-8 text-center">
            <h3 className="font-bold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-sm text-gray-500 mb-5">Our support team is happy to help — usually within a few hours.</p>
            <a href="/contact" className="btn-primary inline-flex items-center gap-2">Contact Support</a>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
