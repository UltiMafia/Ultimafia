function getWordMap(word) {
  wordMap = {};
  for (let letter of word) {
    if (!wordMap[letter]) {
      wordMap[letter] = 0;
    }

    wordMap[letter] += 1;
  }

  return wordMap;
}

function getWordScore(expectedWordMap, actualWord) {
  let score = 0;
  let actualWordMap = getWordMap(actualWord);

  for (let letter in expectedWordMap) {
    score += actualWordMap[letter] || 0;
  }

  return score;
}

module.exports = {
    getWordMap,
    getWordScore,
}
