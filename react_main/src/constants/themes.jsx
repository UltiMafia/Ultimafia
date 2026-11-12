import React from "react";
import { createTheme } from "@mui/material";
import { resolveFontFamilySetting } from "./fontFamilies";
import UiIcon from "../components/ui/UiIcon";
import { uiTokens, uiCssVariables } from "../components/ui/designTokens";
import "../components/ui/fonts.css";

const CUSTOM_EXPAND_ICON = <UiIcon name="down" size={20} />;
const SelectIcon = React.forwardRef(function SelectIcon(props, ref) {
  return <UiIcon {...props} ref={ref} name="down" size={20} />;
});

export function getSiteTheme(
  customPrimaryColor,
  sitePalette = "dark",
  fontFamilySetting = "default"
) {
  const fonts = resolveFontFamilySetting(fontFamilySetting);

  // Explicit user colors are retained; the default UI keeps the brand palette.
  const getPrimaryColor = (mode) => {
    if (customPrimaryColor) {
      return customPrimaryColor;
    }
    return uiTokens.palettes[mode].red;
  };

  const getSecondaryColor = (mode) => {
    if (customPrimaryColor) {
      return customPrimaryColor;
    }
    return uiTokens.palettes[mode].yellow;
  };

  const lightPalette = {
    background: { default: uiTokens.palettes.light.background, paper: uiTokens.palettes.light.surface },
    divider: uiTokens.palettes.light.border,
    primary: {
      main: getPrimaryColor("light"),
      contrastText: customPrimaryColor ? undefined : uiTokens.palettes.light.onRed,
    },
    secondary: {
      main: getSecondaryColor("light"),
      contrastText: customPrimaryColor ? undefined : uiTokens.palettes.light.onYellow,
    },
    info: {
      main: uiTokens.palettes.light.yellow,
    },
    text: {
      primary: uiTokens.palettes.light.text, secondary: uiTokens.palettes.light.muted,
    },
    error: { main: uiTokens.palettes.light.error },
  };

  const darkPalette = {
    background: { default: uiTokens.palettes.dark.background, paper: uiTokens.palettes.dark.surface },
    divider: uiTokens.palettes.dark.border,
    primary: {
      main: getPrimaryColor("dark"),
      contrastText: customPrimaryColor ? undefined : uiTokens.palettes.dark.onRed,
    },
    secondary: {
      main: getSecondaryColor("dark"),
      contrastText: customPrimaryColor ? undefined : uiTokens.palettes.dark.onYellow,
    },
    info: {
      main: uiTokens.palettes.dark.yellow,
    },
    text: {
      primary: uiTokens.palettes.dark.text, secondary: uiTokens.palettes.dark.muted,
    },
    error: { main: uiTokens.palettes.dark.error },
  };

  const commonComponents = {
    MuiCssBaseline: { styleOverrides: { ":root": uiCssVariables(fonts.body), body: { fontFamily: fonts.body, fontSize: uiTokens.type.body, lineHeight: uiTokens.lineHeight.body }, "button, input, textarea, select": { fontFamily: "inherit" } } },
    MuiSelect: { defaultProps: { IconComponent: SelectIcon } },
    MuiAccordion: {
      defaultProps: {
        defaultExpanded: true, disableGutters: true,
      },
      styleOverrides: {
        root: {
          backgroundColor: "var(--scheme-color-background)",
          backgroundImage: "none", boxShadow: "none", border: "1px solid var(--mui-palette-divider)",
          "&:before": { display: "none" },
        },
      },
    },
    MuiAccordionSummary: {
      defaultProps: {
        expandIcon: CUSTOM_EXPAND_ICON,
      },
      styleOverrides: {
        expandIconWrapper: {
          transition: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: "outlined",
        color: "primary",
        sx: { textTransform: "none" },
      },
      styleOverrides: {
        root: { textTransform: "none", fontSize: uiTokens.type.body, fontWeight: uiTokens.weight.strong, lineHeight: uiTokens.lineHeight.action, borderRadius: uiTokens.control.radius, minHeight: uiTokens.control.height, boxShadow: "none", "&:hover": { boxShadow: "none" }, "@media (pointer: coarse)": { minHeight: uiTokens.control.touchHeight } },
        containedPrimary: { boxShadow: "var(--ui-primary-shadow)", transition: "background-color 120ms", "&:hover": { boxShadow: "var(--ui-primary-shadow)" }, "&:active": { transform: "translateY(var(--ui-primary-pressed-offset))", boxShadow: "var(--ui-primary-pressed-shadow)" }, "&.Mui-disabled": { boxShadow: "none", transform: "none" } },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none", boxShadow: "none" } } },
    MuiCard: { styleOverrides: { root: { border: "1px solid var(--mui-palette-divider)" } } },
    MuiDialog: { styleOverrides: { paper: { border: "1px solid var(--mui-palette-divider)", borderRadius: 8 }, container: { height: "calc(100% - var(--app-top, 0px) - var(--app-bottom, 0px))", marginTop: "var(--app-top, 0px)" } } },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: uiTokens.type.heading, fontWeight: uiTokens.weight.strong, lineHeight: uiTokens.lineHeight.heading, padding: "8px 20px" } } },
    MuiDialogActions: { styleOverrides: { root: { padding: "16px 24px", gap: 8, flexWrap: "wrap" } } },
    MuiMenu: { styleOverrides: { paper: { marginTop: 6, border: "1px solid var(--mui-palette-divider)", boxShadow: "0 12px 40px #0005" } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 5 } } },
    MuiTableCell: { styleOverrides: { root: { padding: "14px 16px", borderColor: "var(--mui-palette-divider)", lineHeight: 1.6 }, head: { fontWeight: 700, background: "var(--scheme-color-sec)" } } },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          "&:focus-visible": {
            outline: "2px solid var(--mui-palette-primary-main)",
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          opacity: 1,
          textUnderlineOffset: "3px",
          "&:hover": {
            textDecoration: "underline",
          },
        },
      },
    },
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
    MuiTable: {
      defaultProps: { size: "small" },
    },
    MuiTabs: {
      defaultProps: {
        variant: "scrollable",
        scrollButtons: "auto",
        allowScrollButtonsMobile: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none", fontSize: uiTokens.type.small, fontWeight: uiTokens.weight.strong, minHeight: uiTokens.control.height,
          // Phones need the touch height, not the desktop control height. Game
          // meeting tabs keep their own denser override.
          [theme.breakpoints.down("sm")]: { minHeight: uiTokens.control.touchHeight },
          "&:focus-visible": {
            outline: "2px solid var(--mui-palette-primary-main)",
            outlineOffset: "2px",
          },
        }),
      },
    },
  };


  return createTheme({
    components: commonComponents,
    shape: { borderRadius: 6 },
    colorSchemes: {
      light: {
        palette: {
          ...lightPalette,
          activeAppBarText: {
            main: "var(--scheme-color-sec)",
          },
        },
      },
      dark: {
        palette: {
          ...darkPalette,
          activeAppBarText: {
            main: "var(--mui-palette-primary-main)",
          },
        },
      },
    },
    cssVariables: {
      colorSchemeSelector: "data",
    },
    typography: {
      fontFamily: fonts.body,
      h1: {
        fontFamily: fontFamilySetting === "default" ? fonts.body : fonts.heading,
        fontSize: uiTokens.type.title,
        fontWeight: "bold",
      },
      h2: {
        fontFamily: fontFamilySetting === "default" ? fonts.body : fonts.heading,
        fontSize: uiTokens.type.heading,
        fontWeight: "bold",
      },
      h3: {
        fontFamily: fontFamilySetting === "default" ? fonts.body : fonts.heading,
        fontSize: uiTokens.type.section,
        fontWeight: "bold",
      },
      h4: {
        fontFamily: fontFamilySetting === "default" ? fonts.body : fonts.heading,
        fontSize: uiTokens.type.body,
        fontWeight: "bold",
      },
      h5: {
        fontFamily: fontFamilySetting === "default" ? fonts.body : fonts.heading,
        fontSize: uiTokens.type.body,
        fontWeight: "bold",
      },
      h6: {
        fontFamily: fontFamilySetting === "default" ? fonts.body : fonts.heading,
        fontSize: uiTokens.type.body,
        fontWeight: "bold",
      },
      body1: { fontFamily: fonts.body, fontSize: uiTokens.type.body, lineHeight: uiTokens.lineHeight.body },
      body2: { fontFamily: fonts.body, fontSize: uiTokens.type.small, lineHeight: uiTokens.lineHeight.body },
      subtitle1: { fontFamily: fonts.body },
      subtitle2: { fontFamily: fonts.body },
      caption: { fontFamily: fonts.body, fontSize: uiTokens.type.caption },
      button: { fontFamily: fonts.body, fontSize: uiTokens.type.body, fontWeight: uiTokens.weight.strong },
      overline: { fontFamily: fonts.body },
      italicRelation: {
        // "Created by", "Authored by", "In love with", etc.
        fontFamily: fonts.heading,
        fontSize: "1em",
        fontStyle: "italic",
      },
    },
  });
}
