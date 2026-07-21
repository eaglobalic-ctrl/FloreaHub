export type AdType = "product_boost" | "shop_spotlight" | "premium_banner";
export type AdStatus = "active" | "pending" | "expired" | "paused";

export type AdCampaign = {
  id: string;
  floristId: string;
  floristName: string;
  type: AdType;
  productId?: string;
  productName?: string;
  imageUrl: string;
  headline: string;
  tagline: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: AdStatus;
  clicks: number;
  impressions: number;
  createdAt: string;
};

export const AD_PLANS = [
  {
    id: "product_boost" as AdType,
    name: "Product Boost",
    price: 30,
    duration: 7,
    description: "Pin your product to the top of search results & category pages",
    features: ["Top placement in shop", "Sponsored badge", "7-day campaign", "Click analytics"],
    badge: "Most Popular",
    color: "#b5294e",
  },
  {
    id: "shop_spotlight" as AdType,
    name: "Shop Spotlight",
    price: 80,
    duration: 7,
    description: "Feature your shop on the FloreaHub homepage and florists listing",
    features: ["Homepage featured section", "Florists page priority", "Sponsored badge", "Impression & click stats"],
    badge: "Best Value",
    color: "#2d6a4f",
  },
  {
    id: "premium_banner" as AdType,
    name: "Premium Banner",
    price: 200,
    duration: 7,
    description: "Full-width banner ad displayed sitewide across all pages",
    features: ["Sitewide banner placement", "Custom headline & image", "Maximum reach", "Priority support"],
    badge: "Max Reach",
    color: "#6d28d9",
  },
];

const KEY = "floreahub_ads";

export function getAds(): AdCampaign[] {
  if (typeof window === "undefined") return DEMO_ADS;
  try {
    const stored = localStorage.getItem(KEY);
    const ads: AdCampaign[] = stored ? JSON.parse(stored) : [];
    return [...DEMO_ADS, ...ads];
  } catch {
    return DEMO_ADS;
  }
}

export function saveAd(ad: AdCampaign): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(KEY);
    const ads: AdCampaign[] = stored ? JSON.parse(stored) : [];
    ads.push(ad);
    localStorage.setItem(KEY, JSON.stringify(ads));
    window.dispatchEvent(new Event("ads-updated"));
  } catch {}
}

// Reports a real impression/click to the `ads` table via the API — replaces
// the old trackImpression/trackClick which only wrote to the viewer's own
// localStorage and never produced any real aggregate data server-side.
export function trackAdEvent(adId: string, type: "impression" | "click"): void {
  fetch("/api/ads/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adId, type }),
    keepalive: true,
  }).catch(() => {});
}

const AI = "https://image.pollinations.ai/prompt";

function makeDemoAds(): AdCampaign[] {
  const now = new Date().toISOString();
  const end = new Date();
  end.setDate(end.getDate() + 7);
  const in7 = end.toISOString();
  return [
    {
      id: "demo-ad-1", floristId: "1", floristName: "Bloom & Co",
      type: "shop_spotlight", productId: "1", productName: "Classic Rose Bouquet",
      imageUrl: `${AI}/romantic+red+roses+bouquet+arrangement+white+background?width=600&height=400&nologo=true&seed=5001`,
      headline: "Malaysia's #1 Romantic Bouquet", tagline: "Fresh roses, same-day delivery across KL",
      budget: 80, startDate: now, endDate: in7, status: "active",
      clicks: 124, impressions: 3421, createdAt: now,
    },
    {
      id: "demo-ad-2", floristId: "2", floristName: "Petal Paradise",
      type: "product_boost", productId: "3", productName: "Wedding White Collection",
      imageUrl: `${AI}/elegant+white+wedding+flowers+arrangement+luxury?width=600&height=400&nologo=true&seed=5002`,
      headline: "Dream Wedding Florals", tagline: "Bespoke wedding arrangements by Petal Paradise",
      budget: 30, startDate: now, endDate: in7, status: "active",
      clicks: 87, impressions: 1893, createdAt: now,
    },
    {
      id: "demo-ad-3", floristId: "3", floristName: "Garden Dreams",
      type: "premium_banner", imageUrl: `${AI}/tropical+colorful+flowers+malaysia+banner+premium?width=1200&height=300&nologo=true&seed=5003`,
      headline: "Fresh From the Garden — Every Day", tagline: "Order before 2PM for guaranteed same-day delivery",
      budget: 200, startDate: now, endDate: in7, status: "active",
      clicks: 213, impressions: 8432, createdAt: now,
    },
  ];
}

export const DEMO_ADS: AdCampaign[] = typeof window !== "undefined" ? makeDemoAds() : [];
