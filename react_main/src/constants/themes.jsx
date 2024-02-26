import { createTheme } from "@mui/material";

export const darkTheme = createTheme({
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
  typography: {
    fontFamily: ["RobotoSlab"].join(","),
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#C30C09", // better dark contrast, but radioactive: #EA0F0B
    },
    secondary: {
      main: "#DAA520",
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
