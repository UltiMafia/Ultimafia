import { Route, Switch } from "react-router-dom";
import React, { Suspense } from "react";
import { Welcome } from "./pages/Welcome/Welcome";
// LazyMain is not very useful... but it was an attempt at increasing the Welcome page's loading time.
const LazyMain = React.lazy(() => import("./Main"));

export const NewMain = () => {
  return (
    <Switch>
      <Route exact path="/">
        <Welcome />
      </Route>
      <Route>
        <Suspense
          fallback={
            "Loading... (damn, can you really see this? either your internet is slow or the server is dead)"
          }
        >
          <LazyMain />
        </Suspense>
      </Route>
    </Switch>
  );
};
