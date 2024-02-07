import { hashStrToInt } from "./hashStrToInt";
import { badMathRandomWithSeed } from "./badMathRandomWithSeed";

export const badMathRandomWithStringSeed = (seed) =>
  badMathRandomWithSeed(hashStrToInt(seed));
