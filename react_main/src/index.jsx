import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "lib/firebaseConfig";

import { SITE_THEME } from "./constants/themes";
import { NewLoading } from "pages/Welcome/NewLoading";
import Main from "./Main";

initializeApp(firebaseConfig);

ReactDOM.render(
  <Router>
    <ThemeProvider theme={SITE_THEME} noSsr defaultMode="dark">
      <CssBaseline enableColorScheme />
      <Suspense fallback={<NewLoading />}>
        <Main />
      </Suspense>
    </ThemeProvider>
  </Router>,
  document.getElementById("root")
);
