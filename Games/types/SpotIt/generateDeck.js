function generateSpotItDeck(prime) {
  const n = prime;
  const cards = [];

  // Card 0: symbols 0..n
  const card0 = [];
  for (let i = 0; i <= n; i++) card0.push(i);
  cards.push(card0);

  // Cards 1..n: symbol 0 + row symbols
  for (let i = 0; i < n; i++) {
    const card = [0];
    for (let j = 0; j < n; j++) {
      card.push(n + 1 + i * n + j);
    }
    cards.push(card);
  }

  // Cards n+1..n^2+n: projective plane rows
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const card = [i + 1];
      for (let k = 0; k < n; k++) {
        card.push(n + 1 + ((i * k + j) % n) + k * n);
      }
      cards.push(card);
    }
  }

  for (const card of cards) {
    for (let i = card.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [card[i], card[j]] = [card[j], card[i]];
    }
  }

  return cards;
}

module.exports = generateSpotItDeck;