import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { moderateMessage } from "@/lib/chatModeration";
import { sendNewChatMessageEmail } from "@/lib/email";

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

    // Blocked messages are kept in the table (audit trail for admin chat
    // moderation) but never shown to either side of the conversation.
    const { data, error } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("blocked_reason", null)
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
        // Recorded (not silently dropped) so admin chat moderation has an
        // audit trail of blocked attempts — GET filters these out, so
        // neither side of the conversation ever sees it.
        await db.from("messages").insert({
          conversation_id: conversationId,
          sender_role: role,
          content: content.trim(),
          blocked_reason: check.reason,
        });
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
    const { data: convo } = await db
      .from("conversations")
      .select("buyer_id, florist_id, buyer_unread_count, florist_unread_count")
      .eq("id", conversationId)
      .maybeSingle();

    const currentUnread = (otherRole === "buyer" ? convo?.buyer_unread_count : convo?.florist_unread_count) ?? 0;

    await db.from("conversations").update({
      last_message_at: new Date().toISOString(),
      [`${otherRole}_unread_count`]: currentUnread + 1,
    }).eq("id", conversationId);

    // Email notification — only on the 0-to-1 transition, so a burst of
    // messages produces one email, not one per message, until the
    // recipient actually reads the thread and it can fire again.
    if (currentUnread === 0 && convo) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://floriahub.vercel.app";
        const preview = content?.trim() ? content.trim().slice(0, 140) : "📷 Sent a photo";

        if (otherRole === "florist") {
          const { data: florist } = await db.from("florists").select("name, email, user_id").eq("id", convo.florist_id).maybeSingle();
          const { data: buyer } = await db.from("users").select("name").eq("id", convo.buyer_id).maybeSingle();
          if (florist?.email) {
            await sendNewChatMessageEmail({
              toEmail: florist.email,
              toName: florist.name ?? "there",
              fromName: buyer?.name ?? "A buyer",
              preview,
              conversationUrl: `${baseUrl}/dashboard`,
            });
          }
        } else {
          const { data: buyer } = await db.from("users").select("name, email").eq("id", convo.buyer_id).maybeSingle();
          const { data: florist } = await db.from("florists").select("name").eq("id", convo.florist_id).maybeSingle();
          if (buyer?.email) {
            await sendNewChatMessageEmail({
              toEmail: buyer.email,
              toName: buyer.name ?? "there",
              fromName: florist?.name ?? "The shop",
              preview,
              conversationUrl: `${baseUrl}/messages`,
            });
          }
        }
      } catch (emailErr) {
        console.error("Chat notification email error (non-blocking):", emailErr);
      }
    }

    return NextResponse.json({ message });
  } catch (err) {
    console.error("Message send error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
