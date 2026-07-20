import crypto from "crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "floreahub_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

export type SessionPayload = { userId: string; email: string; role: string };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(payload: SessionPayload): string {
  const secret = getSecret();
  const data = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  return `${data}.${sign(data, secret)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return null;
  }

  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const expected = sign(data, secret);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (Date.now() - payload.iat > SESSION_MAX_AGE * 1000) return null;
    return { userId: payload.userId, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): SessionPayload | null {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

