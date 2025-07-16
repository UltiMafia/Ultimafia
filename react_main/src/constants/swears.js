import { badMathRandomWithStringSeed } from "../utilsFolder";

export const swears = [
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bitches",
  "cock",
  "crap",
  "cretin",
  "cum",
  "cunt",
  "dick",
  "dickhead",
  "dildo",
  "dumbass",
  "fuck",
  "fucked",
  "fucking",
  "goon",
  "jackass",
  "jizz",
  "motherfuck",
  "motherfucked",
  "motherfucker",
  "motherfucking",
  "pussy",
  "shit",
  "slut",
  "tits",
  "twat",
  "wanker",
  "whore",
];

// Replacements

const fruitsAndVegetables = [
  "🍇",
  "🍈",
  "🍉",
  "🍊",
  "🍋",
  "🍌",
  "🍍",
  "🥭",
  "🍎",
  "🍏",
  "🍐",
  "🍑",
  "🍒",
  "🍓",
  "🫐",
  "🥝",
  "🍅",
  "🫒",
  "🥥",
  "🥑",
  "🍆",
  "🥔",
  "🥕",
  "🌽",
  "🌶️",
  "🫑",
  "🥒",
  "🥬",
  "🥦",
  "🧄",
  "🧅",
  "🥜",
  "🫘",
  "🌰",
  "🫚",
  "🫛",
  ":boar:",
];

const swearReplacementArr = Array.from(new Set([...fruitsAndVegetables]));

export const getSwearReplacement = (seed) =>
  swearReplacementArr[
    Math.floor(badMathRandomWithStringSeed(seed) * swearReplacementArr.length)
  ];
