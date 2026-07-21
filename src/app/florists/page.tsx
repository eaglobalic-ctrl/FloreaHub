"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, X, MapPin, Star, Zap, ChevronDown, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloristCard from "@/components/FloristCard";
import { dbToFloristCard } from "@/lib/data";
import { stagger, scaleIn } from "@/lib/animations";

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "reviews", label: "Most Reviewed" },
  { value: "minOrder_asc", label: "Lowest Minimum Order" },
];

export default function FloristsPage() {
  const [florists, setFlorists] = useState<ReturnType<typeof dbToFloristCard>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [sameDay, setSameDay] = useState(false);
  const [sort, setSort] = useState("rating");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch("/api/florists")
      .then((r) => r.json())
      .then((d) => setFlorists((d.florists ?? []).map(dbToFloristCard)))
      .catch(() => setFlorists([]))
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(() => {
    const cities = Array.from(new Set(florists.map((f) => f.location).filter(Boolean)));
    return ["All", ...cities];
  }, [florists]);

  const filtered = useMemo(() => {
    let list = [...florists];
    if (search) list = list.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.area.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase())
    );
    if (location !== "All") list = list.filter((f) => f.location === location);
    if (minRating > 0) list = list.filter((f) => f.rating >= minRating);
    if (sameDay) list = list.filter((f) => f.sameDay);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (sort === "reviews") list.sort((a, b) => b.reviews - a.reviews);
    else if (sort === "minOrder_asc") list.sort((a, b) => a.minOrder - b.minOrder);
    return list;
  }, [florists, search, location, minRating, sameDay, sort]);

  const activeCount = (location !== "All" ? 1 : 0) + (minRating > 0 ? 1 : 0) + (sameDay ? 1 : 0);
  const clearAll = () => { setLocation("All"); setMinRating(0); setSameDay(false); setSearch(""); };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--surface)" }}>
      <Navbar />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-heading text-gray-900 mb-2">
            Find a Florist
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-gray-500 mb-6">
            {loading ? "Loading..." : `${florists.length}+ verified florists across Malaysia`}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3 max-w-xl">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 focus-within:border-gray-400 transition-colors">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search florist or area..."
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} onClick={() => setSearch("")}>
                    <X size={14} className="text-gray-400 hover:text-gray-600" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors relative"
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                  {activeCount}
                </span>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">

          <AnimatePresence>
            {(sidebarOpen) && (
              <motion.aside
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:block w-56 flex-shrink-0"
              >
                <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-semibold text-gray-900">Filters</span>
                    <AnimatePresence>
                      {activeCount > 0 && (
                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onClick={clearAll} className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                          Clear all
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      <MapPin size={11} /> Location
                    </div>
                    <div className="space-y-1">
                      {locations.map((loc) => (
                        <button key={loc} onClick={() => setLocation(loc)}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${location === loc ? "text-white font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                          style={location === loc ? { background: "var(--primary)" } : {}}
                        >{loc}</button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      <Star size={11} /> Min. Rating
                    </div>
                    <div className="space-y-1">
                      {[{ v: 0, l: "Any rating" }, { v: 4.5, l: "4.5 and above" }, { v: 4.7, l: "4.7 and above" }, { v: 4.9, l: "4.9 and above" }].map(({ v, l }) => (
                        <button key={v} onClick={() => setMinRating(v)}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${minRating === v ? "text-white font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                          style={minRating === v ? { background: "var(--primary)" } : {}}
                        >{l}</button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      <Zap size={11} /> Delivery
                    </div>
                    <button onClick={() => setSameDay(!sameDay)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${sameDay ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      Same-Day Only
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${sameDay ? "bg-green-400" : "bg-gray-200"}`}>
                        <motion.div className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow" animate={{ left: sameDay ? "17px" : "2px" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      </div>
                    </button>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <div className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">{loading ? "Loading..." : `${filtered.length} florists found`}</span>
                <AnimatePresence>
                  {location !== "All" && (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium text-white" style={{ background: "var(--primary)" }}>
                      <MapPin size={10} /> {location}
                      <button onClick={() => setLocation("All")}><X size={10} /></button>
                    </motion.span>
                  )}
                  {sameDay && (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium bg-green-500 text-white">
                      <Zap size={10} /> Same-Day
                      <button onClick={() => setSameDay(false)}><X size={10} /></button>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 whitespace-nowrap">Sort by</span>
                <div className="relative">
                  <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-2 outline-none bg-white text-gray-700 focus:border-gray-400 cursor-pointer">
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-28">
                  <Loader2 size={28} className="animate-spin text-gray-300" />
                </motion.div>
              ) : filtered.length > 0 ? (
                <motion.div key="grid" variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((f) => (
                    <motion.div key={f.id} variants={scaleIn} layout>
                      <FloristCard florist={f} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-28 text-center">
                  <div className="w-14 h-14 rounded-2xl border border-gray-100 flex items-center justify-center mb-4">
                    <Search size={22} className="text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2">No florists found</h3>
                  <p className="text-sm text-gray-400 mb-5">Try adjusting your filters or search term</p>
                  <button onClick={clearAll} className="btn-primary text-sm py-2 px-4">Clear Filters</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
