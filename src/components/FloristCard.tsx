"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { MapPin, Star, Clock, Zap, Leaf, BadgeCheck, TrendingUp } from "lucide-react";
import { useSpotlight, SpotlightOverlay } from "@/hooks/useSpotlight";

type Florist = {
  id: string; name: string; location: string; area: string;
  rating: number; reviews: number; badge: string; deliveryTime: string;
  minOrder: number; tags: string[]; image: string; products: number;
  freshGuarantee: boolean; sameDay: boolean;
};

const BADGE_CONFIG: Record<string, { label: string; className: string; Icon: typeof TrendingUp }> = {
  "Top Seller": { label: "Top Seller", className: "bg-amber-50 text-amber-700 border-amber-200", Icon: TrendingUp },
  "New": { label: "New", className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: Zap },
  "Verified": { label: "Verified", className: "bg-blue-50 text-blue-700 border-blue-200", Icon: BadgeCheck },
};

export default function FloristCard({ florist }: { florist: Florist }) {
  const badge = BADGE_CONFIG[florist.badge];
  const spotlight = useSpotlight<HTMLElement>();

  return (
    <Link href={`/florists/${florist.id}`}>
      <motion.article
        ref={spotlight.ref}
        onMouseMove={spotlight.onMouseMove}
        className="card-premium overflow-hidden cursor-pointer bg-white relative group/spot"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <SpotlightOverlay size={240} />

        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-gray-100">
          <Image
            src={florist.image}
            alt={florist.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {badge && (
            <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border ${badge.className}`}>
              <badge.Icon size={10} />
              {badge.label}
            </span>
          )}

          {florist.sameDay && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-semibold bg-white/95 text-gray-800 px-2 py-1 rounded-md shadow-sm">
              <Zap size={10} className="text-amber-500" fill="currentColor" />
              Same-Day
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-[0.95rem] leading-tight">{florist.name}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star size={12} className="text-amber-400" fill="currentColor" />
              <span className="text-sm font-semibold text-gray-800">{florist.rating}</span>
              <span className="text-xs text-gray-400">({florist.reviews})</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
            <MapPin size={13} className="flex-shrink-0" />
            <span>{florist.area}, {florist.location}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {florist.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock size={12} />
              <span>{florist.deliveryTime}</span>
            </div>
            <span className="text-sm font-medium text-gray-700">From RM{florist.minOrder}</span>
          </div>

          {florist.freshGuarantee && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--accent)" }}>
              <Leaf size={11} />
              <span>Freshness Guaranteed</span>
            </div>
          )}
        </div>
      </motion.article>
    </Link>
  );
}
