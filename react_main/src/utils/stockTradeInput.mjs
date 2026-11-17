// Matches the server bound in lib/StockMarket.js. Keep the preview loop bounded.
export const MAX_SHARES_PER_TRADE = 1000;
export function boundedShareCount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(MAX_SHARES_PER_TRADE, Math.floor(number))) : 1;
}
