"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus, Check, ChevronRight, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { stagger, scaleIn } from "@/lib/animations";
import { addToCart } from "@/lib/cart";

const FLOWERS = [
  { id: "rose-red", name: "Red Rose", variety: "Rosa", price: 8 },
  { id: "rose-pink", name: "Pink Rose", variety: "Rosa", price: 8 },
  { id: "lily", name: "White Lily", variety: "Lilium", price: 10 },
  { id: "sunflower", name: "Sunflower", variety: "Helianthus", price: 6 },
  { id: "tulip", name: "Purple Tulip", variety: "Tulipa", price: 12 },
  { id: "daisy", name: "Daisy", variety: "Bellis", price: 5 },
  { id: "orchid", name: "Orchid", variety: "Orchidaceae", price: 15 },
  { id: "hydrangea", name: "Hydrangea", variety: "H. macrophylla", price: 11 },
];

const WRAPS = [
  { id: "kraft", name: "Kraft Paper", desc: "Classic & natural", price: 0 },
  { id: "lace", name: "White Lace", desc: "Elegant & romantic", price: 10 },
  { id: "velvet", name: "Red Velvet", desc: "Luxurious feel", price: 15 },
  { id: "clear", name: "Clear Film", desc: "Modern & minimal", price: 8 },
];

const RIBBONS = [
  { id: "blush", name: "Blush", hex: "#f4a4b0" },
  { id: "crimson", name: "Crimson", hex: "#c0392b" },
  { id: "gold", name: "Gold", hex: "#c9a84c" },
  { id: "ivory", name: "Ivory", hex: "#e8e0d0" },
  { id: "sage", name: "Sage", hex: "#87a98a" },
  { id: "navy", name: "Navy", hex: "#2c3e6b" },
];

const STEPS = ["Select Blooms", "Wrapping", "Message", "Review"];

type Sel = { id: string; qty: number };

