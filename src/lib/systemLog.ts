import { getSupabaseAdmin } from "@/lib/supabase";

// Writes to both console (for Vercel's own logs) and a system_errors table
// (so the Admin Panel can show recent failures without needing Vercel
// dashboard log navigation at all) — added after several rounds of a
// silent order-insert failure being nearly impossible to diagnose otherwise.
export async function logSystemError(context: string, detail: unknown) {
  console.error(context, JSON.stringify(detail));
  try {
    await getSupabaseAdmin().from("system_errors").insert({ context, detail: detail as object });
  } catch {
    // Never let logging itself break the caller.
  }
}
