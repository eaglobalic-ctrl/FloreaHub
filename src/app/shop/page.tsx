"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Heart, Zap, Star, SlidersHorizontal, ChevronDown, Gem, Gift, Building2, Feather, Sun, Palette } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CATEGORIES } from "@/lib/data";
import { stagger, scaleIn, fadeUp } from "@/lib/animations";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  wedding: Gem, birthday: Gift, anniversary: Heart,
  corporate: Building2, sympathy: Feather, daily: Sun,
};

const ALL_PRODUCTS = [
  { id: "1", name: "Classic Red Rose Bouquet", florist: "Bloom & Co.", price: 120, originalPrice: 150, image: "https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=400&h=400&fit=crop", category: "anniversary", rating: 4.9, reviews: 89, sameDay: true, badge: "Bestseller" },
  { id: "2", name: "White Lily Elegance", florist: "Petal Paradise", price: 95, originalPrice: null, image: "https://images.unsplash.com/photo-1487530811015-780780169dc1?w=400&h=400&fit=crop", category: "wedding", rating: 4.7, reviews: 54, sameDay: true, badge: "" },
  { id: "3", name: "Sunflower Happiness Box", florist: "Rose Garden MY", price: 80, originalPrice: null, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop", category: "birthday", rating: 4.8, reviews: 112, sameDay: false, badge: "Popular" },
  { id: "4", name: "Bridal Premium Bouquet", florist: "Fleur de Lune", price: 280, originalPrice: 320, image: "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400&h=400&fit=crop", category: "wedding", rating: 5.0, reviews: 67, sameDay: true, badge: "Premium" },
  { id: "5", name: "Birthday Bloom Box", florist: "Bloom & Co.", price: 150, originalPrice: null, image: "https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400&h=400&fit=crop", category: "birthday", rating: 4.8, reviews: 78, sameDay: true, badge: "" },
  { id: "6", name: "Pastel Mix Arrangement", florist: "Petal Paradise", price: 110, originalPrice: null, image: "https://images.unsplash.com/photo-1490750967868-88df5691166b?w=400&h=400&fit=crop", category: "daily", rating: 4.6, reviews: 43, sameDay: false, badge: "New" },
  { id: "7", name: "Corporate Event Arrangement", florist: "Rose Garden MY", price: 220, originalPrice: 260, image: "https://images.unsplash.com/photo-1487530811015-780780169dc1?w=400&h=400&fit=crop", category: "corporate", rating: 4.7, reviews: 31, sameDay: false, badge: "" },
  { id: "8", name: "Orchid Luxury Stand", florist: "Fleur de Lune", price: 350, originalPrice: null, image: "https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=400&h=400&fit=crop", category: "corporate", rating: 4.9, reviews: 28, sameDay: true, badge: "Luxury" },
];

const BADGE_STYLES: Record<string, string> = {
  Bestseller: "bg-amber-50 text-amber-700",
  Popular: "bg-orange-50 text-orange-700",
  Premium: "bg-purple-50 text-purple-700",
  Luxury: "bg-yellow-50 text-yellow-700",
  New: "bg-emerald-50 text-emerald-700",
};

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(400);
  const [sameDay, setSameDay] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  const toggleWishlist = (id: string) =>
    setWishlist((p) => p.includes(id) ? p.filter((w) => w !== id) : [...p, id]);

  const addToCart = (id: string) => {
    setCartCount((c) => c + 1);
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const filtered = useMemo(() => {
    let list = [...ALL_PRODUCTS];
    if (activeCategory !== "all") list = list.filter((p) => p.category === activeCategory);
    if (sameDay) list = list.filter((p) => p.sameDay);
    list = list.filter((p) => p.price <= maxPrice);
    if (sort === "popular") list.sort((a, b) => b.reviews - a.reviews);
    else if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [activeCategory, sort, maxPrice, sameDay]);

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-7">
            <div>
              <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-heading text-gray-900 mb-2">
                Flower Shop
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-gray-500">
                Fresh arrangements from Malaysia's finest florists
              </motion.p>
            </div>
            <div className="flex items-center gap-3">
              {cartCount > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative cursor-pointer">
                  <ShoppingCart size={22} className="text-gray-700" />
                  <motion.span key={cartCount} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                    {cartCount}
                  </motion.span>
                </motion.div>
              )}
              <Link href="/builder" className="btn-secondary text-sm gap-2">
                <Palette size={14} /> Design Your Own
              </Link>
            </div>
          </div>

          {/* Category tabs */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setActiveCategory("all")}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${activeCategory === "all" ? "text-white border-transparent" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
              style={activeCategory === "all" ? { background: "var(--primary)" } : {}}
            >All</button>
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] ?? Gem;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${activeCategory === cat.id ? "text-white border-transparent" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
                  style={activeCategory === cat.id ? { background: "var(--primary)" } : {}}
                >
                  <Icon size={13} strokeWidth={1.8} /> {cat.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-4 mb-6 bg-white rounded-xl p-4 border border-gray-100"
        >
          <SlidersHorizontal size={15} className="text-gray-400" />
          <div className="flex items-center gap-3 flex-1 min-w-48">
            <label className="text-sm text-gray-500 font-medium whitespace-nowrap">Max price:</label>
            <input type="range" min={50} max={400} step={10} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="flex-1 accent-rose-600" />
            <motion.span key={maxPrice} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="text-sm font-semibold w-16 text-right" style={{ color: "var(--primary)" }}>
              RM{maxPrice}
            </motion.span>
          </div>
          <button onClick={() => setSameDay(!sameDay)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${sameDay ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
          >
            <Zap size={13} className={sameDay ? "text-green-600" : "text-gray-400"} />
            Same-Day Only
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-400">{filtered.length} results</span>
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-2 outline-none bg-white text-gray-700 focus:border-gray-400">
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div key={`${activeCategory}-${sameDay}-${maxPrice}`} variants={stagger} initial="hidden" animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filtered.map((p) => (
                <motion.article key={p.id} variants={scaleIn} layout whileHover={{ y: -4 }} className="card-premium overflow-hidden bg-white cursor-pointer">
                  <div className="relative overflow-hidden bg-gray-100">
                    <Image src={p.image} alt={p.name} width={400} height={300}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" />
                    {p.badge && (
                      <span className={`absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-md ${BADGE_STYLES[p.badge] ?? ""}`}>{p.badge}</span>
                    )}
                    {p.sameDay && (
                      <span className="absolute top-2 right-8 text-[10px] font-semibold bg-white/95 text-gray-700 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Zap size={9} className="text-amber-500" /> Fast
                      </span>
                    )}
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleWishlist(p.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                      <Heart size={13} className={wishlist.includes(p.id) ? "text-rose-500 fill-rose-500" : "text-gray-400"} />
                    </motion.button>
                  </div>

                  <div className="p-3.5">
                    <p className="text-xs text-gray-400 mb-0.5">{p.florist}</p>
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2 leading-snug">{p.name}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star size={11} className="text-amber-400" fill="currentColor" />
                      <span className="text-xs font-medium text-gray-700">{p.rating}</span>
                      <span className="text-xs text-gray-400">({p.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm" style={{ color: "var(--primary)" }}>RM{p.price}</span>
                        {p.originalPrice && <span className="text-xs text-gray-400 line-through">RM{p.originalPrice}</span>}
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => addToCart(p.id)}
                      className="btn-primary w-full text-xs py-2 justify-center relative overflow-hidden">
                      <AnimatePresence mode="wait">
                        {addedId === p.id ? (
                          <motion.span key="added" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>Added!</motion.span>
                        ) : (
                          <motion.span key="add" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="flex items-center gap-1">
                            <ShoppingCart size={11} /> Add to Cart
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-28 text-center">
              <div className="w-14 h-14 rounded-2xl border border-gray-100 flex items-center justify-center mb-4">
                <ShoppingCart size={22} className="text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
