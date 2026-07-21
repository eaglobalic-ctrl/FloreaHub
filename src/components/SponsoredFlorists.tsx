"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { trackAdEvent } from "@/lib/ads";

type Ad = {
  id: string; headline: string; tagline: string;
  florist_id: string; florist_name: string; image_url: string;
};

export default function SponsoredFlorists() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch("/api/ads?type=shop_spotlight")
      .then(r => r.json())
      .then(d => {
        const top3 = (d.ads ?? []).slice(0, 3);
        setAds(top3);
        top3.forEach((ad: Ad) => trackAdEvent(ad.id, "impression"));
      })
      .catch(() => {});
  }, []);

  if (ads.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-rose-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Featured</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Spotlight Florists</h2>
            <p className="text-sm text-gray-500 mt-0.5">Top-rated shops promoted on FloreaHub</p>
          </div>
          <Link href="/florists" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            See all florists →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ads.map((ad, i) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <Link href={`/florists/${ad.florist_id}`} onClick={() => trackAdEvent(ad.id, "click")} className="block">
                <div className="h-44 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ad.image_url} alt={ad.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">Sponsored</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-semibold text-sm leading-snug">{ad.headline}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{ad.florist_name}</p>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-medium text-gray-700">4.8</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{ad.tagline}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin size={11} /> Kuala Lumpur</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> Same-day</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
