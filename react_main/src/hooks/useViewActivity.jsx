import React, { createContext, useCallback, useContext, useLayoutEffect, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

export const ViewActivityContext = createContext(true);
export const AppLocationContext = createContext(null);

export function useViewActive() {
  return useContext(ViewActivityContext);
}

// Route rendering may use a saved view location; lifecycle decisions always
// use the real browser location supplied above those route boundaries.
export function useAppLocation() {
  const routeLocation = useLocation();
  return useContext(AppLocationContext) || routeLocation;
}

// Inactive route views may finish requests, but must not navigate the active
// application. A declarative redirect is naturally deferred until reactivation.
export function ViewNavigate(props) {
  const active = useViewActive();
  return active ? <Navigate {...props} /> : null;
}

export function useViewNavigate() {
  const navigate = useNavigate();
  const active = useViewActive();
  const activeRef = useRef(active);
  activeRef.current = active;
  useLayoutEffect(() => {
    activeRef.current = active;
    return () => { activeRef.current = false; };
  }, [active]);
  return useCallback((...args) => {
    if (activeRef.current) navigate(...args);
  }, [navigate]);
}
