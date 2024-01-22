import { createTheme } from "@mui/material";

export const welcomeTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#B80C09",
    },
  },
  typography: {
    fontFamily: ["RobotoSlab"].join(","),
  },
});
