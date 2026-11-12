// One source for application typography, action geometry and default palettes.
// User-selected colors and fonts are still resolved by getSiteTheme.
export const uiTokens = {
  iconSet: "hackernoon-solid",
  fontFamily: '"Fira Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  type: { caption: ".75rem", small: ".875rem", body: "1rem", section: "1.125rem", heading: "1.25rem", title: "1.5rem" },
  weight: { normal: 400, medium: 500, strong: 600, heading: 700 },
  lineHeight: { body: 1.5, heading: 1.3, action: 1.25 },
  control: { height: 40, touchHeight: 44, radius: 8, raisedEdge: 3, pressedOffset: 2 },
  layout: { pageWidth: 1180, readingWidth: 820, proseWidth: "80ch", sectionGap: 24, columnGap: 32, panelPadding: 16 },
  palettes: {
    light: {
      background: "#f5f3ef", surface: "#fffdfa", border: "#d7d1c9",
      text: "#29252a", muted: "#655e65", red: "#ac293d", yellow: "#856000",
      onRed: "#ffffff", onYellow: "#ffffff", error: "#b42339",
    },
    dark: {
      background: "#191719", surface: "#242124", border: "#423a3e",
      text: "#f4eef0", muted: "#bcb0b6", red: "#ed7c87", yellow: "#e5bd58",
      onRed: "#271114", onYellow: "#241d0b", error: "#f08a94",
    },
  },
};

export function uiCssVariables(fontFamily = uiTokens.fontFamily) {
  return {
    "--ui-font-body": fontFamily,
    "--primaryFont": fontFamily,
    "--ui-text-caption": uiTokens.type.caption,
    "--ui-text-small": uiTokens.type.small,
    "--ui-text-body": uiTokens.type.body,
    "--ui-text-section": uiTokens.type.section,
    "--ui-text-heading": uiTokens.type.heading,
    "--ui-text-title": uiTokens.type.title,
    "--ui-line-body": uiTokens.lineHeight.body,
    "--ui-line-heading": uiTokens.lineHeight.heading,
    "--ui-weight-strong": uiTokens.weight.strong,
    "--ui-action-height": `${uiTokens.control.height}px`,
    "--ui-touch-height": `${uiTokens.control.touchHeight}px`,
    "--ui-radius": `${uiTokens.control.radius}px`,
    "--ui-page-width": `${uiTokens.layout.pageWidth}px`,
    "--ui-reading-width": `${uiTokens.layout.readingWidth}px`,
    "--ui-prose-width": uiTokens.layout.proseWidth,
    "--ui-section-gap": `${uiTokens.layout.sectionGap}px`,
    "--ui-panel-padding": `${uiTokens.layout.panelPadding}px`,
    "--ui-column-gap": `${uiTokens.layout.columnGap}px`,
    "--ui-primary-edge-color": "color-mix(in srgb, var(--mui-palette-primary-main) 65%, black)",
    "--ui-primary-shadow": `0 ${uiTokens.control.raisedEdge}px 0 var(--ui-primary-edge-color)`,
    "--ui-primary-pressed-shadow": `0 ${uiTokens.control.raisedEdge - uiTokens.control.pressedOffset}px 0 var(--ui-primary-edge-color)`,
    "--ui-primary-pressed-offset": `${uiTokens.control.pressedOffset}px`,
    "--ui-danger-text": "var(--mui-palette-error-main)",
    "--ui-danger-solid": "var(--mui-palette-error-main)",
    "--ui-selection": "var(--mui-palette-secondary-main)",
    "--ui-selection-background": "color-mix(in srgb, var(--ui-selection) 14%, transparent)",
  };
}
