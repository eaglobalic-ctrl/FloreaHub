import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logSystemError } from "@/lib/systemLog";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Fixed-window rate limit backed by the `rate_limits` table/RPC (see
// supabase-rate-limits.sql). Fails open on DB error — a rate limiter that
// blocks real users during a Supabase hiccup is worse than no limiter.
export async function rateLimit(req: NextRequest, bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const ip = getClientIp(req);
  const key = `${bucket}:${ip}`;
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.rpc("check_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
    if (error) {
      await logSystemError("Rate limit check FAILED — failing open", { key, error });
      return true;
    }
    return data === true;
  } catch (err) {
    await logSystemError("Rate limit check THREW — failing open", { key, error: String(err) });
    return true;
  }
}

export const RATE_LIMIT_MESSAGE = "Too many attempts — please wait a moment and try again.";
