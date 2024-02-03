import { createTheme } from "@mui/material";

export const mainTheme = createTheme({
  typography: {
    fontFamily: ["RobotoSlab"].join(","),
  },
});

export const darkTheme = createTheme({
  ...mainTheme,
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

export const lightTheme = createTheme({
  ...mainTheme,
  palette: {
    mode: "light",
    primary: {
      main: "#f86663",
    },
    // infoDarker: "#b9e6fe",
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
