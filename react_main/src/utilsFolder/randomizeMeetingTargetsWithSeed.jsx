import { badMathRandomWithStringSeed } from "../utilsFolder";

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
    const aOrder = a === "*" ? Infinity : idToOrder[a];
    const bOrder = b === "*" ? Infinity : idToOrder[b];
    return aOrder < bOrder ? -1 : aOrder === bOrder ? 0 : 1;
  });

  return sortedTargets;
};
