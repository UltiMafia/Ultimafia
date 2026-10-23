import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Button, Stack, TextField, Typography } from "@mui/material";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

import { SiteInfoContext } from "../../Contexts";

const PENDING_EMAIL_KEY = "pendingEmailChange";

export function firebaseErrorMessage(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Your password is incorrect.";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return "That new password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/email-already-in-use":
      return "That email address is already in use.";
    case "auth/invalid-email":
    case "auth/invalid-new-email":
      return "That email address is not valid.";
    case "auth/requires-recent-login":
      return "Please enter your current password again.";
    case "auth/network-request-failed":
      return "Network error. Please try again.";
    default:
      return err?.response?.data || "Something went wrong. Please try again.";
  }
}

// Confirms the current password: reauthenticates the signed-in Firebase user,
// or signs in with it when the page has no Firebase user.
async function reauthenticate(email, password) {
  const auth = getAuth();
  if (auth.currentUser && auth.currentUser.email === email) {
    await reauthenticateWithCredential(
      auth.currentUser,
      EmailAuthProvider.credential(email, password)
    );
    return auth.currentUser;
  }
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

function providerName(providers) {
  if (providers.includes("apple.com")) return "Apple";
  if (providers.includes("google.com")) return "Google";
  return null;
}

export default function AccountCredentials() {
  const siteInfo = useContext(SiteInfoContext);
  const [authInfo, setAuthInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailPassword, setEmailPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [pending, setPending] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_EMAIL_KEY) || "null");
    } catch (e) {
      return null;
    }
  });
  const [finishPassword, setFinishPassword] = useState("");

  useEffect(() => {
    axios
      .get("/api/user/account/auth")
      .then((res) => setAuthInfo(res.data))
      .catch(() => setAuthInfo({ email: null, providers: [] }));
  }, []);

  const savePending = (value) => {
    setPending(value);
    if (value) localStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify(value));
    else localStorage.removeItem(PENDING_EMAIL_KEY);
  };

  const run = async (action) => {
    setLoading(true);
    try {
      await action();
    } catch (err) {
      siteInfo.showAlert(firebaseErrorMessage(err), "error");
      if (!err?.code) console.error(err);
    }
    try {
      await signOut(getAuth());
    } catch (e) {}
    setLoading(false);
  };

  const onChangePassword = () =>
    run(async () => {
      if (newPassword !== confirmPassword) {
        siteInfo.showAlert("The new passwords don't match.", "error");
        return;
      }
      const fbUser = await reauthenticate(authInfo.email, currentPassword);
      await updatePassword(fbUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      siteInfo.showAlert("Your password has been changed.", "success");
    });

  const onChangeEmail = () =>
    run(async () => {
      const target = newEmail.trim();
      const fbUser = await reauthenticate(authInfo.email, emailPassword);
      await verifyBeforeUpdateEmail(fbUser, target);
      savePending({ oldEmail: authInfo.email, newEmail: target });
      setEmailPassword("");
      setNewEmail("");
      siteInfo.showAlert(
        `We sent a link to ${target}. Your email changes when you open it.`,
        "success"
      );
    });

  // After the link is opened, the Firebase account has the new email. Signing
  // in with it gives a fresh token the server checks before storing the email.
  const onFinishEmailChange = () =>
    run(async () => {
      const cred = await signInWithEmailAndPassword(
        getAuth(),
        pending.newEmail,
        finishPassword
      );
      await cred.user.reload();
      if (!cred.user.emailVerified) {
        siteInfo.showAlert("Open the link in the email first.", "error");
        return;
      }
      const idToken = await cred.user.getIdToken(true);
      const res = await axios.post("/api/user/account/email/sync", {
        idToken,
        oldEmail: pending.oldEmail,
      });
      setAuthInfo({ ...authInfo, email: res.data.email });
      savePending(null);
      setFinishPassword("");
      siteInfo.showAlert("Your email address has been updated.", "success");
    });

  const onPasswordReset = () =>
    run(async () => {
      await sendPasswordResetEmail(getAuth(), authInfo.email);
      siteInfo.showAlert("Password reset email has been sent.", "success");
    });

  if (!authInfo) return null;

  const providers = authInfo.providers || [];
  if (!providers.includes("password")) {
    const name = providerName(providers);
    return (
      <Typography variant="body2" color="text.secondary">
        {name
          ? `You sign in with ${name}, so your email and password are managed by your ${name} account.`
          : "Your sign-in is managed outside this site, so there is no password to change here."}
      </Typography>
    );
  }

  return (
    <Stack direction="column" spacing={3}>
      <Stack direction="column" spacing={1}>
        <Typography variant="h6">Change password</Typography>
        <TextField
          type="password"
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={loading}
        />
        <TextField
          type="password"
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
        />
        <TextField
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!confirmPassword && confirmPassword !== newPassword}
          helperText={
            confirmPassword && confirmPassword !== newPassword
              ? "The new passwords don't match."
              : undefined
          }
          disabled={loading}
        />
        <Button
          onClick={onChangePassword}
          disabled={
            loading ||
            !currentPassword ||
            !newPassword ||
            newPassword !== confirmPassword
          }
        >
          Change password
        </Button>
        <Button variant="text" size="small" onClick={onPasswordReset} disabled={loading}>
          Forgot your password? Email me a reset link
        </Button>
      </Stack>

      <Stack direction="column" spacing={1}>
        <Typography variant="h6">Change email</Typography>
        <Typography variant="body2" color="text.secondary">
          Current email: {authInfo.email}
        </Typography>
        {pending ? (
          <>
            <Typography variant="body2">
              We sent a link to {pending.newEmail}. After opening it, enter your
              password to finish.
            </Typography>
            <TextField
              type="password"
              label="Password"
              autoComplete="current-password"
              value={finishPassword}
              onChange={(e) => setFinishPassword(e.target.value)}
              disabled={loading}
            />
            <Button onClick={onFinishEmailChange} disabled={loading || !finishPassword}>
              Finish email change
            </Button>
            <Button variant="text" size="small" onClick={() => savePending(null)} disabled={loading}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <TextField
              type="email"
              label="New email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              type="password"
              label="Current password"
              autoComplete="current-password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              onClick={onChangeEmail}
              disabled={loading || !newEmail.trim() || !emailPassword}
            >
              Send verification link
            </Button>
          </>
        )}
      </Stack>
    </Stack>
  );
}
