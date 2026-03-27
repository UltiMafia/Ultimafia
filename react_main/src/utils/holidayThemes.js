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
