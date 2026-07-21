// Same rule Shopee/Lazada enforce in their chat: block attempts to move
// the conversation (and the transaction) off-platform. Numbers, emails,
// and links to other messaging apps are the common vectors.

const PHONE_RE = /(\+?60|0)[\s.-]?1[0-9][\s.-]?\d{3}[\s.-]?\d{4}/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_RE = /https?:\/\/\S+|www\.\S+/i;
const EXTERNAL_APP_RE = /\bwa\.me\b|\bwhatsapp\b|\bt\.me\b|\btelegram\b|\binstagram\b|\bwechat\b|\bfacebook\b|\bfb\.com\b/i;

export function moderateMessage(text: string): { blocked: boolean; reason?: string } {
  if (PHONE_RE.test(text)) return { blocked: true, reason: "phone number" };
  if (EMAIL_RE.test(text)) return { blocked: true, reason: "email address" };
  if (URL_RE.test(text)) return { blocked: true, reason: "external link" };
  if (EXTERNAL_APP_RE.test(text)) return { blocked: true, reason: "external app mention" };
  return { blocked: false };
}
