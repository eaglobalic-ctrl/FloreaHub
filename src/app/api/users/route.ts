import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWelcomeEmail, sendAdminFloristNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone, role, shopCity, shopState, shopPhone } = await req.json();
    if (!email || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getSupabaseAdmin();

    const { data: existing } = await db.from("users").select("id, email, name, role, status").eq("email", email).single();
    if (existing) return NextResponse.json({ user: existing, existed: true });

    const isSeller = role === "florist" || role === "seller";
    const status = isSeller ? "pending" : "active";

    const { data: user, error } = await db.from("users").insert({
      email, name,
      phone: shopPhone ?? phone ?? null,
      role: role ?? "buyer",
      status,
      shop_city: shopCity ?? null,
      shop_state: shopState ?? null,
    }).select("id, email, name, role, status").single();

    if (error) throw error;

    if (isSeller) {
      // Notify admin of new florist application
      sendAdminFloristNotification({ name, email, shopCity, shopPhone });
      // Send "application received" email to florist
      sendWelcomeEmail({ name: user!.name, email: user!.email, role: user!.role, status: "pending" });
    } else {
      sendWelcomeEmail({ name: user!.name, email: user!.email, role: user!.role, status: "active" });
    }

    return NextResponse.json({ user, existed: false });
  } catch (err) {
    console.error("User create error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from("users").select("id, email, name, phone, role, status").eq("email", email).single();
    if (error) return NextResponse.json({ user: null });
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, status, reviewedBy } = await req.json();
    if (!userId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: user, error } = await db
      .from("users")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: reviewedBy ?? "admin" })
      .eq("id", userId)
      .select("id, email, name, phone, role, status, shop_city, shop_state")
      .single();

    if (error) throw error;

    const isSeller = user!.role === "florist" || user!.role === "seller";

    if (isSeller) {
      if (status === "approved") {
        // Bridge users -> florists: this is what actually gives the seller a storefront
        const { data: existingFlorist } = await db.from("florists").select("id").eq("user_id", userId).maybeSingle();
        if (existingFlorist) {
          await db.from("florists").update({ is_active: true }).eq("id", existingFlorist.id);
        } else {
          const { error: floristError } = await db.from("florists").insert({
            user_id: userId,
            name: user!.name,
            city: user!.shop_city || "Kuala Lumpur",
            state: user!.shop_state || "Selangor",
            phone: user!.phone,
            email: user!.email,
            is_verified: true,
            is_active: true,
            plan: "free",
          });
          if (floristError) console.error("Florist create error:", floristError);
        }
      } else {
        // rejected, or revoked via the admin panel's re-approve/revoke toggle
        await db.from("florists").update({ is_active: false }).eq("user_id", userId);
      }
    }

    // Send email to florist based on decision
    const { sendFloristApprovedEmail, sendFloristRejectedEmail } = await import("@/lib/email");
    if (status === "approved") {
      sendFloristApprovedEmail({ name: user!.name, email: user!.email });
    } else if (status === "rejected") {
      sendFloristRejectedEmail({ name: user!.name, email: user!.email });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
