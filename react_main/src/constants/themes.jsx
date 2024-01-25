import { createTheme } from "@mui/material";

export const mainTheme = createTheme({
  typography: {
    fontFamily: ["RobotoSlab"].join(","),
  },
  palette: {
    primary: {
      main: "#B80C09",
    },
    infoDarker: "#012e47",
  },
});

export const lightTheme = createTheme({
  ...mainTheme,
  palette: {
    mode: "light",
  },
});

export const darkTheme = createTheme({
  ...mainTheme,
  palette: {
    mode: "dark",
  },
});
