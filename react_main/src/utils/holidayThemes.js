export const ENABLE_RETRO_APRIL_FOOLS_TEST_DATE = true;

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

export function isRetroAprilFoolsActive(date = new Date()) {
  const month = date.getMonth();
  const day = date.getDate();

  // April 1 (production date)
  const isAprilFools = month === 3 && day === 1;
  // March 27 (temporary testing date)
  const isTestingDate = ENABLE_RETRO_APRIL_FOOLS_TEST_DATE && month === 2 && day === 27;

  return isAprilFools || isTestingDate;
}
