import React, { useState } from "react";
import { Button, Stack } from "@mui/material";
import { Auth } from "./Auth";

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
        <Button
          variant="outlined"
          size="small"
          onClick={openLoginDialog}
          sx={{
            textTransform: "none",
            fontSize: "14px",
          }}
        >
          Login
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={openRegisterDialog}
          sx={{
            textTransform: "none",
            fontSize: "14px",
          }}
        >
          Register
        </Button>
      </Stack>
      <Auth
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        defaultTab={authDialogMode}
        asDialog={true}
      />
    </>
  );
};
