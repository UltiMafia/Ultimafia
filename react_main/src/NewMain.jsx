import { Redirect, Route, Switch, useLocation } from "react-router-dom";
import React, { Suspense } from "react";
import { Welcome } from "./pages/Welcome/Welcome";
import { useLoggedIn } from "./hooks/useLoggedIn";
import { NewLoading } from "./pages/Welcome/NewLoading";
import { ThemeProvider } from "@mui/material";
import { darkTheme } from "./constants/themes";
// LazyMain is not very useful... but it was an attempt at increasing the Welcome page's loading time.
const LazyMain = React.lazy(() => import("./Main"));

export const NewMain = () => {
  const { loggedIn } = useLoggedIn();
  const location = useLocation();

  const isWelcomePage = location.pathname === "/";
  if (loggedIn && isWelcomePage) {
    return <Redirect to="/play" />;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Switch>
        <Route exact path="/">
          <Welcome />
        </Route>
        <Route>
          <Suspense fallback={<NewLoading />}>
            <LazyMain />
          </Suspense>
        </Route>
      </Switch>
    </ThemeProvider>
  );
};