export default function BuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Sel[]>([]);
  const [wrap, setWrap] = useState("kraft");
  const [ribbon, setRibbon] = useState("blush");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [occasion, setOccasion] = useState("");

  const add = (id: string) =>
    setSelections((p) => p.find((s) => s.id === id) ? p.map((s) => s.id === id ? { ...s, qty: s.qty + 1 } : s) : [...p, { id, qty: 1 }]);
  const remove = (id: string) =>
    setSelections((p) => { const e = p.find((s) => s.id === id); if (!e) return p; return e.qty === 1 ? p.filter((s) => s.id !== id) : p.map((s) => s.id === id ? { ...s, qty: s.qty - 1 } : s); });

  const qty = (id: string) => selections.find((s) => s.id === id)?.qty ?? 0;
  const total = selections.reduce((s, x) => { const f = FLOWERS.find((fl) => fl.id === x.id); return s + (f ? f.price * x.qty : 0); }, 0);
  const wrapCost = WRAPS.find((w) => w.id === wrap)?.price ?? 0;
  const totalFlowers = selections.reduce((s, x) => s + x.qty, 0);
  const grandTotal = total + wrapCost + 20;
  const canNext = step === 0 ? totalFlowers >= 3 : true;

  const stepContent: Record<number, React.ReactNode> = {
    0: (
      <div>
        <p className="text-sm text-gray-500 mb-6">Select at least 3 stems to continue. Mix and match as you like.</p>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FLOWERS.map((f) => {
            const q = qty(f.id);
            const selected = q > 0;
            return (
              <motion.div key={f.id} variants={scaleIn} whileHover={{ y: -2 }}
                className={`relative p-4 rounded-xl border-2 transition-all ${selected ? "border-rose-300 bg-rose-50/50" : "border-gray-100 bg-white hover:border-gray-200"}`}
              >
                <AnimatePresence>
                  {selected && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                      {q}
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="mb-3">
                  <div className="font-semibold text-gray-900 text-sm">{f.name}</div>
                  <div className="text-xs text-gray-400 italic">{f.variety}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: "var(--primary)" }}>RM{f.price} / stem</div>
                </div>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {selected && (
                      <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        onClick={() => remove(f.id)}
                        className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <Minus size={11} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => add(f.id)}
                    className="w-6 h-6 rounded-md text-white flex items-center justify-center transition-colors" style={{ background: "var(--primary)" }}>
                    <Plus size={11} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        <AnimatePresence>
          {totalFlowers > 0 && totalFlowers < 3 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-amber-600 mt-5">
              Add {3 - totalFlowers} more stem{3 - totalFlowers > 1 ? "s" : ""} to continue
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    ),

    1: (
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Wrapping Style</h3>
          <div className="grid grid-cols-2 gap-3">
            {WRAPS.map((w) => (
              <motion.button key={w.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setWrap(w.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${wrap === w.id ? "" : "border-gray-100 bg-white hover:border-gray-200"}`}
                style={wrap === w.id ? { borderColor: "var(--primary)", background: "var(--primary-light)" } : {}}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-sm text-gray-900">{w.name}</div>
                  {wrap === w.id && <Check size={14} style={{ color: "var(--primary)" }} />}
                </div>
                <div className="text-xs text-gray-500 mb-2">{w.desc}</div>
                <div className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{w.price === 0 ? "Included" : `+RM${w.price}`}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ribbon Colour</h3>
          <div className="flex flex-wrap gap-3">
            {RIBBONS.map((r) => (
              <motion.button key={r.id} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={() => setRibbon(r.id)} title={r.name}
                className={`w-9 h-9 rounded-full border-4 transition-all ${ribbon === r.id ? "border-gray-800 scale-110" : "border-white shadow-md"}`}
                style={{ background: r.hex }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{RIBBONS.find((r) => r.id === ribbon)?.name} ribbon selected</p>
        </div>
      </div>
    ),

    2: (
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Recipient Name</label>
          <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Mum, Sarah, Mr. Razif..."
            className="input-premium" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Occasion</label>
          <div className="grid grid-cols-3 gap-2">
            {["Birthday", "Anniversary", "Wedding", "Mother's Day", "Thank You", "Just Because"].map((o) => (
              <motion.button key={o} whileTap={{ scale: 0.95 }} onClick={() => setOccasion(o)}
                className={`py-2.5 px-3 rounded-lg text-xs font-medium border-2 transition-colors text-left ${occasion === o ? "text-white border-transparent" : "border-gray-100 text-gray-600 hover:border-gray-200 bg-white"}`}
                style={occasion === o ? { background: "var(--primary)" } : {}}
              >{o}</motion.button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Personal Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a heartfelt message..." rows={4} maxLength={150}
            className="input-premium resize-none" />
          <div className="text-xs text-gray-400 text-right mt-1">{message.length}/150</div>
        </div>
      </div>
    ),

    3: (
      <div className="space-y-5">
        <div className="p-5 rounded-xl border border-gray-100 bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h3>

          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Blooms ({totalFlowers} stems)</p>
            <div className="flex flex-wrap gap-2">
              {selections.map((s) => { const f = FLOWERS.find((fl) => fl.id === s.id); return f ? (
                <motion.span key={s.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg font-medium text-gray-700">
                  {f.name} × {s.qty}
                </motion.span>
              ) : null; })}
            </div>
          </div>

          <div className="divide-y divide-gray-50 text-sm">
            <div className="flex justify-between py-2.5 text-gray-600">
              <span>Wrapping</span>
              <span>{WRAPS.find((w) => w.id === wrap)?.name}</span>
            </div>
            {recipient && <div className="flex justify-between py-2.5 text-gray-600"><span>Recipient</span><span className="font-medium">{recipient}</span></div>}
            {occasion && <div className="flex justify-between py-2.5 text-gray-600"><span>Occasion</span><span>{occasion}</span></div>}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-100 bg-white">
          <div className="divide-y divide-gray-50 text-sm">
            <div className="flex justify-between py-2.5 text-gray-500"><span>Blooms ({totalFlowers})</span><span>RM{total}</span></div>
            <div className="flex justify-between py-2.5 text-gray-500"><span>Wrapping</span><span>{wrapCost === 0 ? "Included" : `RM${wrapCost}`}</span></div>
            <div className="flex justify-between py-2.5 text-gray-500"><span>Base fee</span><span>RM20</span></div>
            <div className="flex justify-between py-3 font-bold text-base text-gray-900">
              <span>Total</span>
              <motion.span key={grandTotal} initial={{ scale: 1.1 }} animate={{ scale: 1 }} style={{ color: "var(--primary)" }}>RM{grandTotal}</motion.span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            addToCart({
              id: `builder-${Date.now()}`,
              name: `Custom Bouquet (${totalFlowers} stems, ${WRAPS.find(w => w.id === wrap)?.name})`,
              price: grandTotal,
              image: "",
              florist: "FloreaHub Builder",
            });
            router.push("/checkout");
          }}
          className="btn-primary w-full py-4 justify-center text-sm gap-2"
        >
          <ShoppingBag size={15} /> Place Order — RM{grandTotal}
        </motion.button>
      </div>
    ),
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-heading text-gray-900 mb-2">
            Bouquet Builder
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-gray-500">
            Design a bespoke arrangement — your blooms, your wrapping, your message.
          </motion.p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-center relative">
            <div className="absolute top-4 left-4 right-4 h-px bg-gray-100" />
            <motion.div className="absolute top-4 left-4 h-px" style={{ background: "var(--primary)", zIndex: 1 }}
              animate={{ width: `${(step / (STEPS.length - 1)) * (100 - 4)}%` }}
              transition={{ duration: 0.4 }}
            />
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-2 flex-1 relative z-10">
                <motion.div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
                  animate={{
                    background: i < step ? "var(--primary)" : i === step ? "var(--primary)" : "#f3f4f6",
                    color: i <= step ? "#fff" : "#9ca3af",
                    scale: i === step ? 1.1 : 1,
                  }}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </motion.div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Step Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">{STEPS[step]}</h2>
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {stepContent[step]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-4">
              {step > 0 && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(step - 1)} className="btn-secondary flex-1 text-sm justify-center">
                  Back
                </motion.button>
              )}
              {step < 3 && (
                <motion.button whileHover={canNext ? { scale: 1.01 } : {}} whileTap={canNext ? { scale: 0.97 } : {}}
                  onClick={() => canNext && setStep(step + 1)}
                  className={`btn-primary flex-1 text-sm justify-center gap-1.5 ${!canNext ? "opacity-40 cursor-not-allowed hover:transform-none hover:shadow-none" : ""}`}
                >
                  Continue <ChevronRight size={13} />
                </motion.button>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-32">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Bouquet</h3>

              <div className="h-44 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 overflow-hidden">
                {totalFlowers === 0 ? (
                  <div className="text-center">
                    <div className="text-3xl mb-2 opacity-30">✿</div>
                    <p className="text-xs text-gray-400">Select blooms to preview</p>
                  </div>
                ) : (
                  <motion.div className="p-4 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                    <div className="flex flex-wrap justify-center gap-1 mb-2">
                      {selections.flatMap((s) => {
                        const flowerChars: Record<string, string> = {
                          "rose-red": "✿", "rose-pink": "✾", lily: "❀", sunflower: "✺",
                          tulip: "❁", daisy: "✼", orchid: "✻", hydrangea: "❃",
                        };
                        return Array(Math.min(s.qty, 4)).fill(flowerChars[s.id] ?? "✿");
                      }).slice(0, 12).map((ch, i) => (
                        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.04 }}
                          className="text-xl" style={{ color: "var(--primary)" }}>{ch}</motion.span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{totalFlowers} stems selected</p>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {[
                  { label: "Blooms", value: `RM${total}` },
                  { label: "Wrapping", value: wrapCost === 0 ? "Included" : `RM${wrapCost}` },
                  { label: "Base fee", value: "RM20" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-gray-500">
                    <span>{row.label}</span><span>{row.value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900">
                  <span>Estimated total</span>
                  <motion.span key={grandTotal} initial={{ scale: 1.15 }} animate={{ scale: 1 }} style={{ color: "var(--primary)" }}>
                    RM{grandTotal}
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
