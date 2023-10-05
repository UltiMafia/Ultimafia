import { badMathRandomWithStringSeed } from "../utils";

export const lynchFilter = [
  "lynch",
];

// Replacement
const condemnFilter = [
  "condemn",
];

const lynchReplacementArr = Array.from(
  new Set([...condemnFilter])
);

export const getLynchReplacement = (seed) =>
  lynchReplacementArr[
    Math.floor(badMathRandomWithStringSeed(seed) * lynchReplacementArr.length)
  ];
