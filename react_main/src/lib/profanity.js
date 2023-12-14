import { slurs } from "../constants/slurs";
import { getSwearReplacement, swears } from "../constants/swears";

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
const slurRegexps = createProfanityRegexps(slurs);
const swearRegexps = createProfanityRegexps(swears);

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
  let profanityRegexps;
  // Getting profanity list.
  switch (profanityType) {
    case "slurs":
      profanityRegexps = slurRegexps;
      break;
      default:
        return segment;
    case "swears":
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
        profanityType !== "swears"
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

export { filterProfanitySegment, textIncludesSlurs };
