// Server-side verification for Google reCAPTCHA v3. Score ranges 0.0 (bot)
// to 1.0 (human) — 0.5 is Google's own suggested default threshold.
const SCORE_THRESHOLD = 0.5;

export async function verifyRecaptcha(token: string | undefined, expectedAction: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  // If reCAPTCHA isn't configured, don't block the form — treat it as
  // not-yet-set-up rather than silently locking everyone out.
  if (!secretKey) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });
    const data = await res.json();
    return !!data.success && data.action === expectedAction && (data.score ?? 0) >= SCORE_THRESHOLD;
  } catch (err) {
    console.error("reCAPTCHA verify error:", err);
    // Network hiccup talking to Google shouldn't be the reason a real
    // person can't sign up or send a message — fail open, not closed.
    return true;
  }
}
