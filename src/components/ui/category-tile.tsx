"use client";
import Link from "next/link";
import { useSpotlight, SpotlightOverlay } from "@/hooks/useSpotlight";

export default function CategoryTile({
  href, Icon, label, count,
}: {
  href: string; Icon: React.ElementType; label: string; count: number;
}) {
  const spotlight = useSpotlight<HTMLAnchorElement>();

  return (
    <Link
      ref={spotlight.ref}
      onMouseMove={spotlight.onMouseMove}
      href={href}
      className="relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 bg-white hover:border-current hover:shadow-sm transition-all group group/spot"
      style={{ "--hover-color": "var(--primary)" } as React.CSSProperties}
    >
      <SpotlightOverlay size={160} />
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
        style={{ background: "var(--primary-light)" }}
      >
        <Icon size={18} style={{ color: "var(--primary)" }} strokeWidth={1.5} />
      </div>
      <span className="text-xs font-semibold text-gray-700 text-center group-hover:text-gray-900 transition-colors">{label}</span>
      <span className="text-xs text-gray-400">{count} items</span>
    </Link>
  );
}
