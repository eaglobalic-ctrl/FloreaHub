"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Heart, Star, Zap } from "lucide-react";
import { useSpotlight, SpotlightOverlay } from "@/hooks/useSpotlight";

type Product = {
  id: string; name: string; florist: string; price: number; originalPrice: number | null;
  image: string; category: string; rating: number; reviews: number; sameDay: boolean; badge: string;
};

const BADGE_STYLES: Record<string, string> = {
  Bestseller: "bg-amber-50 text-amber-700",
  Popular: "bg-orange-50 text-orange-700",
  Premium: "bg-purple-50 text-purple-700",
  Luxury: "bg-yellow-50 text-yellow-700",
  New: "bg-emerald-50 text-emerald-700",
};

export default function ShopProductCard({
  product: p, wishlisted, added, onToggleWishlist, onAddToCart,
}: {
  product: Product; wishlisted: boolean; added: boolean;
  onToggleWishlist: () => void; onAddToCart: () => void;
}) {
  const spotlight = useSpotlight<HTMLElement>();

  return (
    <motion.article
      ref={spotlight.ref}
      onMouseMove={spotlight.onMouseMove}
      whileHover={{ y: -4 }}
      className="card-premium overflow-hidden bg-white cursor-pointer relative group/spot"
    >
      <SpotlightOverlay size={180} />
      <Link href={`/products/${p.id}`} className="block">
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
          <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.preventDefault(); onToggleWishlist(); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors">
            <Heart size={13} className={wishlisted ? "text-rose-500 fill-rose-500" : "text-gray-400"} />
          </motion.button>
        </div>
      </Link>
      <div className="p-3.5">
        <p className="text-xs text-gray-400 mb-0.5">{p.florist}</p>
        <Link href={`/products/${p.id}`}>
          <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2 leading-snug hover:text-rose-700 transition-colors">{p.name}</h3>
        </Link>
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
        <motion.button whileTap={{ scale: 0.97 }} onClick={onAddToCart}
          className="btn-primary w-full text-xs py-2 justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            {added ? (
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
  );
}
