import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

async function assertOwnsFlorist(db: ReturnType<typeof getSupabaseAdmin>, floristId: string, userId: string) {
  const { data } = await db.from("florists").select("id").eq("id", floristId).eq("user_id", userId).maybeSingle();
  return !!data;
}

// The florist's own current plan subscription (active or cancelled-but-not-
// yet-expired) — powers the "view/cancel current plan" dashboard section.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ subscription: null });

  const { searchParams } = new URL(req.url);
  const floristId = searchParams.get("floristId");
  if (!floristId) return NextResponse.json({ subscription: null });

  try {
    const db = getSupabaseAdmin();
    if (!(await assertOwnsFlorist(db, floristId, session.userId))) {
      return NextResponse.json({ subscription: null });
    }

    const { data } = await db
      .from("subscriptions")
      .select("*")
      .eq("florist_id", floristId)
      .in("status", ["active", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ subscription: data ?? null });
  } catch (err) {
    console.error("Subscription fetch error:", err);
    return NextResponse.json({ subscription: null });
  }
}

// Cancel = stop auto-renewal reminders and skip the plan when it expires —
// ToyyibPay has no recurring billing to actually cancel, so the florist
// keeps their current plan's benefits until the period they already paid
// for (ends_at) runs out, same as most "cancel anytime" SaaS plans.
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const { floristId } = await req.json();
    if (!floristId) return NextResponse.json({ error: "Missing floristId" }, { status: 400 });

    const db = getSupabaseAdmin();
    if (!(await assertOwnsFlorist(db, floristId, session.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: sub, error } = await db
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("florist_id", floristId)
      .eq("status", "active")
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!sub) return NextResponse.json({ error: "No active subscription to cancel" }, { status: 404 });

    return NextResponse.json({ subscription: sub });
  } catch (err) {
    console.error("Subscription cancel error:", err);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
