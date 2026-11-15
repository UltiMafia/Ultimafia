import React, { useState, Suspense, lazy } from "react";
import { Stack } from "@mui/material";
import { UiAction } from "components/ui";

// Auth pulls in firebase/auth — only load it when the dialog is actually opened.
const Auth = lazy(() =>
  import("./Auth").then((m) => ({ default: m.Auth }))
);

export const GuestAuthButtons = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState(0); // 0 = login, 1 = register

  const openLoginDialog = () => {
    setAuthDialogMode(0);
    setAuthDialogOpen(true);
  };

  const openRegisterDialog = () => {
    setAuthDialogMode(1);
    setAuthDialogOpen(true);
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        <UiAction variant="secondary" size="small" onClick={openLoginDialog}>
          Login
        </UiAction>
        <UiAction variant="primary" size="small" onClick={openRegisterDialog}>
          Register
        </UiAction>
      </Stack>
      {authDialogOpen && (
        <Suspense fallback={null}>
          <Auth
            open={authDialogOpen}
            onClose={() => setAuthDialogOpen(false)}
            defaultTab={authDialogMode}
            asDialog={true}
          />
        </Suspense>
      )}
    </>
  );
};
