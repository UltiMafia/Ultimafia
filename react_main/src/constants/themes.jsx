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
      main: "#B80C09",
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
