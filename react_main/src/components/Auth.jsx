import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  LinearProgress,
  TextField,
  Tabs,
  Tab,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogContent,
} from "@mui/material";
import GoogleIcon from "../images/welcome_page/GoogleIcon.png";
import DiscordIcon from "../images/welcome_page/DiscordIcon.png";
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
import { SiteInfoContext } from "../Contexts";
import { Link } from "react-router-dom";

export const Auth = ({ defaultTab = 0, open, onClose, asDialog = false }) => {
  const snackbarHook = useSnackbar();
  const siteInfo = useContext(SiteInfoContext);
  const [tabValue, setTabValue] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordConfirmationHelperText, setPasswordConfirmationHelperText] =
    useState("");
  const [birthDate, setBirthDate] = useState("");
  const [ageError, setAgeError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const googleProvider = new GoogleAuthProvider();
  const skips = JSON.parse(import.meta.env.REACT_APP_RECAP_SKIP || "[]");

  // Reset form when tab changes
  useEffect(() => {
    setPassword("");
    setPasswordConfirmation("");
    setBirthDate("");
    setAgeError("");
    setShowForgotPassword(false);
    setShowResendVerification(false);
  }, [tabValue]);

  // Reset form and tab when dialog opens/closes
  useEffect(() => {
    if (asDialog && open !== undefined) {
      if (open) {
        setTabValue(defaultTab);
      } else {
        setPassword("");
        setPasswordConfirmation("");
        setBirthDate("");
        setAgeError("");
        setShowForgotPassword(false);
        setShowResendVerification(false);
      }
    }
  }, [open, asDialog, defaultTab]);

  // Password confirmation validation
  useEffect(() => {
    if (tabValue === 1) {
      setPasswordConfirmationHelperText(
        password !== passwordConfirmation ? "Passwords differ" : ""
      );
    }
  }, [password, passwordConfirmation, tabValue]);

  // Age calculation function
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;
    const today = new Date();
    const birth = new Date(birthDateString);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Age validation
  useEffect(() => {
    if (tabValue === 1 && birthDate) {
      const age = calculateAge(birthDate);
      if (age === null) {
        setAgeError("");
      } else if (age < 13) {
        setAgeError("You must be 13 years or older to register.");
      } else {
        setAgeError("");
      }
    } else {
      setAgeError("");
    }
  }, [birthDate, tabValue]);

  const handleBirthDateChange = (e) => {
    const date = e.target.value;
    setBirthDate(date);
  };

  const isAgeValid = () => {
    if (!birthDate) return false;
    const age = calculateAge(birthDate);
    return age !== null && age >= 13;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
        if (asDialog && onClose) {
          onClose();
        }
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
        if (asDialog && onClose) {
          onClose();
        }
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

      // Switch to login tab after successful registration
      setTabValue(0);
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
      setBirthDate("");
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
      setShowForgotPassword(false);
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
        setShowResendVerification(false);
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

      setShowResendVerification(false);
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

  // Login Tab Content
  const LoginContent = (
    <Box>
      {showForgotPassword ? (
        <Box>
          <Button
            variant="text"
            onClick={() => setShowForgotPassword(false)}
            sx={{ mb: 2, textTransform: "none" }}
          >
            <i className="fas fa-chevron-circle-left" /> Back to Login
          </Button>
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
              Reset Password
            </Button>
          </form>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </Box>
      ) : showResendVerification ? (
        <Box>
          <Button
            variant="text"
            onClick={() => setShowResendVerification(false)}
            sx={{ mb: 2, textTransform: "none" }}
          >
            <i className="fas fa-chevron-circle-left" /> Back to Login
          </Button>
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
        </Box>
      ) : (
        <>
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
          <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "center" }}>
            <Tooltip title="Login with Google">
              <IconButton
                onClick={loginGoogle}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <img src={GoogleIcon} alt="Google" width={24} height={24} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Login with Discord">
              <IconButton
                onClick={loginDiscord}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <img src={DiscordIcon} alt="Discord" width={24} height={24} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: "11px",
              opacity: "0.5",
              cursor: "default",
              userSelect: "none",
              display: "inline",
            }}
          >
            By logging in, you agree to our&nbsp;
            <Link to="/policy/tos">Terms & Conditions</Link>
            &nbsp;and&nbsp;
            <Link to="/policy/privacy">Privacy Policy</Link>.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: "center" }}>
            <Button
              variant="text"
              sx={{ pb: 0, cursor: "Pointer", textTransform: "none", fontSize: "12px" }}
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </Button>
            <Button
              variant="text"
              sx={{ pb: 0, cursor: "Pointer", textTransform: "none", fontSize: "12px" }}
              onClick={() => setShowResendVerification(true)}
            >
              Resend Verification
            </Button>
          </Stack>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </>
      )}
    </Box>
  );

  // Register Tab Content
  const RegisterContent = (
    <Box>
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
        <TextField
          label="Date of Birth"
          type="date"
          required
          margin="dense"
          fullWidth
          variant="standard"
          value={birthDate}
          onChange={handleBirthDateChange}
          error={!!ageError}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            max: new Date(new Date().setFullYear(new Date().getFullYear() - 13))
              .toISOString()
              .split("T")[0], // Set max date to 13 years ago
          }}
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
            !isAgeValid()
          }
        >
          Register
        </Button>
      </form>
      <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "center" }}>
        <Tooltip title="Register with Google">
          <IconButton
            onClick={registerGoogle}
            sx={{
              border: 1,
              borderColor: "divider",
              "&:hover": {
                borderColor: "primary.main",
              },
            }}
          >
            <img src={GoogleIcon} alt="Google" width={24} height={24} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Register with Discord">
          <IconButton
            onClick={registerDiscord}
            sx={{
              border: 1,
              borderColor: "divider",
              "&:hover": {
                borderColor: "primary.main",
              },
            }}
          >
            <img src={DiscordIcon} alt="Discord" width={24} height={24} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography
        color="text.secondary"
        sx={{
          fontSize: "11px",
          opacity: "0.5",
          cursor: "default",
          userSelect: "none",
          display: "inline",
        }}
      >
        By registering, you agree to our&nbsp;
        <Link to="/policy/tos">Terms & Conditions</Link>
        &nbsp;and&nbsp;
        <Link to="/policy/privacy">Privacy Policy</Link>.
      </Typography>
      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );

  const authContent = (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="authentication tabs"
        sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
      >
        <Tab label="Login" />
        <Tab label="Register" />
      </Tabs>
      <Box 
        role="tabpanel" 
        hidden={tabValue !== 0}
        sx={{ 
          flex: 1, 
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {tabValue === 0 && LoginContent}
      </Box>
      <Box 
        role="tabpanel" 
        hidden={tabValue !== 1}
        sx={{ 
          flex: 1, 
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {tabValue === 1 && RegisterContent}
      </Box>
    </Box>
  );

  if (asDialog) {
    return (
      <>
        <Dialog 
          open={open || false} 
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              height: "600px",
              maxHeight: "90vh",
            }
          }}
        >
          <DialogContent sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {authContent}
          </DialogContent>
        </Dialog>
        {snackbarHook.SnackbarWrapped}
      </>
    );
  }

  return (
    <>
      {authContent}
      {snackbarHook.SnackbarWrapped}
    </>
  );
};
