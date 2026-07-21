"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { trackAdEvent } from "@/lib/ads";

type Ad = { id: string; headline: string; tagline: string; florist_id: string };

export default function SponsoredBanner() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/ads?type=premium_banner")
      .then(r => r.json())
      .then(d => {
        if (d.ads?.[0]) { setAd(d.ads[0]); trackAdEvent(d.ads[0].id, "impression"); }
      })
      .catch(() => {});
  }, []);

  if (!ad || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a0a10 0%, #b5294e 50%, #2d6a4f 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="text-[10px] font-bold tracking-wider text-white/60 flex-shrink-0 uppercase">Sponsored</span>
          <p className="text-sm font-semibold text-white truncate">
            {ad.headline} <span className="font-normal text-white/70">— {ad.tagline}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/florists" onClick={() => trackAdEvent(ad.id, "click")} className="text-xs font-medium text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full flex items-center gap-1 transition-colors">
            Shop now <ExternalLink size={11} />
          </Link>
          <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
