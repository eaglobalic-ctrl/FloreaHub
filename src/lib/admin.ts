// Read from env, not hardcoded — a hardcoded admin email sitting in git
// history tells anyone who can see the repo exactly which account to
// target for phishing/credential-stuffing. Comma-separated for more than
// one admin later. Falls back to the original address only so an unset env
// var doesn't lock the only admin account out immediately; set ADMIN_EMAILS
// in Vercel and this fallback becomes dead weight that can be deleted.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "pretty.dalisya@gmail.com")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | undefined | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
