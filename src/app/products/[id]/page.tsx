"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart, Heart, Star, Zap, Leaf, ChevronRight, MapPin,
  Package, ArrowLeft, Minus, Plus, Check, Share2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Skeleton from "@/components/ui/skeleton";
import ChatWidget from "@/components/ChatWidget";
import { addToCart } from "@/lib/cart";

type Product = {
  id: string; name: string; description: string; price: number;
  original_price?: number; category: string; image_url?: string;
  badge?: string; same_day: boolean; stock: number;
  rating: number; review_count: number;
  florists?: {
    id: string; name: string; city: string; state: string;
    cover_image?: string; rating: number; review_count: number;
    same_day_delivery: boolean; phone?: string;
  };
};

type RelatedProduct = {
  id: string; name: string; price: number; image_url?: string;
  rating: number; badge?: string;
};

const BADGE_STYLES: Record<string, string> = {
  Bestseller: "bg-amber-50 text-amber-700 border-amber-200",
  Premium:    "bg-purple-50 text-purple-700 border-purple-200",
  New:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  Popular:    "bg-blue-50 text-blue-700 border-blue-200",
  Luxury:     "bg-pink-50 text-pink-700 border-pink-200",
};

const CATEGORY_LABEL: Record<string, string> = {
  wedding: "Wedding", birthday: "Birthday", anniversary: "Anniversary",
  corporate: "Corporate", sympathy: "Sympathy", daily: "Everyday",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetch(`/api/products?id=${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product ?? null);
        if (d.product?.category) {
          fetch(`/api/products?category=${d.product.category}`)
            .then(r => r.json())
            .then(rd => setRelated((rd.products ?? []).filter((p: RelatedProduct) => p.id !== id).slice(0, 4)));
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || "",
        florist: product.florists?.name || "",
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <Package size={48} className="text-gray-200" />
          <h2 className="text-xl font-bold text-gray-800">Product not found</h2>
          <p className="text-gray-400">This product may have been removed or is no longer available.</p>
          <button onClick={() => router.back()} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <ChevronRight size={13} />
            <Link href="/shop" className="hover:text-gray-600 transition-colors">Shop</Link>
            <ChevronRight size={13} />
            {product.category && (
              <>
                <Link href={`/shop?category=${product.category}`} className="hover:text-gray-600 transition-colors">
                  {CATEGORY_LABEL[product.category] || product.category}
                </Link>
                <ChevronRight size={13} />
              </>
            )}
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-10 mb-12">

          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package size={64} />
                </div>
              )}
              {product.badge && (
                <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full border ${BADGE_STYLES[product.badge] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {product.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">

            {/* Category + badges */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {CATEGORY_LABEL[product.category] || product.category}
              </span>
              {product.same_day && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Zap size={10} fill="currentColor" /> Same-Day
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(product.rating) ? "text-amber-400" : "text-gray-200"} fill="currentColor" />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-800">{Number(product.rating).toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.review_count} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-bold" style={{ color: "var(--primary)" }}>RM{product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-lg text-gray-400 line-through">RM{product.original_price}</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-500 leading-relaxed mb-6 text-sm">{product.description}</p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${product.stock > 5 ? "bg-emerald-400" : product.stock > 0 ? "bg-amber-400" : "bg-red-400"}`} />
              <span className="text-sm text-gray-500">
                {product.stock > 5 ? "In stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of stock"}
              </span>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-semibold text-gray-900 text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} className="w-10 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                  <Plus size={14} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span key="added" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                      <Check size={16} /> Added to Cart!
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                      <ShoppingCart size={16} /> Add to Cart — RM{product.price * qty}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            <div className="flex items-center gap-3 mb-7">
              <button
                onClick={() => setWishlisted(w => !w)}
                className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border font-medium transition-all ${wishlisted ? "bg-rose-50 border-rose-200 text-rose-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
              >
                <Heart size={14} className={wishlisted ? "fill-rose-500" : ""} />
                {wishlisted ? "Wishlisted" : "Wishlist"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 font-medium transition-all"
              >
                <AnimatePresence mode="wait">
                  {shared ? (
                    <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-emerald-600">
                      <Check size={14} /> Copied!
                    </motion.span>
                  ) : (
                    <motion.span key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <Share2 size={14} /> Share
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Guarantees */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <Leaf size={14} style={{ color: "var(--accent)" }} />
                Freshness Guaranteed — not fresh? We replace it free
              </div>
              {product.same_day && (
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Zap size={14} className="text-amber-500" />
                  Same-day delivery available if ordered before 2 PM
                </div>
              )}
            </div>

            {/* Florist card */}
            {product.florists && (
              <Link href={`/florists/${product.florists.id}`} className="mt-5 flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-all group">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.florists.cover_image ? (
                    <Image src={product.florists.cover_image} alt={product.florists.name} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">
                      {product.florists.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Sold by</p>
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-rose-700 transition-colors">{product.florists.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin size={10} /> {product.florists.city}
                    <span className="text-gray-200">·</span>
                    <Star size={10} className="text-amber-400" fill="currentColor" />
                    {Number(product.florists.rating).toFixed(1)}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            )}

            {product.florists && (
              <div className="mt-3">
                <ChatWidget
                  floristId={product.florists.id}
                  floristName={product.florists.name}
                  product={{ id: product.id, name: product.name, price: product.price, image: product.image_url }}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-5">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map(p => (
                <Link key={p.id} href={`/products/${p.id}`}>
                  <motion.div whileHover={{ y: -3 }} className="card-premium overflow-hidden bg-white cursor-pointer">
                    <div className="relative h-40 bg-gray-100 overflow-hidden">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} fill className="object-cover transition-transform duration-300 hover:scale-105" />
                      ) : <div className="w-full h-full" />}
                      {p.badge && (
                        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${BADGE_STYLES[p.badge] ?? ""}`}>{p.badge}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1.5 leading-snug">{p.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>RM{p.price}</span>
                        <div className="flex items-center gap-0.5">
                          <Star size={10} className="text-amber-400" fill="currentColor" />
                          <span className="text-xs text-gray-400">{Number(p.rating).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
