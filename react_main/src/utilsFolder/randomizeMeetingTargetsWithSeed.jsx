import { badMathRandomWithStringSeed } from "../utilsFolder";

// Should be bigger than the number seen in hashStrToInt
const BIG_NUMBER = 1000000;

export const randomizeMeetingTargetsWithSeed = ({
  targets,
  playerIds,
  seed,
}) => {
  const idToOrder = playerIds.reduce(
    (acc, val, index) => ({
      ...acc,
      [val]: badMathRandomWithStringSeed(seed + index),
    }),
    {}
  );
  const sortedTargets = targets.sort((a, b) => {
    const aOrder =
      a === "*" ? BIG_NUMBER : a === "*magus" ? BIG_NUMBER + 1 : idToOrder[a];
    const bOrder =
      b === "*" ? BIG_NUMBER : b === "*magus" ? BIG_NUMBER + 1 : idToOrder[b];
    return aOrder < bOrder ? -1 : aOrder === bOrder ? 0 : 1;
  });

  return sortedTargets;
};
