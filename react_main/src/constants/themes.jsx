import React from "react";
import { createTheme } from "@mui/material";
import { Box } from "@mui/material";
import surprised from "../public/images/emotes/surprised.webp";
import sad from "../public/images/emotes/sad.webp";

const CustomExpandIcon = () => {
  return (
    <Box
      sx={{
        '.Mui-expanded & > .collapsIconWrapper': {
          display: 'none',
        },
        '.expandIconWrapper': {
          display: 'none',
        },
        '.Mui-expanded & > .expandIconWrapper': {
          display: 'block',
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
  )
};

export const darkTheme = createTheme({
  components: {
    MuiAccordion: {
      defaultProps: {
        defaultExpanded: true,
        expandIcon: <CustomExpandIcon />,
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        expandIconWrapper: {
          transition: "none",
          "&.Mui-expanded": {
            transform: "none",
          },
        },
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
          color: "#D4A017",
          opacity: 0.8,
          '&:hover': {
            opacity: 1,
          },
        },
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
  },
  typography: {
    fontFamily: ["RobotoSlab"].join(","),
    color: "#F1F1F1",
  },
  palette: {
    mode: "dark",
    background: {
      default: "#111215",
    },
    primary: {
      main: "#AC2222", // old was C30C09; better dark contrast, but radioactive: #EA0F0B; I liked gold better D4A017
    },
    secondary: {
      main: "#D42A2A", // old was DAA520
    },
    info: {
      main: "#D4A017",
    },
    text: {
      main: "#F1F1F1"
    },
    // infoDarker: "#012e47",
  },
});

export const darkThemeHigherContrast = createTheme({
  ...darkTheme,
  palette: {
    ...darkTheme?.palette,
    mode: "dark",
    primary: {
      main: "#EA0F0B", // EA0F0B, F63F3C, F97876
    },
  },
});

export const dialogTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#F41410",
      // main: "#F98280", /* lighter version */
    },
  },
  typography: {
    fontFamily: ["RobotoSlab"].join(","),
  },
});
