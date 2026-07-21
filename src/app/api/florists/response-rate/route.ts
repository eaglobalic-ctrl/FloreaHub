import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Shopee-style trust signal: % of chat threads a seller actually replied
// to, and how fast. Computed on request rather than cached — a florist's
// message volume is small enough that this is cheap, and it means the
// number is always current instead of stale between cron runs.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const floristId = searchParams.get("floristId");
    if (!floristId) return NextResponse.json({ error: "Missing floristId" }, { status: 400 });

    const db = getSupabaseAdmin();

    const { data: conversations } = await db.from("conversations").select("id").eq("florist_id", floristId);
    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ responseRate: null, avgResponseMinutes: null, sampleSize: 0 });
    }

    const { data: messages } = await db
      .from("messages")
      .select("conversation_id, sender_role, created_at")
      .in("conversation_id", conversations.map(c => c.id))
      .order("created_at", { ascending: true });

    let repliedCount = 0;
    let totalWithBuyerMsg = 0;
    const responseTimesMs: number[] = [];

    for (const convo of conversations) {
      const thread = (messages ?? []).filter(m => m.conversation_id === convo.id);
      const firstBuyer = thread.find(m => m.sender_role === "buyer");
      if (!firstBuyer) continue;
      totalWithBuyerMsg++;

      const firstReply = thread.find(m => m.sender_role === "florist" && new Date(m.created_at) > new Date(firstBuyer.created_at));
      if (firstReply) {
        repliedCount++;
        responseTimesMs.push(new Date(firstReply.created_at).getTime() - new Date(firstBuyer.created_at).getTime());
      }
    }

    if (totalWithBuyerMsg === 0) {
      return NextResponse.json({ responseRate: null, avgResponseMinutes: null, sampleSize: 0 });
    }

    const responseRate = Math.round((repliedCount / totalWithBuyerMsg) * 100);
    const avgResponseMinutes = responseTimesMs.length
      ? Math.round(responseTimesMs.reduce((s, v) => s + v, 0) / responseTimesMs.length / 60000)
      : null;

    return NextResponse.json({ responseRate, avgResponseMinutes, sampleSize: totalWithBuyerMsg });
  } catch (err) {
    console.error("Response rate error:", err);
    return NextResponse.json({ responseRate: null, avgResponseMinutes: null, sampleSize: 0 });
  }
}
