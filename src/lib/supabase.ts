import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

// Strip BOM (U+FEFF, value 65279) Vercel prepends when env vars are saved with BOM encoding
const clean = (v?: string) => (v ?? "").replace(/^﻿/, "").trim();

function getUrl() {
  return clean(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL
  );
}

function getAnonKey() {
  return clean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY
  );
}

function getServiceKey() {
  return clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  );
}

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(getUrl(), getAnonKey());
  }
  return _client;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(getUrl(), getServiceKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _admin;
}