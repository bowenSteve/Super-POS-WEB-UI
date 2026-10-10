// Shared pricing constants for the marketing site (Landing + Pages).
// Fixes a bug in the original design export, where the Landing page's
// pricing section referenced an undefined `priceStarter` identifier.
export const PLANS = {
  starter: { name: 'Kibanda', monthly: 0 },
  growth: { name: 'Duka', monthly: 2900 },
  scale: { name: 'Chain', monthly: 7400 },
}

export function formatPrice(monthly, annual) {
  const amount = annual ? Math.round(monthly * 0.8) : monthly
  return amount.toLocaleString('en-KE')
}
