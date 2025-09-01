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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import GoogleIcon from "./GoogleIcon.png";
import DiscordIcon from "./DiscordIcon.png";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithRedirect,
} from "firebase/auth";
import { verifyRecaptcha } from "../../utils";
import { useSnackbar } from "../../hooks/useSnackbar";
import { YouAgree } from "./YouAgree";

export const RegisterDialog = ({ open, setOpen }) => {
  const snackbarHook = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordConfirmationHelperText, setPasswordConfirmationHelperText] =
    useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    if (!open) {
      setPassword("");
      setPasswordConfirmation("");
      setAgeConfirmed(false);
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

      if (process.env.REACT_APP_ENVIRONMENT !== "development") {
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
        "Account created! Please check your email for verification before logging in (check spam folder too).",
        "success"
      );

      setOpen(false);
    } catch (err) {
      if (!err?.message) return;

      if (err.message.includes("(auth/invalid-email)")) {
        snackbarHook.popSnackbar("Invalid email.", "warning");
      } else if (err.message.includes("(auth/weak-password)")) {
        snackbarHook.popSnackbar(
          "Password should be at least 6 characters.",
          "warning"
        );
      } else if (err.message.includes("(auth/email-already-in-use)")) {
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
      if (process.env.REACT_APP_ENVIRONMENT !== "development") {
        await verifyRecaptcha("auth");
      }
      await signInWithRedirect(getAuth(), googleProvider);
    } catch (err) {
      if (!err?.message) return;
      if (err.message.includes("(auth/too-many-requests)")) {
        snackbarHook.popTooManyLoginAttempts();
      } else {
        snackbarHook.popLoginFailed();
      }
    }
    setLoading(false);
  };

  const registerDiscord = async () => {
    setLoading(true);
    try {
      let hrefUrl =
        process.env.REACT_APP_ENVIRONMENT !== "development"
          ? `${window.location.origin}/auth/discord`
          : `${window.location.origin}:3000/auth/discord`;
      window.location.href = hrefUrl;
    } catch (err) {
      if (!err?.message) return;
      if (err.message.includes("(auth/too-many-requests)")) {
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
          <FormControlLabel
            control={
              <Checkbox
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
              />
            }
            label="I confirm that I am 13 years or older."
          />
          <Button
            fullWidth
            sx={{ mt: 2 }}
            type="submit"
            disabled={
              loading ||
              !email ||
              !password ||
              !passwordConfirmation ||
              password !== passwordConfirmation ||
              !ageConfirmed
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
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 1, textTransform: "none" }}
          onClick={registerDiscord}
        >
          <img src={DiscordIcon} alt="Discord Icon" width={21} />
          &nbsp;Register with Discord
        </Button>
        <YouAgree action={"registering"} />
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
    </>
  );

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm">
        {RegisterJSX}
      </Dialog>
      {snackbarHook.SnackbarWrapped}
    </>
  );
};
