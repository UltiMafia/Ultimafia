import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
  ThemeProvider,
} from "@mui/material";
import { dialogTheme } from "./dialogTheme";
import GoogleIcon from "./GoogleIcon.png";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithRedirect,
} from "firebase/auth";
import { verifyRecaptcha } from "../../utils";
import { useSnackbar } from "../../hooks/useSnackbar";

export const RegisterDialog = ({ open, setOpen }) => {
  const snackbarHook = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordConfirmationHelperText, setPasswordConfirmationHelperText] =
    useState("");
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    if (!open) {
      setPassword("");
      setPasswordConfirmation("");
    }
  }, [open]);
  useEffect(() => {
    setPasswordConfirmationHelperText(
      password !== passwordConfirmation ? "Passwords differ" : ""
    );
  }, [password, passwordConfirmation]);
  const handleClose = (event, reason) => {
    if (reason === "escapeKeyDown") {
      setOpen(false);
    }
  };
  const pressX = () => setOpen(false);

  const register = async (e) => {
    e.preventDefault();
    try {
      const allowedEmailDomans = JSON.parse(
        process.env.REACT_APP_EMAIL_DOMAINS
      );
      const emailDomain = email.split("@")[1] || "";
      if (allowedEmailDomans.indexOf(emailDomain) === -1) {
        return snackbarHook.popSnackbar(
          `Email domain must be one of the following: ${allowedEmailDomans.join(
            ", "
          )}`,
          "warning"
        );
      }

      setLoading(true);

      if (process.env.REACT_APP_ENVIRONMENT != "development") {
        await verifyRecaptcha("auth");
      }

      const auth = getAuth();
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await sendEmailVerification(userCred.user);

      snackbarHook.popSnackbar(
        "Account created! Please click the verification link in your email before logging in (be sure to check your spam folder).",
        "success"
      );

      setOpen(false);
      // gtag_report_conversion();
    } catch (err) {
      if (!err?.message) return;

      if (err.message.indexOf("(auth/invalid-email)") !== -1) {
        snackbarHook.popSnackbar("Invalid email.", "warning");
      } else if (err.message.indexOf("(auth/weak-password)") !== -1) {
        snackbarHook.popSnackbar(
          "Password should be at least 6 characters.",
          "warning"
        );
      } else if (err.message.indexOf("(auth/email-already-in-use)") !== -1) {
        snackbarHook.popSnackbar("Email already in use.", "warning");
      } else {
        snackbarHook.popUnexpectedError();
        console.log(err);
      }
    }
    setLoading(false);
  };
  const registerGoogle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (process.env.REACT_APP_ENVIRONMENT != "development") {
        await verifyRecaptcha("auth");
      }

      await signInWithRedirect(getAuth(), googleProvider);
      // gtag_report_conversion();
    } catch (err) {
      if (!err?.message) return;

      if (err.message.indexOf("(auth/too-many-requests)") !== -1) {
        snackbarHook.popTooManyLoginAttempts();
      } else {
        snackbarHook.popLoginFailed();
      }
    }
    setLoading(false);
  };
  const handlePasswordConfirmationChange = (e) => {
    setPasswordConfirmation(e.target.value);
  };

  const RegisterJSX = (
    <>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <div>Register</div>
        <Button
          variant="outlined"
          onClick={pressX}
          sx={{ minWidth: "32px", p: 0 }}
        >
          <i className="fas fa-times" />
        </Button>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={register}>
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
          <TextField
            label="Confirm Password"
            type="password"
            required
            autoComplete="new-password"
            margin="none"
            fullWidth
            variant="standard"
            value={passwordConfirmation}
            onChange={handlePasswordConfirmationChange}
            error={!!passwordConfirmationHelperText}
            helperText={passwordConfirmationHelperText}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            type="submit"
            disabled={
              loading ||
              !email ||
              !password ||
              !passwordConfirmation ||
              password !== passwordConfirmation
            }
          >
            Register
          </Button>
        </form>
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 1, textTransform: "none" }}
          onClick={registerGoogle}
        >
          <img src={GoogleIcon} alt="Google Icon" width={21} />
          &nbsp;Register with Google
        </Button>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
    </>
  );

  return (
    <ThemeProvider theme={dialogTheme}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm">
        {RegisterJSX}
      </Dialog>
      {snackbarHook.SnackbarWrapped}
    </ThemeProvider>
  );
};
