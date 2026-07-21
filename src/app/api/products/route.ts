import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");
  const floristId = searchParams.get("floristId");
  const q = searchParams.get("q");
  const maxPrice = searchParams.get("maxPrice");
  const sameDay = searchParams.get("sameDay");
  const sort = searchParams.get("sort") ?? "popular";

  try {
    const db = getSupabaseAdmin();

    // Single product by ID
    if (id) {
      const { data, error } = await db
        .from("products")
        .select("*, florists(id, name, city, state, cover_image, rating, review_count, same_day_delivery, phone)")
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (error) return NextResponse.json({ product: null });
      return NextResponse.json({ product: data });
    }

    let query = db.from("products").select("*, florists(id, name, city, plan)").eq("is_active", true);

    if (category && category !== "all") query = query.eq("category", category);
    if (floristId) query = query.eq("florist_id", floristId);
    if (q) query = query.ilike("name", `%${q}%`);
    if (maxPrice) query = query.lte("price", Number(maxPrice));
    if (sameDay === "true") query = query.eq("same_day", true);

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else if (sort === "rating") query = query.order("rating", { ascending: false });
    else query = query.order("review_count", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Plan-tier priority placement — only meaningful for the default
    // "popular" sort; explicit price/rating sorts are left untouched since
    // the customer asked for those specifically.
    if (sort !== "price_asc" && sort !== "price_desc" && sort !== "rating") {
      const PLAN_RANK: Record<string, number> = { elite: 0, pro: 1, starter: 2, free: 2 };
      (data ?? []).sort((a, b) => {
        const fa = a.florists as { plan?: string } | null;
        const fb = b.florists as { plan?: string } | null;
        return (PLAN_RANK[fa?.plan ?? "free"] ?? 2) - (PLAN_RANK[fb?.plan ?? "free"] ?? 2);
      });
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    console.error("Products fetch error:", err);
    return NextResponse.json({ products: [] });
  }
}

// Starter/free share the same cap — "starter" ($0/mo, /pricing) never
// actually lands in florists.plan since new florists default to 'free'.
const LISTING_LIMITS: Record<string, number> = { free: 5, starter: 5, pro: 50, elite: Infinity };

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { floristId, name, description, price, category, imageUrl, stock, sameDay } = await req.json();
    if (!floristId || !name || !price) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Only the florist's own (approved, active) owner can list products for it
    const { data: florist } = await db.from("florists").select("id, plan").eq("id", floristId).eq("user_id", session.userId).eq("is_active", true).maybeSingle();
    if (!florist) return NextResponse.json({ error: "Florist not found or not active" }, { status: 403 });

    const limit = LISTING_LIMITS[florist.plan] ?? LISTING_LIMITS.free;
    const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("florist_id", floristId);
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: `Your ${florist.plan} plan allows up to ${limit} listings. Upgrade your plan to add more products.` }, { status: 403 });
    }

    const { data: product, error } = await db.from("products").insert({
      florist_id: floristId,
      name,
      description: description ?? null,
      price,
      category: category ?? "daily",
      image_url: imageUrl ?? null,
      stock: stock ?? 0,
      same_day: !!sameDay,
    }).select("*").single();

    if (error) throw error;
    return NextResponse.json({ product });
  } catch (err) {
    console.error("Product create error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

const EDITABLE_FIELDS = ["name", "description", "price", "category", "image_url", "stock", "same_day", "is_active"] as const;

async function assertOwnsProduct(db: ReturnType<typeof getSupabaseAdmin>, productId: string, userId: string) {
  const { data: product } = await db.from("products").select("id, florist_id").eq("id", productId).maybeSingle();
  if (!product) return null;
  const { data: florist } = await db.from("florists").select("id").eq("id", product.florist_id).eq("user_id", userId).maybeSingle();
  return florist ? product : null;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { productId, ...fields } = await req.json();
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const db = getSupabaseAdmin();
    const owned = await assertOwnsProduct(db, productId, session.userId);
    if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const update: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in fields) update[key] = fields[key];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    const { data: product, error } = await db.from("products").update(update).eq("id", productId).select().single();
    if (error) throw error;

    return NextResponse.json({ product });
  } catch (err) {
    console.error("Product update error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const db = getSupabaseAdmin();
    const owned = await assertOwnsProduct(db, productId, session.userId);
    if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await db.from("products").delete().eq("id", productId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Product delete error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
