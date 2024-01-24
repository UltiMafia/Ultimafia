import { createTheme } from "@mui/material";

export const mainTheme = createTheme({
  typography: {
    fontFamily: ["RobotoSlab"].join(","),
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
