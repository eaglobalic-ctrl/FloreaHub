"use client";
import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
};

export default function TestimonialsColumn({
  testimonials,
  duration = 18,
  className = "",
}: {
  testimonials: Testimonial[];
  duration?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <motion.div
        animate={{ y: "-50%" }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        className="flex flex-col gap-5 pb-5"
      >
        {[...testimonials, ...testimonials].map((t, i) => (
          <div
            key={i}
            className="card-premium p-5 shrink-0"
          >
            <Quote size={16} className="text-gray-200 mb-3" />
            <div className="flex items-center gap-1 mb-3">
              {[...Array(t.rating)].map((_, s) => (
                <Star key={s} size={11} className="text-amber-400" fill="currentColor" />
              ))}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                style={{ background: "var(--primary)" }}
              >
                {t.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                <div className="text-xs text-gray-400 truncate">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
