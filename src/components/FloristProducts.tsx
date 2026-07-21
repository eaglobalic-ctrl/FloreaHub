"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Star, Loader2 } from "lucide-react";
import { addToCart } from "@/lib/cart";

type Product = {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image_url?: string;
  badge?: string;
  rating: number;
  same_day?: boolean;
};

const BADGE_STYLES: Record<string, string> = {
  Bestseller: "bg-amber-50 text-amber-700 border border-amber-200",
  Premium:    "bg-purple-50 text-purple-700 border border-purple-200",
  New:        "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Popular:    "bg-blue-50 text-blue-700 border border-blue-200",
  Luxury:     "bg-pink-50 text-pink-700 border border-pink-200",
};

export default function FloristProducts({
  floristId,
  floristName,
}: {
  floristId?: string;
  floristName: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const url = floristId ? `/api/products?floristId=${floristId}` : "/api/products";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [floristId]);

  const handleAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image_url || "",
      florist: floristName,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">No products available yet.</div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {products.map((p) => (
        <Link key={p.id} href={`/products/${p.id}`} className="card-premium overflow-hidden group cursor-pointer bg-white block">
          <div className="relative h-44 bg-gray-100 overflow-hidden">
            {p.image_url ? (
              <Image src={p.image_url} alt={p.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
            {p.badge && (
              <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-md border ${BADGE_STYLES[p.badge] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{p.badge}</span>
            )}
            {p.same_day && (
              <span className="absolute top-2 right-2 text-xs font-semibold bg-white/90 text-amber-600 px-2 py-0.5 rounded-md border border-amber-200">Same-Day</span>
            )}
          </div>
          <div className="p-3.5">
            <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">{p.name}</h3>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base" style={{ color: "var(--primary)" }}>RM{p.price}</span>
                {p.original_price && p.original_price > p.price && (
                  <span className="text-xs text-gray-400 line-through">RM{p.original_price}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star size={11} className="text-amber-400" fill="currentColor" />
                <span className="text-xs text-gray-500">{Number(p.rating || 0).toFixed(1)}</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={(e) => handleAdd(p, e)}
              className="btn-primary w-full text-xs py-2 justify-center relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {addedId === p.id ? (
                  <motion.span key="added" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>
                    Added!
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="flex items-center gap-1.5">
                    <ShoppingCart size={12} /> Add to Cart
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </Link>
      ))}
    </div>
  );
}
