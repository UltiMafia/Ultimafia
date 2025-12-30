import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
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
  signOut,
} from "firebase/auth";
import axios from "axios";

import { verifyRecaptcha } from "utils";
import { useSnackbar } from "hooks/useSnackbar";
import { YouAgree } from "./YouAgree";
import { SiteInfoContext } from "Contexts";

export const LoginDialog = ({ open, setOpen }) => {
  const snackbarHook = useSnackbar();
  const siteInfo = useContext(SiteInfoContext);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOn, setForgotPasswordOn] = useState(false);
  const [resendVerificationOn, setResendVerificationOn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleProvider = new GoogleAuthProvider();
  const skips = JSON.parse(import.meta.env.REACT_APP_RECAP_SKIP || "[]");

  useEffect(() => {
    if (open) {
      setForgotPasswordOn(false);
      setResendVerificationOn(false);
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
  const handleOpenResendVerification = () => setResendVerificationOn(true);
  const handleUndoResendVerification = () => setResendVerificationOn(false);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);

    let emailTest = true;
    if (skips.includes(email)) {
      emailTest = false;
    }

    try {
      if (import.meta.env.MODE !== "development" && emailTest) {
        await verifyRecaptcha("auth");
      }

      const auth = getAuth();
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCred.user.getIdToken(true);

      try {
        await axios.post("/api/auth", { idToken });
        window.location.reload();
      } catch (err) {
        // Check if this is a site-ban error
        if (err?.response?.status === 403 && err?.response?.data) {
          try {
            const data =
              typeof err.response.data === "string"
                ? JSON.parse(err.response.data)
                : err.response.data;
            if (data.siteBanned) {
              snackbarHook.popSiteBanned(data.banExpires);
              setLoading(false);
              return;
            }
            if (data.deleted) {
              snackbarHook.popUserDeleted();
              setLoading(false);
              return;
            }
          } catch (parseErr) {
            // Not a site-ban error, continue with regular error handling
          }
        }

        snackbarHook.popUnexpectedError();
        console.error(err);

        if (err?.response?.status === 403) {
          try {
            // Check if email is already verified
            if (userCred.user.emailVerified) {
              snackbarHook.popSnackbar(
                "Your email is already verified. Please contact support if you're still unable to log in.",
                "info"
              );
            } else {
              await sendEmailVerification(userCred.user);
              snackbarHook.popSnackbar(
                "A verification email has been sent. Please check your inbox (and spam folder) and verify your email before logging in.",
                "info"
              );
            }
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
      if (import.meta.env.MODE !== "development") {
        await verifyRecaptcha("auth");
      }
      const userCred = await signInWithPopup(getAuth(), googleProvider);
      const idToken = await userCred.user.getIdToken(true);

      try {
        await axios.post("/api/auth", { idToken });
        window.location.reload();
      } catch (err) {
        // Check if this is a site-ban error
        if (err?.response?.status === 403 && err?.response?.data) {
          try {
            const data =
              typeof err.response.data === "string"
                ? JSON.parse(err.response.data)
                : err.response.data;
            if (data.siteBanned) {
              snackbarHook.popSiteBanned(data.banExpires);
              setLoading(false);
              return;
            }
            if (data.deleted) {
              snackbarHook.popUserDeleted();
              setLoading(false);
              return;
            }
          } catch (parseErr) {
            // Not a site-ban error, continue with regular error handling
          }
        }

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
      if (import.meta.env.MODE !== "development") {
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

  const resendVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    let emailTest = true;
    if (skips.includes(email)) {
      emailTest = false;
    }

    try {
      if (import.meta.env.MODE !== "development" && emailTest) {
        await verifyRecaptcha("auth");
      }

      const auth = getAuth();
      // Sign in to get the user object (this will work even if email isn't verified)
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      // Check if email is already verified
      if (userCred.user.emailVerified) {
        snackbarHook.popSnackbar(
          "This email is already verified. You can now log in.",
          "info"
        );
        setResendVerificationOn(false);
        setLoading(false);
        return;
      }

      // Send verification email
      await sendEmailVerification(userCred.user);

      snackbarHook.popSnackbar(
        "Verification email has been sent. Please check your inbox (and spam folder).",
        "success"
      );

      // Sign out since they can't actually log in yet
      await signOut(auth);

      setResendVerificationOn(false);
    } catch (err) {
      if (err.message.includes("(auth/user-not-found)")) {
        snackbarHook.popSnackbar(
          "No account found with this email address.",
          "warning"
        );
      } else if (err.message.includes("(auth/wrong-password)")) {
        snackbarHook.popSnackbar(
          "Incorrect password. Please try again.",
          "warning"
        );
      } else if (err.message.includes("(auth/too-many-requests)")) {
        snackbarHook.popTooManyLoginAttempts();
      } else {
        snackbarHook.popUnexpectedError();
        console.error(err);
      }
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
        <Button
          variant="text"
          sx={{ mt: 0.5, pb: 0, cursor: "Pointer", textTransform: "none" }}
          onClick={handleOpenResendVerification}
        >
          Resend Verification Email
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

  const ResendVerificationJSX = (
    <>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <div>Resend Verification Email</div>
        <Button
          variant="text"
          onClick={handleUndoResendVerification}
          sx={{ minWidth: "32px", p: 0 }}
        >
          <i className="fas fa-chevron-circle-left" />
        </Button>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={resendVerification}>
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
          <TextField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            margin="dense"
            fullWidth
            variant="standard"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Button
            fullWidth
            sx={{ mt: 2 }}
            type="submit"
            disabled={loading || !email || !password}
          >
            Resend Verification Email
          </Button>
        </form>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
    </>
  );

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm">
        {!forgotPasswordOn && !resendVerificationOn && LoginJSX}
        {forgotPasswordOn && ForgotPasswordJSX}
        {resendVerificationOn && ResendVerificationJSX}
      </Dialog>
      {snackbarHook.SnackbarWrapped}
    </>
  );
};
