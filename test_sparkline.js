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

const stocks = [{ userId: 'user1', shareSupply: 10 }];
const txsMap = {
  'user1': [
    { type: 'buy', shares: 2 }, // Newest: bought 2 shares (supply went from 8 to 10)
    { type: 'sell', shares: 3 }, // Older: sold 3 shares (supply went from 11 to 8)
    { type: 'buy', shares: 10 }, // Oldest: bought 10 shares (supply went from 1 to 11)
  ]
};

const result = buildPriceHistory(stocks, txsMap, 'userId');
console.log(result['user1']);
