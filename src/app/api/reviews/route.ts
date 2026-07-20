import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const floristId = searchParams.get("floristId");
  const productId = searchParams.get("productId");

  try {
    const db = getSupabaseAdmin();
    let query = db.from("reviews").select("*, users(name, avatar_url)").order("created_at", { ascending: false });

    if (floristId) query = query.eq("florist_id", floristId);
    if (productId) query = query.eq("product_id", productId);

    const { data, error } = await query.limit(20);
    if (error) throw error;
    return NextResponse.json({ reviews: data ?? [] });
  } catch (err) {
    console.error("Reviews fetch error:", err);
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { floristId, productId, orderId, rating, comment } = await req.json();
    if (!floristId || !rating) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getSupabaseAdmin();

    // The order must actually belong to this buyer — otherwise anyone could review any florist
    if (orderId) {
      const { data: order } = await db.from("orders").select("id").eq("id", orderId).eq("buyer_email", session.email).maybeSingle();
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 403 });
    }

    const { data, error } = await db.from("reviews").insert({
      florist_id: floristId,
      product_id: productId ?? null,
      order_id: orderId ?? null,
      user_id: session.userId,
      rating,
      comment: comment ?? null,
    }).select().single();

    if (error) throw error;

    // Update florist rating average
    const { data: allReviews } = await db.from("reviews").select("rating").eq("florist_id", floristId);
    if (allReviews?.length) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await db.from("florists").update({ rating: Math.round(avg * 10) / 10, review_count: allReviews.length }).eq("id", floristId);
    }

    return NextResponse.json({ review: data });
  } catch (err) {
    console.error("Review create error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
