import React from "react";
import { createTheme } from "@mui/material";
import { Box } from "@mui/material";

import surprised from "images/emotes/surprised.webp";
import sad from "images/emotes/sad.webp";

const currentMonth = new Date().getMonth();
const isHalloween = currentMonth === 9;

const CustomExpandIcon = () => {
  return (
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
};

const commonPalette = {
  primary: {
    main: isHalloween ? "#FF8C00" : "#AC2222",
  },
  secondary: {
    main: isHalloween ? "#FF8C00" : "#D42A2A",
  },
  info: {
    main: "#DAA520",
  },
  text: {
    main: "#F1F1F1", // Text color remains the same
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
      expandIcon: <CustomExpandIcon />,
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

export const SITE_THEME = createTheme({
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
        ...commonPalette,
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
        ...commonPalette,
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

/* export const darkThemeHigherContrast = createTheme({
  ...darkTheme,
  palette: {
    ...darkTheme?.palette,
    mode: "dark",
    primary: {
      main: "#EA0F0B", // EA0F0B, F63F3C, F97876
    },
  },
}); */
