const stockMarket = require('./lib/StockMarket');

function buildPriceHistory(stocks, txsMap, idField) {
  const historyMap = {};
  for (const stock of stocks) {
    const entityId = stock[idField];
    const txs = txsMap[entityId] || [];
    let supply = stock.shareSupply;
    const prices = [];
    for (const tx of txs) {
      prices.push(stockMarket.calculatePrice(supply));
      if (tx.type === "buy") {
        supply = Math.max(1, supply - (tx.shares || 0));
      } else if (tx.type === "sell") {
        supply += (tx.shares || 0);
      }
    }
    prices.push(stockMarket.calculatePrice(supply));
    prices.reverse();
    historyMap[entityId] = prices;
  }
  return historyMap;
}

const stocks = [{ userId: 'user1', shareSupply: 50 }];
const txsMap = {
  'user1': [
    { type: 'buy', shares: 10 }, // Newest: bought 10 shares (went from 40 to 50)
    { type: 'sell', shares: 5 }, // Older: sold 5 shares (went from 45 to 40)
    { type: 'buy', shares: 44 }, // Oldest: bought 44 shares (went from 1 to 45)
  ]
};

console.log(buildPriceHistory(stocks, txsMap, 'userId')['user1']);
