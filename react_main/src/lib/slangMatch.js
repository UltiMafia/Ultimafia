const CONJUGATION_SUFFIXES = ["ing", "ed", "es", "s"];

export function getSlangKey(word, slangList) {
  if (!word || typeof word !== "string") return undefined;

  const keys = Object.keys(slangList);
  const wordLower = word.toLowerCase();

  // Exact match (case-insensitive)
  const exact = keys.find((k) => k.toLowerCase() === wordLower);
  if (exact) return exact;

  // Conjugated form: strip common verb endings and match against a key
  for (const suffix of CONJUGATION_SUFFIXES) {
    if (wordLower.length <= suffix.length) continue;
    if (!wordLower.endsWith(suffix)) continue;
    const base = wordLower.slice(0, -suffix.length);
    if (base.length < 2) continue; // avoid single-char bases
    const key = keys.find((k) => k.toLowerCase() === base);
    if (key) return key;
  }

  return undefined;
}
