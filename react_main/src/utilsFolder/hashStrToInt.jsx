export const hashStrToInt = (str) => {
  const MAX_VAL = 666013;

  const letters = str.split("");
  const lettersCharCodes = letters.map((letter) => letter.charCodeAt(0));
  const base = lettersCharCodes.reduce(
    (acc, val) => Math.max(acc, val),
    -Infinity
  );
  const lettersToVal = lettersCharCodes.map(
    (letterCode, index) => (Math.pow(base, index) * letterCode) % MAX_VAL
  );
  const result = lettersToVal.reduce((acc, val) => (acc + val) % MAX_VAL, 0);

  return result;
};
