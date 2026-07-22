// First-pass automated moderation for florist-submitted ad content — a
// blocklist check run before payment, so nothing needing outright rejection
// (profanity, scam language, illegal-goods references) ever reaches a paid,
// live campaign. This is not a full review queue (that's the admin panel's
// ads oversight, FASA 6.6) — it only catches the obvious cases automatically.
const BLOCKED_TERMS = [
  "viagra", "casino", "judi", "bet online", "escort", "sex", "porn",
  "narkoba", "dadah", "drug", "firearm", "senjata api", "counterfeit", "tiruan",
  "guaranteed income", "get rich quick", "pyramid scheme", "skim cepat kaya",
];

export function moderateAdContent(headline: string, tagline?: string): { blocked: boolean; reason?: string } {
  const text = `${headline} ${tagline ?? ""}`.toLowerCase();
  const hit = BLOCKED_TERMS.find(term => text.includes(term));
  if (hit) return { blocked: true, reason: `Ad content contains a disallowed term ("${hit}"). Please revise your headline/tagline.` };
  return { blocked: false };
}
