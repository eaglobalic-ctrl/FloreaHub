import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { moderateMessage } from "@/lib/chatModeration";

type Role = "buyer" | "florist";

async function resolveRole(db: ReturnType<typeof getSupabaseAdmin>, conversationId: string, userId: string): Promise<Role | null> {
  const { data: convo } = await db.from("conversations").select("buyer_id, florist_id").eq("id", conversationId).maybeSingle();
  if (!convo) return null;
  if (convo.buyer_id === userId) return "buyer";
  const { data: florist } = await db.from("florists").select("id").eq("id", convo.florist_id).eq("user_id", userId).maybeSingle();
  return florist ? "florist" : null;
}

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ messages: [] });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ messages: [] });

    const db = getSupabaseAdmin();
    const role = await resolveRole(db, conversationId, session.userId);
    if (!role) return NextResponse.json({ messages: [] });

    const { data, error } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    // Clear the unread count for whichever side is reading
    await db.from("conversations").update(
      role === "buyer" ? { buyer_unread_count: 0 } : { florist_unread_count: 0 }
    ).eq("id", conversationId);

    return NextResponse.json({ messages: data ?? [], role });
  } catch (err) {
    console.error("Messages fetch error:", err);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { conversationId, content, imageUrl } = await req.json();
    if (!conversationId || (!content?.trim() && !imageUrl)) {
      return NextResponse.json({ error: "Missing message content" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const role = await resolveRole(db, conversationId, session.userId);
    if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (content?.trim()) {
      const check = moderateMessage(content);
      if (check.blocked) {
        return NextResponse.json({
          error: `For everyone's safety, please don't share ${check.reason}s in chat. Keep all communication and payments on FloreaHub — it's how we back the Freshness Guarantee.`,
        }, { status: 400 });
      }
    }

    const { data: message, error } = await db.from("messages").insert({
      conversation_id: conversationId,
      sender_role: role,
      content: content?.trim() || null,
      image_url: imageUrl || null,
    }).select().single();
    if (error) throw error;

    const otherRole: Role = role === "buyer" ? "florist" : "buyer";
    const { data: convo } = await db.from("conversations").select(`${otherRole}_unread_count`).eq("id", conversationId).maybeSingle();
    const currentUnread = (convo as unknown as Record<string, number> | null)?.[`${otherRole}_unread_count`] ?? 0;

    await db.from("conversations").update({
      last_message_at: new Date().toISOString(),
      [`${otherRole}_unread_count`]: currentUnread + 1,
    }).eq("id", conversationId);

    return NextResponse.json({ message });
  } catch (err) {
    console.error("Message send error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
