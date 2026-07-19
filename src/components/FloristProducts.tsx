"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Star } from "lucide-react";
import { addToCart } from "@/lib/cart";

const AI = "https://image.pollinations.ai/prompt";

const PRODUCTS = [
  { id: "p1", name: "Classic Red Rose Bouquet",       price: 120, image: `${AI}/classic+red+rose+bouquet+luxury+professional+photography+white+background?width=400&height=400&nologo=true&seed=1001`, badge: "Bestseller", rating: 4.9 },
  { id: "p2", name: "White Lily Elegance",             price: 95,  image: `${AI}/white+lily+elegant+bouquet+premium+arrangement+soft+background?width=400&height=400&nologo=true&seed=1002`, badge: "New",        rating: 4.7 },
  { id: "p3", name: "Mixed Pastel Bouquet",            price: 110, image: `${AI}/pastel+mixed+flower+arrangement+modern+romantic+aesthetic?width=400&height=400&nologo=true&seed=1006`,          badge: "",           rating: 4.8 },
  { id: "p4", name: "Sunflower Delight",               price: 80,  image: `${AI}/sunflower+birthday+bouquet+colorful+cheerful+gift+box?width=400&height=400&nologo=true&seed=1003`,             badge: "",           rating: 4.6 },
  { id: "p5", name: "Bridal Premium Arrangement",      price: 280, image: `${AI}/bridal+wedding+bouquet+white+roses+peonies+luxury+premium?width=400&height=400&nologo=true&seed=1004`,          badge: "Premium",    rating: 5.0 },
  { id: "p6", name: "Birthday Bloom Box",              price: 150, image: `${AI}/birthday+flower+box+mixed+pink+purple+festive+celebration?width=400&height=400&nologo=true&seed=1005`,          badge: "",           rating: 4.8 },
];

const BADGE_STYLES: Record<string, string> = {
  Bestseller: "bg-amber-50 text-amber-700 border border-amber-200",
  Premium:    "bg-purple-50 text-purple-700 border border-purple-200",
  New:        "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export default function FloristProducts({ floristName }: { floristName: string }) {
  const router = useRouter();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAdd = (p: typeof PRODUCTS[0]) => {
    addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, florist: floristName });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {PRODUCTS.map((p) => (
        <div key={p.id} className="card-premium overflow-hidden group cursor-pointer bg-white">
          <div className="relative h-44 bg-gray-100 overflow-hidden">
            <Image src={p.image} alt={p.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            {p.badge && (
              <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-md ${BADGE_STYLES[p.badge] ?? ""}`}>{p.badge}</span>
            )}
          </div>
          <div className="p-3.5">
            <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">{p.name}</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-base" style={{ color: "var(--primary)" }}>RM{p.price}</span>
              <div className="flex items-center gap-1">
                <Star size={11} className="text-amber-400" fill="currentColor" />
                <span className="text-xs text-gray-500">{p.rating}</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAdd(p)}
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
        </div>
      ))}
    </div>
  );
}
