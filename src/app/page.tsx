"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import {
  Search, MapPin, ArrowRight, Star, Zap, Leaf, Camera, Bell,
  Palette, RefreshCw, Shield, CheckCircle, ChevronRight,
  Gem, Gift, Heart, Building2, Feather, Sun
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloristCard from "@/components/FloristCard";
import SponsoredBanner from "@/components/SponsoredBanner";
import SponsoredFlorists from "@/components/SponsoredFlorists";
import TestimonialsColumn from "@/components/ui/testimonials-column";
import { FLORISTS, CATEGORIES, WOW_FEATURES, STATS, TESTIMONIALS } from "@/lib/data";
import { fadeUp, stagger, scaleIn, popIn, floatAnim } from "@/lib/animations";

const ICON_MAP: Record<string, React.ElementType> = {
  camera: Camera, leaf: Leaf, bell: Bell, palette: Palette,
  "refresh-cw": RefreshCw, zap: Zap, gem: Gem, gift: Gift,
  heart: Heart, building2: Building2, feather: Feather, sun: Sun,
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  wedding: Gem, birthday: Gift, anniversary: Heart,
  corporate: Building2, sympathy: Feather, daily: Sun,
};

function InViewSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/florists");
  };

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />
      <SponsoredBanner />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-[0.06] blur-3xl" style={{ background: "var(--primary)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl" style={{ background: "var(--accent)", transform: "translate(-30%, 30%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 lg:pt-28 lg:pb-36">
          <div className="grid lg:grid-cols-2 gap-20 items-center">

            {/* Left */}
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={popIn}>
                <span
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-8 tracking-wide uppercase"
                  style={{ color: "var(--primary)", borderColor: "rgba(181,41,78,0.2)", background: "var(--primary-light)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Malaysia's #1 Florist Marketplace
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-display text-gray-900 mb-6">
                Beautiful flowers,<br />
                <span className="gradient-text">exceptional florists.</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-subheading text-gray-500 mb-10 max-w-lg">
                Discover hundreds of verified florists across Malaysia. Same-day delivery,
                freshness guaranteed, with a real-photo promise on every order.
              </motion.p>

              {/* Search — Primary CTA */}
              <motion.div variants={fadeUp} className="mb-8">
                <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-100/50 max-w-lg">
                  <div className="flex items-center gap-2 flex-1 px-3">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={heroQuery}
                      onChange={e => setHeroQuery(e.target.value)}
                      placeholder="Search flowers or florists..."
                      className="flex-1 py-2 text-sm outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                    />
                  </div>
                  <button type="submit" className="btn-primary gap-2 text-sm whitespace-nowrap">
                    <Search size={15} />
                    Find Florists
                  </button>
                </form>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <span>Popular:</span>
                  {["Roses", "Wedding Bouquet", "Birthday", "Sunflowers"].map((term) => (
                    <button key={term} onClick={() => { setHeroQuery(term); router.push(`/shop?q=${encodeURIComponent(term)}`); }} className="hover:text-gray-700 transition-colors underline underline-offset-2">{term}</button>
                  ))}
                </div>
              </motion.div>

              {/* Trust signals */}
              <motion.div variants={stagger} className="flex flex-wrap gap-5">
                {[
                  { Icon: Leaf, label: "Freshness Guaranteed" },
                  { Icon: Camera, label: "Real-Photo Promise" },
                  { Icon: Zap, label: "Same-Day Delivery" },
                ].map(({ Icon, label }) => (
                  <motion.div key={label} variants={popIn} className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle size={14} style={{ color: "var(--accent)" }} />
                    <span>{label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Editorial visual */}
            <div className="hidden lg:block relative h-[560px]">
              <motion.div
                variants={floatAnim}
                initial="initial"
                animate="animate"
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative w-80 h-80">
                  <Image
                    src="https://images.unsplash.com/photo-1487530811015-780780169dc1?w=640&h=640&fit=crop"
                    alt="Beautiful bouquet"
                    fill
                    className="object-cover rounded-[2rem] shadow-2xl"
                    priority
                  />
                  <div className="absolute inset-0 rounded-[2rem] ring-1 ring-black/5" />
                </div>
              </motion.div>

              {/* Floating cards */}
              {[
                {
                  delay: 0.3, pos: "top-10 -left-6",
                  content: (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-light)" }}>
                        <Camera size={16} style={{ color: "var(--primary)" }} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">Real-Photo Promise</div>
                        <div className="text-[11px] text-gray-400">Verified before delivery</div>
                      </div>
                    </div>
                  ),
                },
                {
                  delay: 0.5, pos: "top-6 -right-8",
                  content: (
                    <div>
                      <div className="flex items-center gap-0.5 mb-1">
                        {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-amber-400" fill="currentColor" />)}
                      </div>
                      <div className="text-xs font-semibold text-gray-900">50,000+ Customers</div>
                      <div className="text-[11px] text-gray-400">Across Malaysia</div>
                    </div>
                  ),
                },
                {
                  delay: 0.7, pos: "bottom-20 -left-4",
                  content: (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Zap size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">Same-Day Delivery</div>
                        <div className="text-[11px] text-gray-400">Order before 2 PM</div>
                      </div>
                    </div>
                  ),
                },
                {
                  delay: 0.9, pos: "bottom-10 -right-6",
                  content: (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Leaf size={13} style={{ color: "var(--accent)" }} />
                        <span className="text-xs font-semibold text-gray-900">Freshness</span>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "var(--accent)" }}
                          initial={{ width: 0 }}
                          animate={{ width: "95%" }}
                          transition={{ delay: 1.5, duration: 1 }}
                        />
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">95% satisfaction</div>
                    </div>
                  ),
                },
              ].map(({ delay, pos, content }) => (
                <motion.div
                  key={pos}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay, duration: 0.6, type: "spring", stiffness: 120 }}
                  className={`glass absolute ${pos} rounded-2xl p-4 shadow-xl`}
                >
                  {content}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <InViewSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <motion.div key={s.label} variants={fadeUp}>
                <div className="text-3xl font-bold tracking-tight mb-1" style={{ color: "var(--primary)" }}>{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </InViewSection>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-20 bg-white">
        <InViewSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="mb-12">
            <h2 className="text-heading text-gray-900 mb-3">Browse by Occasion</h2>
            <p className="text-subheading text-gray-500">The right flowers for every meaningful moment</p>
          </motion.div>
          <motion.div variants={stagger} className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] ?? Gem;
              return (
                <motion.div key={cat.id} variants={scaleIn}>
                  <Link
                    href={`/shop?category=${cat.id}`}
                    className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 bg-white hover:border-current hover:shadow-sm transition-all group"
                    style={{ "--hover-color": "var(--primary)" } as React.CSSProperties}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
                      style={{ background: "var(--primary-light)" }}
                    >
                      <Icon size={18} style={{ color: "var(--primary)" }} strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 text-center group-hover:text-gray-900 transition-colors">{cat.label}</span>
                    <span className="text-xs text-gray-400">{cat.count} items</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </InViewSection>
      </section>

      {/* ── FEATURED FLORISTS ── */}
      <section className="py-20 bg-gray-50/50">
        <InViewSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-heading text-gray-900 mb-3">Featured Florists</h2>
              <p className="text-subheading text-gray-500">Curated by rating, freshness guarantee, and customer satisfaction</p>
            </div>
            <Link href="/florists" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5" style={{ color: "var(--primary)" }}>
              View All <ArrowRight size={14} />
            </Link>
          </motion.div>
          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FLORISTS.map((florist) => (
              <motion.div key={florist.id} variants={scaleIn}>
                <FloristCard florist={florist} />
              </motion.div>
            ))}
          </motion.div>
        </InViewSection>
      </section>

      {/* ── SPONSORED FLORISTS ── */}
      <SponsoredFlorists />

      {/* ── WHY FLORIAHUB ── */}
      <section className="py-24 bg-white">
        <InViewSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="max-w-2xl mb-16">
            <h2 className="text-heading text-gray-900 mb-4">Why choose FloreaHub?</h2>
            <p className="text-subheading text-gray-500">
              We've solved the problems that make buying flowers online frustrating —
              uncertainty, wilting, missed occasions, and generic arrangements.
            </p>
          </motion.div>
          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WOW_FEATURES.map((f) => {
              const Icon = ICON_MAP[f.icon] ?? Leaf;
              return (
                <motion.div
                  key={f.title}
                  variants={scaleIn}
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                    style={{ background: "var(--primary-light)" }}
                  >
                    <Icon size={18} style={{ color: "var(--primary)" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[0.95rem] mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </InViewSection>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-gray-50/50">
        <InViewSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-heading text-gray-900 mb-4">Simple from start to finish</h2>
            <p className="text-subheading text-gray-500">Three steps to the perfect arrangement, every time.</p>
          </motion.div>
          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%-1px)] right-[calc(16.67%-1px)] h-px bg-gray-200" />
            {[
              { n: "01", Icon: Search, title: "Find Your Florist", desc: "Search by location, occasion, or budget. Filter by rating, same-day availability, or specialty." },
              { n: "02", Icon: Palette, title: "Choose or Create", desc: "Browse ready arrangements or use our Bouquet Builder to design exactly what you envision." },
              { n: "03", Icon: Shield, title: "Receive with Confidence", desc: "Your florist shares a real photo before dispatch. Fresh flowers arrive at your door, or we replace them." },
            ].map((step) => (
              <motion.div key={step.n} variants={fadeUp} className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm mb-6 relative z-10">
                  <step.Icon size={24} style={{ color: "var(--primary)" }} strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>{step.n.replace("0","")}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </InViewSection>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-white overflow-hidden">
        <InViewSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-heading text-gray-900 mb-3">Loved by customers</h2>
            <p className="text-gray-500">Real experiences from real people across Malaysia.</p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex justify-center gap-5 max-h-[640px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
            <TestimonialsColumn testimonials={TESTIMONIALS.slice(0, 3)} duration={22} className="w-full max-w-xs" />
            <TestimonialsColumn testimonials={TESTIMONIALS.slice(3, 6)} duration={28} className="hidden md:block w-full max-w-xs" />
            <TestimonialsColumn testimonials={TESTIMONIALS.slice(6, 9)} duration={24} className="hidden lg:block w-full max-w-xs" />
          </motion.div>
        </InViewSection>
      </section>

      {/* ── JOIN AS FLORIST ── */}
      <section id="join" className="py-24 bg-gray-950">
        <InViewSection className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div variants={popIn} className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-6" style={{ background: "rgba(181,41,78,0.2)" }}>
              <Flower2 size={22} style={{ color: "#e87fa8" }} strokeWidth={1.5} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-heading text-white mb-4">Are you a florist?</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join 500+ verified florists on FloreaHub. Free to list, easy to set up,
              and start receiving orders today.
            </motion.p>
            <motion.div variants={stagger} className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
              {[
                { href: "/register/florist", label: "List Your Shop for Free", primary: true },
                { href: "/pricing", label: "View Pricing", primary: false },
              ].map((btn) => (
                <motion.div key={btn.label} variants={popIn} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={btn.href}
                    className={`block px-7 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                      btn.primary
                        ? "bg-white text-gray-900 hover:bg-gray-100"
                        : "border border-gray-700 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {btn.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={stagger} className="grid grid-cols-3 gap-8 max-w-sm mx-auto text-center">
              {[
                { val: "0%", label: "Commission, first month" },
                { val: "10 min", label: "To set up your shop" },
                { val: "24/7", label: "Seller support" },
              ].map((s) => (
                <motion.div key={s.label} variants={fadeUp}>
                  <div className="text-xl font-bold text-white mb-1">{s.val}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </InViewSection>
      </section>

      {/* ── OCCASION REMINDER CTA ── */}
      <section className="py-20 bg-white border-t border-gray-100">
        <InViewSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={popIn}>
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-6"
              style={{ background: "var(--accent-light)" }}
            >
              <Bell size={22} style={{ color: "var(--accent)" }} strokeWidth={1.5} />
            </div>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-heading text-gray-900 mb-4">
            Never miss a special occasion
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
            Set birthdays, anniversaries, and important dates once.
            We'll remind you 3 days in advance — every time.
          </motion.p>
          <motion.div variants={fadeUp} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/reminders"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: "var(--accent)" }}
            >
              Set Up Reminders
              <ChevronRight size={14} />
            </Link>
          </motion.div>
        </InViewSection>
      </section>

      <Footer />
    </div>
  );
}

// Need this for the Flower2 icon used in join section
function Flower2({ size, style, strokeWidth }: { size: number; style?: React.CSSProperties; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15" />
    </svg>
  );
}
