/** Black/white text for the accessible name-color display mode. */
export function getAccessibleTextColor(theme) {
  return theme.palette.mode === "dark" ? "#ffffff" : "#000000";
}

export function resolveDisplayNameColor({
  accessibleNameColors,
  ignoreTextColor,
  rawNameColor,
  autoContrastColor,
  theme,
}) {
  if (accessibleNameColors) {
    return getAccessibleTextColor(theme);
  }
  if (ignoreTextColor || !rawNameColor) {
    return "";
  }
  return autoContrastColor(rawNameColor);
}

export function resolveDisplayTextColor({
  accessibleNameColors,
  ignoreTextColor,
  rawTextColor,
  autoContrastColor,
  theme,
}) {
  if (accessibleNameColors) {
    return getAccessibleTextColor(theme);
  }
  if (ignoreTextColor || !rawTextColor) {
    return null;
  }
  return autoContrastColor(rawTextColor);
}
