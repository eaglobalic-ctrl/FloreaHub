import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api", "/checkout", "/messages", "/orders", "/profile"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
