"use client";
import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Heart, Zap, SlidersHorizontal, ChevronDown, Gem, Gift, Building2, Feather, Sun, Palette, Search, Megaphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import ShopProductCard from "@/components/ui/shop-product-card";
import { CATEGORIES } from "@/lib/data";
import { stagger, scaleIn } from "@/lib/animations";
import { addToCart as saveToCart, getCart } from "@/lib/cart";
import { trackAdEvent } from "@/lib/ads";

type SponsoredAd = { id: string; headline: string; tagline: string; florist_id: string; florist_name: string; image_url: string };

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  wedding: Gem, birthday: Gift, anniversary: Heart,
  corporate: Building2, sympathy: Feather, daily: Sun,
};

type Product = {
  id: string; name: string; florist: string; floristId: string | null; price: number; originalPrice: number | null;
  image: string; category: string; rating: number; reviews: number; sameDay: boolean; badge: string;
};

function dbToProduct(p: Record<string, unknown>): Product {
  const f = p.florists as Record<string, unknown> | null;
  return {
    id: String(p.id),
    name: String(p.name || ""),
    florist: String(f?.name || ""),
    floristId: f?.id ? String(f.id) : null,
    price: Number(p.price) || 0,
    originalPrice: p.original_price ? Number(p.original_price) : null,
    image: String(p.image_url || `https://image.pollinations.ai/prompt/flower+arrangement+malaysia?width=400&height=400&nologo=true&seed=${p.id}`),
    category: String(p.category || "daily"),
    rating: Number(p.rating) || 0,
    reviews: Number(p.review_count) || 0,
    sameDay: Boolean(p.same_day),
    badge: String(p.badge || ""),
  };
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(400);
  const [sameDay, setSameDay] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [sponsoredAds, setSponsoredAds] = useState<SponsoredAd[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setAllProducts((d.products ?? []).map(dbToProduct)))
      .catch(() => setAllProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => { setSearchQuery(qParam); }, [qParam]);
  useEffect(() => {
    fetch("/api/ads?type=product_boost")
      .then(r => r.json())
      .then(d => {
        const top2 = (d.ads ?? []).slice(0, 2);
        setSponsoredAds(top2);
        top2.forEach((ad: SponsoredAd) => trackAdEvent(ad.id, "impression"));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sync = () => setCartCount(getCart().reduce((n, i) => n + i.quantity, 0));
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  const toggleWishlist = (id: string) =>
    setWishlist((p) => p.includes(id) ? p.filter((w) => w !== id) : [...p, id]);

  const handleAddToCart = (p: Product) => {
    saveToCart({ id: p.id, name: p.name, price: p.price, image: p.image, florist: p.florist, floristId: p.floristId });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const filtered = useMemo(() => {
    let list = [...allProducts];
    if (activeCategory !== "all") list = list.filter((p) => p.category === activeCategory);
    if (sameDay) list = list.filter((p) => p.sameDay);
    list = list.filter((p) => p.price <= maxPrice);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.florist.toLowerCase().includes(q));
    }
    if (sort === "popular") list.sort((a, b) => b.reviews - a.reviews);
    else if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [allProducts, activeCategory, sort, maxPrice, sameDay, searchQuery]);

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
                {loadingProducts ? "Loading..." : `${allProducts.length} arrangements from Malaysia's finest florists`}
              </motion.p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search flowers..." className="text-sm outline-none bg-transparent w-36 text-gray-700 placeholder-gray-400" />
              </div>
              {cartCount > 0 && (
                <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => router.push("/checkout")} className="relative cursor-pointer p-2 bg-white border border-gray-200 rounded-lg">
                  <ShoppingCart size={18} className="text-gray-700" />
                  <motion.span key={cartCount} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>
                    {cartCount}
                  </motion.span>
                </motion.button>
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
            <span className="text-sm text-gray-400">{loadingProducts ? "..." : `${filtered.length} results`}</span>
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

        {/* Sponsored strip */}
        {sponsoredAds.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5"><Megaphone size={11} /> Sponsored</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {sponsoredAds.map(ad => (
                <div key={ad.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 shadow-sm">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.image_url} alt={ad.headline} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{ad.headline}</p>
                    <p className="text-xs text-gray-500 truncate">{ad.tagline}</p>
                    <p className="text-[10px] text-amber-600 font-medium mt-0.5">{ad.florist_name}</p>
                  </div>
                  <Link href={`/florists/${ad.florist_id}`} onClick={() => trackAdEvent(ad.id, "click")} className="text-xs font-semibold text-white px-2.5 py-1.5 rounded-lg flex-shrink-0" style={{ background: "var(--primary)" }}>
                    Visit
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loadingProducts ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </motion.div>
          ) : filtered.length > 0 ? (
            <motion.div key={`${activeCategory}-${sameDay}-${maxPrice}`} variants={stagger} initial="hidden" animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filtered.map((p) => (
                <motion.div key={p.id} variants={scaleIn} layout>
                  <ShopProductCard
                    product={p}
                    wishlisted={wishlist.includes(p.id)}
                    added={addedId === p.id}
                    onToggleWishlist={() => toggleWishlist(p.id)}
                    onAddToCart={() => handleAddToCart(p)}
                  />
                </motion.div>
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
