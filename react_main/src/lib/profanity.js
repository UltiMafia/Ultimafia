import {
  slurs,
  swears,
  getSwearReplacement,
  theLWord,
  theLWordFilter
} from "../constants/filteredStrings";

/* --- ROT13 decoding --- */
function rot13(str) {
  return str.replace(/[a-zA-Z]/g, (c) =>
    String.fromCharCode(
      (c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
    )
  );
}

/* Decode lists before passing into RegExp creation */
const decodedSlurs = slurs.map(rot13);
const decodedSwears = swears.map(rot13);
const decodedLWord = theLWord.map(rot13);

/* Creates an array of profanity RegExps. See https://regex101.com for a detailed breakdown.
 *
 * ([^A-Z]|\s) matches any non-alphabet character or whitespace character
 * This is inserted between each character of the slur to prevent masking white spaces or punctuation.
 *
 * \b matches word boundaries
 * [^A-Z] matches any non-alphabet characters
 * (${word}) matches the modified word RegExp (see above comment)
 * s matches the character "s" literally
 *
 * The -i flag makes the RegExp case insensitive.
 *
 */
function createProfanityRegexps(words) {
  return words
    .map((word) =>
      word
        .split("")
        .join(String.raw`+([^A-Z]|\s)*`)
        .concat("+")
    )
    .map(
      (word) => new RegExp(String.raw`\b[^A-Z]*((${word})+s*)+[^A-Z]*\b`, "i")
    );
}

// Creating profanity RegExps.
const slurRegexps = createProfanityRegexps(decodedSlurs);
const swearRegexps = createProfanityRegexps(decodedSwears);
const lWordRegexps = decodedLWord.map(
  (word) => new RegExp(`\\b${word}(es|ed|ing|s)?\\b`, "gi")
);

// Leet speak mappings.
const leetMappings = {
  0: "o",
  1: "i",
  2: "z",
  3: "e",
  4: "a",
  5: "s",
  6: "g",
  7: "t",
  8: "b",
  9: "g",
};

// Server-side slur detection.
function textIncludesSlurs(text) {
  for (const num in leetMappings) {
    text = text.replace(num, leetMappings[num]);
  }
  for (const slurRegex of slurRegexps) {
    if (slurRegex.test(text)) {
      return true;
    }
  }
  return false;
}

// Client-side speech filtering.
function filterProfanitySegment(profanityType, segment, char, seed = "") {
  segment = filterLWord(segment);

  let profanityRegexps;
  // Getting profanity list.
  switch (profanityType) {
    case "decodedSlurs":
      profanityRegexps = slurRegexps;
      break;
    case "decodedSwears":
      profanityRegexps = swearRegexps;
      break;
    default:
      return segment;
  }

  // Substituting numbers with letters.
  let mappedSegment = segment;
  for (const num in leetMappings) {
    mappedSegment = mappedSegment.replaceAll(num, leetMappings[num]);
  }

  // Filtering profanity.
  for (const profanityRegex of profanityRegexps) {
    let regexRes = profanityRegex.exec(mappedSegment);
    while (regexRes) {
      // regexRes.index returns the index of the start of the match, not the capturing group.
      const index = regexRes.index + regexRes[0].indexOf(regexRes[1]);
      const length = regexRes[1].length;
      const replacement =
        profanityType !== "decodedSwears"
          ? char.repeat(length)
          : getSwearReplacement(seed + index);

      segment =
        segment.slice(0, index) + replacement + segment.slice(index + length);
      // Filtering mappedSegment, to ensure that segments match.
      mappedSegment =
        mappedSegment.slice(0, index) +
        replacement +
        mappedSegment.slice(index + length);
      regexRes = profanityRegex.exec(mappedSegment);
    }
  }
  return segment;
}

function conjugateCondemn(originalWord) {
  const lw = originalWord.toLowerCase();

  if (lw.endsWith("ing")) return "condemning";
  if (lw.endsWith("ed")) return "condemned";
  if (lw.endsWith("es") || lw.endsWith("s")) return "condemns";
  return "condemn";
}

function filterLWord(segment) {
  let mappedSegment = segment;
  for (const num in leetMappings)
    mappedSegment = mappedSegment.replaceAll(num, leetMappings[num]);

  const lWordRegexps = decodedLWord.map(
    (word) => new RegExp(`\\b(${word})(es|ed|ing|s)?\\b`, "gi")
  );

  for (const lWordRegex of lWordRegexps) {
    let regexRes;
    while ((regexRes = lWordRegex.exec(mappedSegment)) !== null) {
      const matchedWord = regexRes[0];
      const replacement = conjugateCondemn(matchedWord);

      const index = regexRes.index;
      const length = matchedWord.length;

      segment =
        segment.slice(0, index) +
        replacement +
        segment.slice(index + length);
      mappedSegment =
        mappedSegment.slice(0, index) +
        replacement +
        mappedSegment.slice(index + length);
    }
  }
  return segment;
}

export { filterProfanitySegment, textIncludesSlurs };
