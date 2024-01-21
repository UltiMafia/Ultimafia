import { Redirect, Route, Switch, useLocation } from "react-router-dom";
import React, { Suspense } from "react";
import { Welcome } from "./pages/Welcome/Welcome";
import LoadingPage from "./pages/Loading";
import { useLoggedIn } from "./hooks/useLoggedIn";
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
    <Switch>
      <Route exact path="/">
        <Welcome />
      </Route>
      <Route>
        <Suspense fallback={<LoadingPage />}>
          <LazyMain />
        </Suspense>
      </Route>
    </Switch>
  );
};
