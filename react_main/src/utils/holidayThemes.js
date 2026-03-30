export function isValentinesThemeActive(date = new Date()) {
  return date.getMonth() === 1;
}

export function isPrideThemeActive(date = new Date()) {
  return date.getMonth() === 5;
}

export function isHalloweenThemeActive(date = new Date()) {
  return date.getMonth() === 9;
}

export function isWinterThemeActive(date = new Date()) {
  return date.getMonth() === 11;
}

/** March 30 (testing) and April 1: everyone is locked to Retro site theme. */
export function isRetroThemeForcedByCalendar(date = new Date()) {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 2 && day === 30) || (month === 3 && day === 1);
}
