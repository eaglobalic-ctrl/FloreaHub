// NEXT_PUBLIC_APP_URL was set in Vercel with a trailing slash
// ("https://floriahub.vercel.app/"), which produced double-slash URLs
// (".../api/toyyibpay/callback" became ".../..app/​/api/toyyibpay/callback")
// wherever it got concatenated with a path — silently breaking ToyyibPay's
// callback (orders stuck "pending" forever) since a double slash doesn't
// resolve to the same route. Stripping it here makes every caller safe
// regardless of how the env var is configured.
export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://floriahub.vercel.app").replace(/\/+$/, "");
}
