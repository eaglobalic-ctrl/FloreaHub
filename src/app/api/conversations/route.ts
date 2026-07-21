import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ conversations: [] });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") === "florist" ? "florist" : "buyer";

    const db = getSupabaseAdmin();

    if (role === "buyer") {
      const { data, error } = await db
        .from("conversations")
        .select("*, florists(id, name, cover_image)")
        .eq("buyer_id", session.userId)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ conversations: data ?? [] });
    }

    // role === "florist" — only the shop this user owns
    const { data: florist } = await db.from("florists").select("id").eq("user_id", session.userId).maybeSingle();
    if (!florist) return NextResponse.json({ conversations: [] });

    const { data, error } = await db
      .from("conversations")
      .select("*, users(id, name)")
      .eq("florist_id", florist.id)
      .order("last_message_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ conversations: data ?? [] });
  } catch (err) {
    console.error("Conversations fetch error:", err);
    return NextResponse.json({ conversations: [] });
  }
}

// Buyer starts (or resumes) a conversation with a florist
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { floristId } = await req.json();
    if (!floristId) return NextResponse.json({ error: "Missing floristId" }, { status: 400 });

    const db = getSupabaseAdmin();

    const { data: existing } = await db
      .from("conversations")
      .select("*")
      .eq("buyer_id", session.userId)
      .eq("florist_id", floristId)
      .maybeSingle();
    if (existing) return NextResponse.json({ conversation: existing });

    const { data: created, error } = await db
      .from("conversations")
      .insert({ buyer_id: session.userId, florist_id: floristId })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ conversation: created });
  } catch (err) {
    console.error("Conversation create error:", err);
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }
}
