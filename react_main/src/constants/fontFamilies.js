export const FONT_FAMILY_STACKS = {
  default: {
    heading: "RobotoSlab, serif",
    body: "Roboto, sans-serif",
    primaryFont: "RobotoSlab, serif",
  },
  system: {
    heading:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    primaryFont:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  readable: {
    heading: "Tahoma, Verdana, Arial, sans-serif",
    body: "Tahoma, Verdana, Arial, sans-serif",
    primaryFont: "Tahoma, Verdana, Arial, sans-serif",
  },
};

export function resolveFontFamilySetting(setting) {
  return FONT_FAMILY_STACKS[setting] || FONT_FAMILY_STACKS.default;
}
