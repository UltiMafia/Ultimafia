module.exports = class Spam {
  /** speechPast entries may be a timestamp number or { at, content }. */
  static entryTime(entry) {
    if (entry == null) return 0;
    if (typeof entry === "number") return entry;
    return entry.at || 0;
  }

  static entryContent(entry) {
    if (entry == null || typeof entry === "number") return null;
    return entry.content != null ? entry.content : null;
  }

  static prunePast(past, now = Date.now()) {
    for (let i = past.length - 1; i >= 0; i--) {
      if ((now - this.entryTime(past[i])) / 1000 > 20) {
        past.splice(i, 1);
      }
    }
  }

  static getRateInfo(past, now = Date.now()) {
    this.prunePast(past, now);

    let sum = 0;
    for (let i in past) {
      sum += 1 / ((now - this.entryTime(past[i]) + 1) / 1000);
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
        const elapsed = checkTime - this.entryTime(past[i]);
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

  static getFixedCooldownRemainingMs(past, cooldownMs, now = Date.now()) {
    if (!cooldownMs || past.length === 0) return 0;

    const elapsed = now - this.entryTime(past[past.length - 1]);
    return Math.max(0, cooldownMs - elapsed);
  }

  static isFixedCooldownActive(past, cooldownMs, now = Date.now()) {
    return this.getFixedCooldownRemainingMs(past, cooldownMs, now) > 0;
  }

  static getMessageCharCountExcludingWhitespace(content) {
    let count = 0;

    for (let i = 0; i < content.length; i++) {
      if (!/\s/.test(content[i])) {
        count += 1;
      }
    }

    return count;
  }

  /** Normalize for duplicate detection (trim + collapse whitespace). */
  static normalizeSpeakContent(content) {
    return String(content || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  /**
   * How many trailing speechPast entries match this content (consecutive).
   * Uses entries still inside the prune window.
   */
  static getConsecutiveDuplicateCount(past, content, now = Date.now()) {
    this.prunePast(past, now);
    const norm = this.normalizeSpeakContent(content);
    if (!norm) return 0;

    let count = 0;
    for (let i = past.length - 1; i >= 0; i--) {
      const prev = this.entryContent(past[i]);
      if (prev == null) break;
      if (prev === norm) count += 1;
      else break;
    }
    return count;
  }

  /**
   * Block when the same content was already sent maxConsecutive times in a row.
   * maxConsecutive = 2 → first and second OK, third blocked.
   */
  static isRepeatedContentSpam(
    past,
    content,
    maxConsecutive = 2,
    now = Date.now()
  ) {
    return (
      this.getConsecutiveDuplicateCount(past, content, now) >= maxConsecutive
    );
  }

  /**
   * Minimum time after the previous send before this content is allowed under
   * the ranked/competitive typing gate.
   *
   * pasteGraceChars: non-ws chars that do not require typing time (prep/paste).
   * maxIntervalMs: hard cap so a long line never demands 10–20s after a short one.
   */
  static getRankedCompetitiveMinIntervalMs(
    content,
    wpm,
    avgWordLength,
    options = {}
  ) {
    const messageLen = this.getMessageCharCountExcludingWhitespace(content);
    if (messageLen === 0 || !wpm || !avgWordLength) return 0;

    const pasteGrace =
      options.pasteGraceChars != null ? options.pasteGraceChars : 0;
    const maxIntervalMs =
      options.maxIntervalMs != null ? options.maxIntervalMs : Infinity;

    // Only bill chars beyond the paste/prep grace toward the WPM clock.
    const billableLen = Math.max(0, messageLen - pasteGrace);
    if (billableLen === 0) return 0;

    const rawMs = (billableLen / avgWordLength / wpm) * 60 * 1000;
    return Math.min(rawMs, maxIntervalMs);
  }

  static getTypingSpeedCooldownRemainingMs(
    past,
    content,
    wpm,
    avgWordLength,
    now = Date.now(),
    options = {}
  ) {
    if (past.length === 0) return 0;

    const minIntervalMs = this.getRankedCompetitiveMinIntervalMs(
      content,
      wpm,
      avgWordLength,
      options
    );
    if (minIntervalMs <= 0) return 0;

    const elapsed = now - this.entryTime(past[past.length - 1]);
    return Math.max(0, minIntervalMs - elapsed);
  }

  static isTypingSpeedViolation(
    past,
    content,
    wpm,
    avgWordLength,
    now = Date.now(),
    options = {}
  ) {
    return (
      this.getTypingSpeedCooldownRemainingMs(
        past,
        content,
        wpm,
        avgWordLength,
        now,
        options
      ) > 0
    );
  }
};
