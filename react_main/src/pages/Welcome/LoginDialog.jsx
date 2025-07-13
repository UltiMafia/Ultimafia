import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import GoogleIcon from "./GoogleIcon.png";
import DiscordIcon from "./DiscordIcon.png";
import {
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { verifyRecaptcha } from "../../utils";
import axios from "axios";
import { useSnackbar } from "../../hooks/useSnackbar";
import { YouAgree } from "./YouAgree";
import { dialogTheme } from "../../constants/themes";

export const LoginDialog = ({ open, setOpen }) => {
  const snackbarHook = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOn, setForgotPasswordOn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleProvider = new GoogleAuthProvider();
  const skips = JSON.parse(process.env.REACT_APP_RECAP_SKIP || "[]");

  useEffect(() => {
    if (open) {
      setForgotPasswordOn(false);
    } else {
      setPassword("");
    }
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === "escapeKeyDown") {
      setOpen(false);
    }
  };

  const pressX = () => setOpen(false);

  const handleOpenForgotPassword = () => setForgotPasswordOn(true);
  const handleUndoForgotPassword = () => setForgotPasswordOn(false);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);

    let emailTest = true;
    if (skips.includes(email)) {
      emailTest = false;
    }

    try {
      if (process.env.REACT_APP_ENVIRONMENT !== "development" && emailTest) {
        await verifyRecaptcha("auth");
      }

      const auth = getAuth();
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCred.user.getIdToken(true);

      try {
        await axios.post("/api/auth", { idToken });
        window.location.reload();
      } catch (err) {
        snackbarHook.popUnexpectedError();
        console.error(err);

        if (err?.response?.status === 403) {
          try {
            await sendEmailVerification(userCred.user);
          } catch (err) {
            snackbarHook.popUnexpectedError();
            console.error(err);
          }
        }
      }
    } catch (err) {
      if (err.message.includes("(auth/too-many-requests)")) {
        snackbarHook.popTooManyLoginAttempts();
      } else {
        snackbarHook.popLoginFailed();
      }
      console.error(err);
    }

    setLoading(false);
  };

  const loginGoogle = async () => {
    setLoading(true);
    try {
      if (process.env.REACT_APP_ENVIRONMENT !== "development") {
        await verifyRecaptcha("auth");
      }
      const userCred = await signInWithPopup(getAuth(), googleProvider);
      const idToken = await userCred.user.getIdToken(true);
      
      try {
        await axios.post("/api/auth", { idToken });
        window.location.reload();
      } catch (err) {
        snackbarHook.popUnexpectedError();
        console.error(err);
      }
    } catch (err) {
      if (err.message.includes("(auth/too-many-requests)")) {
        snackbarHook.popTooManyLoginAttempts();
      } else {
        snackbarHook.popLoginFailed();
      }
      console.error(err);
    }
    setLoading(false);
  };

  const loginDiscord = async () => {
    setLoading(true);
    try {
      let hrefUrl;
      if (process.env.REACT_APP_ENVIRONMENT !== "development") {
        await verifyRecaptcha("auth");
        hrefUrl = window.location.origin + "/auth/discord";
      } else {
        hrefUrl = window.location.origin + ":3000/auth/discord";
      }
      window.location.href = hrefUrl;
    } catch (err) {
      if (err.message.includes("(auth/too-many-requests)")) {
        snackbarHook.popTooManyLoginAttempts();
      } else {
        snackbarHook.popLoginFailed();
      }
      console.error(err);
    }
    setLoading(false);
  };

  const recoverPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      snackbarHook.popSnackbar(
        "Password reset email has been sent.",
        "success"
      );
    } catch (err) {
      snackbarHook.popUnexpectedError();
      console.error(err);
    }
    setLoading(false);
  };

  const LoginJSX = (
    <>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <div>Login</div>
        <Button
          variant="outlined"
          onClick={pressX}
          sx={{ minWidth: "32px", p: 0 }}
        >
          <i className="fas fa-times" />
        </Button>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={login}>
          <TextField
            label="Email Address"
            type="email"
            autoFocus
            required
            autoComplete="off"
            margin="dense"
            fullWidth
            variant="standard"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input hidden />
          <TextField
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            margin="none"
            fullWidth
            variant="standard"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            fullWidth
            sx={{ mt: 2 }}
            type="submit"
            disabled={loading || !email || !password}
          >
            Login
          </Button>
        </form>
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 1, textTransform: "none" }}
          onClick={loginGoogle}
        >
          <img src={GoogleIcon} alt="Google Icon" width={21} />
          &nbsp;Login with Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 1, textTransform: "none" }}
          onClick={loginDiscord}
        >
          <img src={DiscordIcon} alt="Discord Icon" width={21} />
          &nbsp;Login with Discord
        </Button>
        <YouAgree action={"logging in"} />
        <Button
          variant="text"
          sx={{ mt: 0.5, pb: 0, cursor: "Pointer", textTransform: "none" }}
          onClick={handleOpenForgotPassword}
        >
          Forgot Password?
        </Button>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
    </>
  );

  const ForgotPasswordJSX = (
    <>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <div>Recover Password</div>
        <Button
          variant="text"
          onClick={handleUndoForgotPassword}
          sx={{ minWidth: "32px", p: 0 }}
        >
          <i className="fas fa-chevron-circle-left" />
        </Button>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={recoverPassword}>
          <TextField
            label="Email Address"
            type="email"
            autoFocus
            required
            autoComplete="off"
            margin="dense"
            fullWidth
            variant="standard"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            fullWidth
            sx={{ mt: 2 }}
            type="submit"
            disabled={loading || !email}
          >
            Reset
          </Button>
        </form>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
    </>
  );

  return (
    <ThemeProvider theme={dialogTheme}>
      <CssBaseline />
      <Dialog open={open} onClose={handleClose} maxWidth="sm">
        {!forgotPasswordOn && LoginJSX}
        {forgotPasswordOn && ForgotPasswordJSX}
      </Dialog>
      {snackbarHook.SnackbarWrapped}
    </ThemeProvider>
  );
};
