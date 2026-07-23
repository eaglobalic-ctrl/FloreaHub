import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAppUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/florists`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/seller-guide`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const db = getSupabaseAdmin();
    const [products, florists] = await Promise.all([
      db.from("products").select("id").eq("is_active", true).limit(1000),
      db.from("florists").select("id").eq("is_active", true).eq("status", "approved").limit(1000),
    ]);

    const productRoutes: MetadataRoute.Sitemap = (products.data ?? []).map(p => ({
      url: `${base}/products/${p.id}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const floristRoutes: MetadataRoute.Sitemap = (florists.data ?? []).map(f => ({
      url: `${base}/florists/${f.id}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...productRoutes, ...floristRoutes];
  } catch {
    return staticRoutes;
  }
}
