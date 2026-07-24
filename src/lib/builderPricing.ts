// Single source of truth for custom-bouquet-builder pricing — shared by the
// builder UI (src/app/builder/page.tsx) and the checkout API
// (src/app/api/toyyibpay/create-bill/route.ts). The builder has no backing
// `products` row to look up a price from, so without this shared table the
// server would have no way to recompute what a builder item SHOULD cost and
// would have to trust whatever price the client sends.
export const BUILDER_FLOWER_PRICES: Record<string, number> = {
  "rose-red": 8,
  "rose-pink": 8,
  lily: 10,
  sunflower: 6,
  tulip: 12,
  daisy: 5,
  orchid: 15,
  hydrangea: 11,
};

export const BUILDER_WRAP_PRICES: Record<string, number> = {
  kraft: 0,
  lace: 10,
  velvet: 15,
  clear: 8,
};

export const BUILDER_BASE_FEE = 20;

export type BuilderFlowerSelection = { id: string; qty: number };

// Unknown flower/wrap ids contribute 0 rather than throwing — an attacker
// submitting a bogus id should get charged for nothing added, not crash
// the checkout for every other legitimate item in the same cart.
export function computeBuilderTotal(flowers: BuilderFlowerSelection[], wrapId: string): number {
  const flowersTotal = (flowers ?? []).reduce((sum, sel) => {
    const price = BUILDER_FLOWER_PRICES[sel?.id];
    if (price === undefined) return sum;
    const qty = Math.max(0, Math.floor(Number(sel.qty) || 0));
    return sum + price * qty;
  }, 0);
  const wrapCost = BUILDER_WRAP_PRICES[wrapId] ?? 0;
  return flowersTotal + wrapCost + BUILDER_BASE_FEE;
}
