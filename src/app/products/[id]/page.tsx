import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const db = getSupabaseAdmin();
    const { data: product } = await db
      .from("products")
      .select("name, description, price, image_url, florists(name)")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (!product) return { title: "Product — FloreaHub" };

    const floristJoin = product.florists as unknown as { name: string } | { name: string }[] | null;
    const floristName = Array.isArray(floristJoin) ? floristJoin[0]?.name : floristJoin?.name;
    const title = `${product.name}${floristName ? ` by ${floristName}` : ""} — FloreaHub`;
    const description = product.description || `RM${product.price} — order from ${floristName ?? "a verified florist"} on FloreaHub with same-day delivery.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: product.image_url ? [product.image_url] : undefined,
      },
    };
  } catch {
    return { title: "Product — FloreaHub" };
  }
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
