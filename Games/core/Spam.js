module.exports = class Spam {
  static rateLimit(past, sumLimit, rateLimit) {
    let sum = 0;
    const now = Date.now();

    for (const i in past) {
      if ((now - past[i]) / 1000 > 20) past.splice(i, 1);
      else sum += 1 / ((now - past[i] + 1) / 1000);
    }

    return sum > sumLimit || past.length > rateLimit;
  }
};
