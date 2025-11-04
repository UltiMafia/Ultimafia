import React, { useState } from "react";
import { Alert, Snackbar } from "@mui/material";

export const useSnackbar = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const popSnackbar = (message, severity) => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  };
  const popUnexpectedError = () => {
    popSnackbar(
      "An unexpected error has occurred, please try again. If the error persists, contact a site administrator.",
      "error"
    );
  };
  const popTooManyLoginAttempts = () => {
    popSnackbar(
      "Too many login attempts on this account. Please try again later.",
      "warning"
    );
  };
  const popLoginFailed = () => {
    popSnackbar(
      "Failed to login. Please check your account's details. (email/password)",
      "warning"
    );
  };
  const popSiteBanned = (banExpires) => {
    const expiresDate = new Date(banExpires);
    popSnackbar(
      `You are site-banned. Your ban expires on ${expiresDate.toLocaleString()}.`,
      "error"
    );
  };

  const SnackbarWrapped = (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );

  return {
    popSnackbar,
    popUnexpectedError,
    popTooManyLoginAttempts,
    popLoginFailed,
    popSiteBanned,
    SnackbarWrapped,
  };
};
