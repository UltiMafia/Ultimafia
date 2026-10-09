const secureRandom = require("secure-random");

const maxNum = 2 ** (8 * 6) - 1;

module.exports = class Random {
  // Optional mulberry32. Unset (null) keeps the secure generator.
  static _rng = null;

  static seed(n) {
    if (n == null) {
      this._rng = null;
      return;
    }
    let state = n >>> 0;
    this._rng = function () {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  static randFloat() {
    if (this._rng) return this._rng();
    var num = secureRandom(6, { type: "Buffer" }).readUIntBE(0, 6);
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

    var i, temp;
    var m = arr.length - 1;

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
