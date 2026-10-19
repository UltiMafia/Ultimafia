const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnlyString(value) {
  return typeof value === "string" && ISO_DATE_ONLY_REGEX.test(value);
}

function normalizeBirthday(value) {
  if (value == null || value === "" || value === 0 || value === "0") {
    return undefined;
  }

  if (isDateOnlyString(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return undefined;
  }

  // Legacy birthdays were stored as UTC midnight for the picked calendar day.
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Whether `birthday` (YYYY-MM-DD) falls on the calendar day of `when`.
 *
 * Timezone: the check uses the UTC calendar date. Birthdays are stored as
 * date-only strings with no timezone, and the server cannot know each viewer's
 * zone, so UTC gives one consistent answer for every viewer and every server.
 * A Feb 29 birthday is celebrated on Feb 28 in non-leap years.
 *
 * Only this boolean is shared with other users; the date itself never leaves
 * the server except to its owner.
 */
function isBirthdayOn(birthday, when = new Date()) {
  const normalized = normalizeBirthday(birthday);
  if (!normalized) return false;
  const [, month, day] = normalized.split("-").map(Number);
  const y = when.getUTCFullYear();
  const m = when.getUTCMonth() + 1;
  const d = when.getUTCDate();
  if (m === month && d === day) return true;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return !leap && month === 2 && day === 29 && m === 2 && d === 28;
}

module.exports = {
  isBirthdayOn,
  ISO_DATE_ONLY_REGEX,
  isDateOnlyString,
  normalizeBirthday,
};
