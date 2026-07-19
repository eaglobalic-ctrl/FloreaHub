import { NextResponse } from "next/server";

export async function GET() {
  const mask = (v?: string) => v ? `${v.slice(0, 12)}... (${v.length}chars)` : "NOT SET";
  return NextResponse.json({
    url: mask(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    anonKey: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    serviceKey: mask(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
    allKeys: Object.keys(process.env).filter(k => k.includes("SUPA") || k.includes("POSTGRES")).sort(),
  });
}
