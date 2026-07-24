import type { NextRequest } from "next/server";
import { getSession, SessionPayload } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

// Session tokens are stateless (HMAC-signed, 30-day TTL) — getSession()
// alone only proves the cookie is unexpired and unforged, not that the
// account is still allowed to act. Admin "suspend" only flips
// users.is_active in the DB; without re-checking it here, a suspended
// user's existing session cookie keeps working everywhere until it
// naturally expires up to 30 days later. Use this instead of getSession()
// on routes where a suspended account taking the action actually matters
// (placing orders, chatting, posting reviews) — not needed for routes that
// only read the caller's own data back to them.
export async function getActiveSession(req: NextRequest): Promise<SessionPayload | null> {
  const session = getSession(req);
  if (!session) return null;

  const db = getSupabaseAdmin();
  const { data: user } = await db.from("users").select("is_active").eq("id", session.userId).maybeSingle();
  if (!user || user.is_active === false) return null;

  return session;
}
