import React, { useContext } from "react";
import { SiteInfoContext } from "../Contexts";
import { Alert, Portal, Stack } from "@mui/material";

export function AlertList() {
  const siteInfo = useContext(SiteInfoContext);

  const alerts = siteInfo.alerts.map((alert, i) => {
    return (
      <Alert
        onClose={() => siteInfo.hideAlert(i)}
        id={`alert-id-${alert.id}`}
        severity={alert.type}
        key={alert.id}
        sx={{
          opacity: "100%",
          "-webkit-transition": "opacity 500ms linear",
          transition: "opacity 500ms linear",
        }}
      >
        {alert.text}
      </Alert>
    );
  });

  return (
    <Portal>
      {/* This is akin to a MUI snackbar but with verically stacking toasts.
        * For proper integration with MUI dialogs, their snackbar zIndex var is used.
        */}
      <Stack direction="row" sx={{
        width: "100%",
        justifyContent: "center",
        position: "fixed",
        top: "var(--mui-spacing)",
        left: "0px",
        zIndex: "var(--mui-zIndex-snackbar)",
        pointerEvents: "none",
      }}>
        <Stack direction="column" spacing={1} sx={{
          pointerEvents: "auto",
        }}>
          {alerts}
        </Stack>
      </Stack>
    </Portal>
  );
}

export function useErrorAlert() {
  const siteInfo = useContext(SiteInfoContext);

  return (e) => {
    var message;

    if (e && e.response) message = e.response.data;
    else if (e && e.message) message = e.message;
    else if (typeof e == "string") message = e;
    else message = "Error loading data";

    if (message.length > 200) message = "Connection error";

    siteInfo.showAlert(message, "error");
  };
}
