import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { notify } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("products")
      .select("*, florists(id, name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    console.error("Admin products fetch error:", err);
    return NextResponse.json({ products: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { productId, is_active } = await req.json();
    if (!productId || typeof is_active !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: product, error } = await db.from("products").update({ is_active }).eq("id", productId).select("*, florists(user_id)").single();
    if (error) throw error;

    const ownerUserId = (product as { florists?: { user_id?: string } | null })?.florists?.user_id;
    if (ownerUserId) {
      await notify({
        userId: ownerUserId,
        type: "order",
        title: is_active ? "Your product listing has been restored" : "Your product listing was removed",
        body: is_active ? undefined : "This product was removed by an admin for a policy issue. Contact support for details.",
        link: "/dashboard/products",
      });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error("Admin product moderation error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
