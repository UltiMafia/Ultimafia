function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "")
    .trim();
}

module.exports.matchesWord = function (guess, target) {
  return normalize(guess) === normalize(target);
};
