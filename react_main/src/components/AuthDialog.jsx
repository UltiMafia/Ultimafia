import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import GoogleIcon from "../pages/Welcome/GoogleIcon.png";
import DiscordIcon from "../pages/Welcome/DiscordIcon.png";
import {
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import axios from "axios";
import { verifyRecaptcha } from "../utils";
import { useSnackbar } from "../hooks/useSnackbar";
import { YouAgree } from "../pages/Welcome/YouAgree";
import { SiteInfoContext } from "../Contexts";

export const AuthDialog = ({ open, setOpen, defaultMode = "login" }) => {
  const snackbarHook = useSnackbar();
  const siteInfo = useContext(SiteInfoContext);
  const [mode, setMode] = useState(defaultMode);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordConfirmationHelperText, setPasswordConfirmationHelperText] =
    useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const googleProvider = new GoogleAuthProvider();
  const skips = JSON.parse(import.meta.env.REACT_APP_RECAP_SKIP || "[]");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
    } else {
      setPassword("");
      setPasswordConfirmation("");
      setAgeConfirmed(false);
    }
  }, [open, defaultMode]);

  // Update mode when defaultMode changes
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
    }
  }, [defaultMode, open]);

  // Password confirmation validation
  useEffect(() => {
    if (mode === "register") {
      setPasswordConfirmationHelperText(
        password !== passwordConfirmation ? "Passwords differ" : ""
      );
    }
  }, [password, passwordConfirmation, mode]);

  const handleClose = (event, reason) => {
    if (reason === "escapeKeyDown") {
      setOpen(false);
    }
  };

  const pressX = () => setOpen(false);

  // Login handlers
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

  // Register handlers
  const register = async (e) => {
    e.preventDefault();
    try {
      const allowedEmailDomans = JSON.parse(
        import.meta.env.REACT_APP_EMAIL_DOMAINS
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

      if (import.meta.env.MODE !== "development") {
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
      if (import.meta.env.MODE !== "development") {
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
        import.meta.env.MODE !== "development"
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

  // Forgot password handlers
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
      setMode("login");
    } catch (err) {
      snackbarHook.popUnexpectedError();
      console.error(err);
    }
    setLoading(false);
  };

  // Resend verification handlers
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
        setMode("login");
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

      setMode("login");
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

  const handlePasswordConfirmationChange = (e) => {
    setPasswordConfirmation(e.target.value);
  };

  // Login View
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
          onClick={() => setMode("forgot")}
        >
          Forgot Password?
        </Button>
        <Button
          variant="text"
          sx={{ mt: 0.5, pb: 0, cursor: "Pointer", textTransform: "none" }}
          onClick={() => setMode("resend")}
        >
          Resend Verification Email
        </Button>
        <Button
          variant="text"
          sx={{ mt: 0.5, pb: 0, cursor: "Pointer", textTransform: "none" }}
          onClick={() => setMode("register")}
        >
          Don't have an account? Register
        </Button>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
    </>
  );

  // Register View
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
        <Button
          variant="text"
          sx={{ mt: 0.5, pb: 0, cursor: "Pointer", textTransform: "none" }}
          onClick={() => setMode("login")}
        >
          Already have an account? Login
        </Button>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>
    </>
  );

  // Forgot Password View
  const ForgotPasswordJSX = (
    <>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <div>Recover Password</div>
        <Button
          variant="text"
          onClick={() => setMode("login")}
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

  // Resend Verification View
  const ResendVerificationJSX = (
    <>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <div>Resend Verification Email</div>
        <Button
          variant="text"
          onClick={() => setMode("login")}
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

  // Render based on mode
  const renderContent = () => {
    switch (mode) {
      case "login":
        return LoginJSX;
      case "register":
        return RegisterJSX;
      case "forgot":
        return ForgotPasswordJSX;
      case "resend":
        return ResendVerificationJSX;
      default:
        return LoginJSX;
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm">
        {renderContent()}
      </Dialog>
      {snackbarHook.SnackbarWrapped}
    </>
  );
};
