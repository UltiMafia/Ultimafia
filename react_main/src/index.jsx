import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider, CssBaseline, GlobalStyles } from "@mui/material";

import { SITE_THEME } from "./constants/themes";
import { NewLoading } from "pages/Welcome/NewLoading";

const LazyMain = lazy(() => import("./Main.jsx"));

ReactDOM.render(
  <Router>
    <ThemeProvider theme={SITE_THEME} noSsr>
      <CssBaseline enableColorScheme />
      <Suspense fallback={<NewLoading />}>
        <LazyMain />
      </Suspense>
    </ThemeProvider>
  </Router>,
  document.getElementById("root")
);
