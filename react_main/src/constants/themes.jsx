import React from "react";
import { createTheme } from "@mui/material";
import { Box } from "@mui/material";

import surprised from "images/emotes/surprised.webp";
import sad from "images/emotes/sad.webp";

const CUSTOM_EXPAND_ICON = (
  <Box
    sx={{
      ".Mui-expanded & > .collapsIconWrapper": {
        display: "none",
      },
      ".expandIconWrapper": {
        display: "none",
      },
      ".Mui-expanded & > .expandIconWrapper": {
        display: "block",
      },
    }}
  >
    <div className="expandIconWrapper">
      <img src={surprised} />
    </div>
    <div className="collapsIconWrapper">
      <img src={sad} />
    </div>
  </Box>
);

export function getSiteTheme(customPrimaryColor) {
  const currentMonth = new Date().getMonth();
  const isValentines = currentMonth === 1;
  const isHalloween = currentMonth === 9;

  // Determine primary color based on custom color, Halloween, or default
  const getPrimaryColor = (mode) => {
    if (customPrimaryColor) {
      return customPrimaryColor;
    }
    if (isHalloween) {
      return "#FF8C00";
    }
    else if (isValentines) {
      return "#fc007e";
    }
    // Different colors for light and dark modes
    else return mode === "light" ? "#D50032" : "#EFBF04";
  };

  const getSecondaryColor = (mode) => {
    if (customPrimaryColor) {
      return customPrimaryColor;
    }
    if (isHalloween) {
      return "#FF8C00";
    }
    else if (isValentines) {
      return "#fc007e";
    }
    // Different colors for light and dark modes that complement the primary
    return mode === "light" ? "#B80028" : "#D4A704";
  };

  const lightPalette = {
    primary: {
      main: getPrimaryColor("light"),
    },
    secondary: {
      main: getSecondaryColor("light"),
    },
    info: {
      main: "#DAA520",
    },
    text: {
      main: "#F1F1F1",
    },
  };

  const darkPalette = {
    primary: {
      main: getPrimaryColor("dark"),
    },
    secondary: {
      main: getSecondaryColor("dark"),
    },
    info: {
      main: "#DAA520",
    },
    text: {
      main: "#F1F1F1",
    },
  };

  const commonComponents = {
    MuiAccordion: {
      defaultProps: {
        defaultExpanded: true,
      },
      styleOverrides: {
        root: {
          backgroundColor: "var(--scheme-color-background)",
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
          "&.Mui-expanded": {
            transform: "none",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: "contained",
        color: "primary",
        sx: { textTransform: "none" },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          opacity: 0.8,
          "&:hover": {
            opacity: 1,
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
      minWidth: 650,
      size: "small",
    },
    MuiTableCell: {
      align: "center",
      fontWeight: "bold",
    },
  };

  return createTheme({
    colorSchemes: {
      light: {
        components: {
          ...commonComponents,
          MuiPaper: {
            styleOverrides: {
              root: {
                variants: [
                  {
                    props: { variant: "outlined" },
                    style: {
                      backgroundColor: "var(--scheme-color-sec)",
                    },
                  },
                ],
              },
            },
          },
        },
        palette: {
          ...lightPalette,
          activeAppBarText: {
            main: "var(--scheme-color-sec)",
          },
        },
      },
      dark: {
        components: {
          ...commonComponents,
        },
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
      h1: { fontFamily: "RobotoSlab", fontSize: "2.00em", fontWeight: "bold" },
      h2: { fontFamily: "RobotoSlab", fontSize: "1.50em", fontWeight: "bold" },
      h3: { fontFamily: "RobotoSlab", fontSize: "1.17em", fontWeight: "bold" },
      h4: { fontFamily: "RobotoSlab", fontSize: "1.00em", fontWeight: "bold" },
      h5: { fontFamily: "RobotoSlab", fontSize: "0.83em", fontWeight: "bold" },
      h6: { fontFamily: "RobotoSlab", fontSize: "0.67em", fontWeight: "bold" },
      body1: { fontFamily: "Roboto" },
      body2: { fontFamily: "Roboto" },
      subtitle1: { fontFamily: "Roboto" },
      subtitle2: { fontFamily: "Roboto" },
      caption: { fontFamily: "Roboto" },
      button: { fontFamily: "Roboto" },
      overline: { fontFamily: "Roboto" },
      italicRelation: {
        // "Created by", "Authored by", "In love with", etc.
        fontFamily: "RobotoSlab",
        fontSize: "1em",
        fontStyle: "italic",
      },
    },
  });
}
