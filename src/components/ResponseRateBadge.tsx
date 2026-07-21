"use client";
import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} hr`;
  return `${Math.round(minutes / (24 * 60))} day${minutes >= 2 * 24 * 60 ? "s" : ""}`;
}

export default function ResponseRateBadge({ floristId, className = "" }: { floristId: string; className?: string }) {
  const [data, setData] = useState<{ responseRate: number | null; avgResponseMinutes: number | null; sampleSize: number } | null>(null);

  useEffect(() => {
    fetch(`/api/florists/response-rate?floristId=${floristId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [floristId]);

  // Shopee only shows this once there's a meaningful sample — a single
  // reply shouldn't produce a headline "100% response rate" claim.
  if (!data || data.sampleSize < 3 || data.responseRate === null) return null;

  return (
    <div className={`flex items-center gap-2.5 text-gray-600 ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
        <Zap size={13} className="text-amber-500" />
      </div>
      <span>
        {data.responseRate}% response rate
        {data.avgResponseMinutes != null && <> · replies in ~{formatDuration(data.avgResponseMinutes)}</>}
      </span>
    </div>
  );
}
