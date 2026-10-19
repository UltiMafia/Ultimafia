import React, { useRef } from "react";
import { Routes, useLocation } from "react-router-dom";
import { ViewActivityContext } from "../hooks/useViewActivity";

// Only route matching is retained. Use React Router's public location prop;
// never inject an internal router context into the application shell. Nested
// routes receive the URL of the view they render; chrome and lifecycle code
// remain attached to the actual browser location.
export default function RetainedSiteRoutes({ active, children }) {
  const location = useLocation();
  const previous = useRef(null);
  if (active) previous.current = location;
  if (!previous.current) return null;

  return (
    <ViewActivityContext.Provider value={active}>
      <Routes location={previous.current}>{children}</Routes>
    </ViewActivityContext.Provider>
  );
}
