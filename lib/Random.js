const secureRandom = require("secure-random");

const maxNum = 2 ** (8 * 6) - 1;

module.exports = class Random {
  static randFloat() {
    const num = secureRandom(6, { type: "Buffer" }).readUIntBE(0, 6);
    return num / maxNum;
  }

  static randFloatRange(min, max) {
    return this.randFloat() * (max - min) + min;
  }

  static randInt(min, max) {
    return Math.floor(this.randFloat() * (max - min + 1) + min);
  }

  static randArrayVal(arr, splice) {
    if (arr.length == 0) return;

    const index = this.randInt(0, arr.length - 1);
    const res = arr[index];

    if (splice) arr.splice(index, 1);

    return res;
  }

  static randomizeArray(arr) {
    arr = arr.slice();

    let i;
    let temp;
    let m = arr.length - 1;

    while (m > 0) {
      i = Math.floor(this.randFloat() * (m + 1));
      temp = arr[m];
      arr[m] = arr[i];
      arr[i] = temp;
      m--;
    }

    return arr;
  }
};
