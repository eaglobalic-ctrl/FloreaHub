import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { sendNewChatMessageEmail } from "@/lib/email";

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

type ProductContext = { id: string; name: string; price: number; image?: string | null; originalPrice?: number | null; rating?: number | null };

// Buyer starts (or resumes) a conversation with a florist. If opened from a
// product page, attaches a one-time product-card message — same as
// Shopee's "Chat Now" on a product listing — so the seller sees exactly
// what's being asked about without the buyer typing it out.
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { floristId, product } = await req.json() as { floristId: string; product?: ProductContext };
    if (!floristId) return NextResponse.json({ error: "Missing floristId" }, { status: 400 });

    const db = getSupabaseAdmin();

    const { data: existing } = await db
      .from("conversations")
      .select("*")
      .eq("buyer_id", session.userId)
      .eq("florist_id", floristId)
      .maybeSingle();

    const conversation = existing ?? (await (async () => {
      const { data: created, error } = await db
        .from("conversations")
        .insert({ buyer_id: session.userId, florist_id: floristId })
        .select()
        .single();
      if (error) throw error;
      return created;
    })());

    if (product?.id) {
      const { data: alreadyAttached } = await db
        .from("messages")
        .select("id")
        .eq("conversation_id", conversation.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (!alreadyAttached) {
        const { error: msgError } = await db.from("messages").insert({
          conversation_id: conversation.id,
          sender_role: "buyer",
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image ?? null,
          product_original_price: product.originalPrice ?? null,
          product_rating: product.rating ?? null,
        });
        if (msgError) {
          console.error("Product card insert error:", msgError);
          throw msgError;
        }
        const wasUnread = conversation.florist_unread_count ?? 0;
        await db.from("conversations").update({
          last_message_at: new Date().toISOString(),
          florist_unread_count: wasUnread + 1,
        }).eq("id", conversation.id);

        if (wasUnread === 0) {
          try {
            const { data: florist } = await db.from("florists").select("name, email").eq("id", floristId).maybeSingle();
            const { data: buyer } = await db.from("users").select("name").eq("id", session.userId).maybeSingle();
            if (florist?.email) {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://floriahub.vercel.app";
              await sendNewChatMessageEmail({
                toEmail: florist.email,
                toName: florist.name ?? "there",
                fromName: buyer?.name ?? "A buyer",
                preview: `Asking about: ${product.name}`,
                conversationUrl: `${baseUrl}/dashboard`,
              });
            }
          } catch (emailErr) {
            console.error("Chat notification email error (non-blocking):", emailErr);
          }
        }
      }
    }

    return NextResponse.json({ conversation });
  } catch (err) {
    console.error("Conversation create error:", err);
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }
}
