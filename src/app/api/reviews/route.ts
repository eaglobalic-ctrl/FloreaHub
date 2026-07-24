import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { notify } from "@/lib/notify";
import { rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const floristId = searchParams.get("floristId");
  const productId = searchParams.get("productId");
  const mine = searchParams.get("mine") === "1";

  try {
    const db = getSupabaseAdmin();
    let query = db.from("reviews").select("*, users(name, avatar_url)").order("created_at", { ascending: false });

    if (mine) {
      const session = getSession(req);
      if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
      query = query.eq("user_id", session.userId);
    } else {
      if (floristId) query = query.eq("florist_id", floristId);
      if (productId) query = query.eq("product_id", productId);
    }

    const { data, error } = await query.limit(mine ? 200 : 20);
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

    if (!(await rateLimit(req, "review", 10, 300))) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const { floristId, productId, orderId, rating, comment } = await req.json();
    if (!floristId || !rating) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getSupabaseAdmin();

    // The order must actually belong to this buyer — otherwise anyone could review any florist
    if (orderId) {
      const { data: order } = await db.from("orders").select("id, buyer_confirmed_at").eq("id", orderId).eq("buyer_email", session.email).maybeSingle();
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 403 });

      // Can't review until the buyer has actually confirmed they received
      // it — a florist marking it "delivered" isn't proof it arrived.
      if (!order.buyer_confirmed_at) return NextResponse.json({ error: "Confirm you've received this order before leaving a review" }, { status: 403 });

      // One review per (order, product) — a multi-item order lets a buyer
      // rate each product separately. Without this check, resubmitting (e.g.
      // after a page refresh, since the client-side "already reviewed"
      // state was never actually seeded from the server) silently created
      // duplicates.
      let dupQuery = db.from("reviews").select("id").eq("order_id", orderId).eq("user_id", session.userId);
      dupQuery = productId ? dupQuery.eq("product_id", productId) : dupQuery.is("product_id", null);
      const { data: existing } = await dupQuery.maybeSingle();
      if (existing) return NextResponse.json({ error: "You've already reviewed this product for this order" }, { status: 409 });
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

    const { data: floristOwner } = await db.from("florists").select("user_id, name").eq("id", floristId).maybeSingle();
    if (floristOwner?.user_id) {
      await notify({
        userId: floristOwner.user_id,
        type: "review",
        title: `New ${rating}★ review`,
        body: comment ? String(comment).slice(0, 120) : undefined,
        link: "/dashboard/reviews",
      });
    }

    // Update florist rating average
    const { data: floristReviews } = await db.from("reviews").select("rating").eq("florist_id", floristId);
    if (floristReviews?.length) {
      const avg = floristReviews.reduce((s, r) => s + r.rating, 0) / floristReviews.length;
      await db.from("florists").update({ rating: Math.round(avg * 10) / 10, review_count: floristReviews.length }).eq("id", floristId);
    }

    // Update product rating average — this never happened before, which is
    // why a product's own rating/review_count stayed frozen at whatever it
    // was seeded with even after real reviews came in.
    if (productId) {
      const { data: productReviews } = await db.from("reviews").select("rating").eq("product_id", productId);
      if (productReviews?.length) {
        const avg = productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length;
        await db.from("products").update({ rating: Math.round(avg * 10) / 10, review_count: productReviews.length }).eq("id", productId);
      }
    }

    return NextResponse.json({ review: data });
  } catch (err) {
    console.error("Review create error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
