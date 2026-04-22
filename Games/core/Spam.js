module.exports = class Spam {
  static prunePast(past, now = Date.now()) {
    for (let i = past.length - 1; i >= 0; i--) {
      if ((now - past[i]) / 1000 > 20) {
        past.splice(i, 1);
      }
    }
  }

  static getRateInfo(past, now = Date.now()) {
    this.prunePast(past, now);

    let sum = 0;
    for (let i in past) {
      sum += 1 / ((now - past[i] + 1) / 1000);
    }

    return {
      sum,
      count: past.length,
    };
  }

  static rateLimit(past, sumLimit, rateLimit) {
    const { sum, count } = this.getRateInfo(past);

    return sum > sumLimit || count > rateLimit;
  }

  static getCooldownMs(past, sumLimit, rateLimit) {
    const now = Date.now();
    this.prunePast(past, now);

    const stepMs = 50;
    const maxCooldownMs = 20000;

    for (let cooldownMs = 0; cooldownMs <= maxCooldownMs; cooldownMs += stepMs) {
      const checkTime = now + cooldownMs;
      let sum = 0;
      let count = 0;

      for (let i in past) {
        const elapsed = checkTime - past[i];
        if (elapsed <= maxCooldownMs) {
          count += 1;
          sum += 1 / ((elapsed + 1) / 1000);
        }
      }

      if (sum <= sumLimit && count <= rateLimit) {
        return cooldownMs;
      }
    }

    return maxCooldownMs;
  }
};
