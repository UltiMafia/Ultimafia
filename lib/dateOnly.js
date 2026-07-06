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

module.exports = {
  ISO_DATE_ONLY_REGEX,
  isDateOnlyString,
  normalizeBirthday,
};
