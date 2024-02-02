// "bad" because it's not cryptographically secure + not very random (but good enough for us)
export const badMathRandomWithSeed = (seed) => {
  const x = Math.sin(seed + 10000) * 10000;
  return x - Math.floor(x);
};
