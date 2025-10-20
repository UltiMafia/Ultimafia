import React, { useState } from "react";
import { Button, Stack } from "@mui/material";
import { RegisterDialog } from "../pages/Welcome/RegisterDialog";
import { LoginDialog } from "../pages/Welcome/LoginDialog";

export const GuestAuthButtons = () => {
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const openLoginDialog = () => setLoginDialogOpen(true);
  const openRegisterDialog = () => setRegisterDialogOpen(true);

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={openLoginDialog}
          sx={{
            textTransform: "none",
            fontSize: "14px",
            minWidth: "60px",
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
            minWidth: "70px",
          }}
        >
          Register
        </Button>
      </Stack>
      <RegisterDialog
        open={registerDialogOpen}
        setOpen={setRegisterDialogOpen}
      />
      <LoginDialog open={loginDialogOpen} setOpen={setLoginDialogOpen} />
    </>
  );
};
