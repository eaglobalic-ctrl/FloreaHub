"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Megaphone, TrendingUp, Eye, MousePointer, Plus, Star,
  Zap, Crown, Check, ArrowRight, BarChart2, Calendar,
  Flower2, ChevronDown, ChevronUp, X,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AD_PLANS, getAds, saveAd, AdCampaign, AdType, AdStatus } from "@/lib/ads";
import { fadeUp, stagger } from "@/lib/animations";

const PLAN_ICONS = { product_boost: Zap, shop_spotlight: Star, premium_banner: Crown };
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  expired: "bg-gray-100 text-gray-500",
  paused: "bg-orange-100 text-orange-700",
};

function AdForm({ plan, floristId, floristName: defaultFloristName, onClose, onSuccess }: { plan: typeof AD_PLANS[0]; floristId: string; floristName: string; onClose: () => void; onSuccess: () => void }) {
  const [headline, setHeadline] = useState("");
  const [tagline, setTagline] = useState("");
  const [floristName, setFloristName] = useState(defaultFloristName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adType: plan.id,
          floristId,
          floristName,
          headline,
          tagline,
          price: plan.price,
        }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error ?? "Payment failed. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <p className="text-sm text-gray-500">RM {plan.price} / {plan.duration} days</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handlePay} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Shop Name</label>
            <input required value={floristName} onChange={e => setFloristName(e.target.value)} placeholder="e.g. Bloom & Co" className="input-premium w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Headline</label>
            <input required value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Malaysia's Freshest Roses" maxLength={60} className="input-premium w-full" />
            <p className="text-xs text-gray-400 mt-1">{headline.length}/60 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Same-day delivery across KL" maxLength={100} className="input-premium w-full" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Pay RM {plan.price} & Launch</span><ArrowRight size={15} /></>}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2.5">Secured via ToyyibPay · Fee borne by advertiser</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AdsContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<typeof AD_PLANS[0] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [florist, setFlorist] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let userId: string | null = null;
    try {
      const u = JSON.parse(localStorage.getItem("floreahub_user") || "{}");
      userId = u?.id ?? null;
    } catch { /* ignore */ }
    if (!userId) return;
    fetch(`/api/florists?userId=${userId}`)
      .then(r => r.json())
      .then(d => setFlorist(d.florists?.[0] ?? null))
      .catch(() => setFlorist(null));
  }, []);

  useEffect(() => {
    if (!florist?.id) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        // Fetch this florist's own campaigns only
        const res = await fetch(`/api/ads?all=1&floristId=${florist.id}`);
        const data = await res.json();
        if (data.ads?.length) {
          // Map snake_case DB fields to camelCase AdCampaign type
          const mapped: AdCampaign[] = data.ads.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            floristId: a.florist_id as string,
            floristName: a.florist_name as string,
            type: a.type as AdType,
            productId: a.product_id as string | undefined,
            productName: a.product_name as string | undefined,
            imageUrl: a.image_url as string,
            headline: a.headline as string,
            tagline: a.tagline as string,
            budget: a.budget as number,
            startDate: a.starts_at as string,
            endDate: a.ends_at as string,
            status: a.status as AdStatus,
            clicks: a.clicks as number,
            impressions: a.impressions as number,
            createdAt: a.created_at as string,
          }));
          setCampaigns(mapped);
        }
      } catch {
        // Fallback to localStorage demo data
        setCampaigns(getAds());
      } finally {
        setLoading(false);
      }
    };
    load();
    if (success) load(); // reload after payment success
  }, [success, florist]);

  const totalClicks = campaigns.reduce((s, a) => s + a.clicks, 0);
  const totalImpr = campaigns.reduce((s, a) => s + a.impressions, 0);
  const totalSpend = campaigns.reduce((s, a) => s + a.budget, 0);
  const activeCnt = campaigns.filter(a => a.status === "active").length;

  const visibleCampaigns = showAll ? campaigns : campaigns.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Check size={18} className="text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">Payment received! Your campaign is being activated. It may take a few minutes to go live.</p>
          </motion.div>
        )}

        <motion.div variants={stagger} initial="hidden" animate="show">
          {/* Header */}
          <motion.div variants={fadeUp} className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                <Megaphone size={22} style={{ color: "var(--primary)" }} /> FloreaHub Ads
              </h1>
              <p className="text-gray-500 text-sm mt-1">Promote your shop and products to thousands of flower buyers across Malaysia</p>
            </div>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors">
              <Flower2 size={14} /> Back to Dashboard
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Active Campaigns", value: loading ? "—" : activeCnt, icon: Megaphone, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "Total Impressions", value: loading ? "—" : totalImpr.toLocaleString(), icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Clicks", value: loading ? "—" : totalClicks.toLocaleString(), icon: MousePointer, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Total Spend", value: loading ? "—" : `RM ${totalSpend}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Plans */}
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose an Ad Plan</h2>
            <p className="text-sm text-gray-500 mb-5">All campaigns run for 7 days. Payment secured via ToyyibPay.</p>
            <div className="grid md:grid-cols-3 gap-4">
              {AD_PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id];
                return (
                  <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}18` }}>
                          <Icon size={20} style={{ color: plan.color }} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: plan.color }}>
                          {plan.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">{plan.description}</p>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-bold text-gray-900">RM {plan.price}</span>
                        <span className="text-sm text-gray-400">/ 7 days</span>
                      </div>
                      <ul className="space-y-2 mb-5">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                            <Check size={13} style={{ color: plan.color }} strokeWidth={2.5} />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="px-5 pb-5">
                      <button onClick={() => setSelectedPlan(plan)} disabled={!florist} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: plan.color }}>
                        <Plus size={14} /> Launch Campaign
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* My Campaigns */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart2 size={18} style={{ color: "var(--primary)" }} /> My Campaigns
              </h2>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{campaigns.length} total</span>
            </div>
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No campaigns yet. Launch your first ad above!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {visibleCampaigns.map((camp) => (
                    <div key={camp.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={camp.imageUrl} alt={camp.headline} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{camp.headline}</p>
                        <p className="text-xs text-gray-500">{camp.floristName} · {camp.type.replace("_", " ")}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-6 text-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{camp.impressions.toLocaleString()}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1"><Eye size={10} /> Views</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{camp.clicks}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1"><MousePointer size={10} /> Clicks</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">RM {camp.budget}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={10} /> Budget</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[camp.status]}`}>
                        {camp.status}
                      </span>
                    </div>
                  ))}
                </div>
                {campaigns.length > 3 && (
                  <button onClick={() => setShowAll(!showAll)} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1.5 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    {showAll ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {campaigns.length} campaigns</>}
                  </button>
                )}
              </>
            )}
          </motion.div>

          {/* Info Banner */}
          <motion.div variants={fadeUp} className="mt-6 rounded-2xl p-5 border" style={{ background: "rgba(181,41,78,0.04)", borderColor: "rgba(181,41,78,0.15)" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">How FloreaHub Ads Works</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-xs text-gray-600">
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "var(--primary)" }}>1</div>
                <p><strong>Choose a plan</strong> — select Product Boost, Shop Spotlight, or Premium Banner based on your goal.</p>
              </div>
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "var(--primary)" }}>2</div>
                <p><strong>Pay via ToyyibPay</strong> — secure FPX or card payment. Campaign activates within minutes after payment.</p>
              </div>
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "var(--primary)" }}>3</div>
                <p><strong>Track performance</strong> — monitor impressions and clicks live from this dashboard.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
      <Footer />

      {selectedPlan && florist && (
        <AdForm plan={selectedPlan} floristId={florist.id} floristName={florist.name} onClose={() => setSelectedPlan(null)} onSuccess={() => setSelectedPlan(null)} />
      )}
    </div>
  );
}

export default function AdsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>}>
      <AdsContent />
    </Suspense>
  );
}
