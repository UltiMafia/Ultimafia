import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getAuth, signOut } from "firebase/auth";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import jailer from "images/roles/village/jailer-vivid.png";

export const MIN_APPEAL_LENGTH = 10;
export const MAX_APPEAL_LENGTH = 1000;

export const APPEAL_STATUS_LABELS = {
  not_submitted: "NOT SUBMITTED",
  pending: "PENDING",
  accepted: "ACCEPTED",
  denied: "DENIED",
};

const APPEAL_STATUS_COLORS = {
  not_submitted: "default",
  pending: "warning",
  accepted: "success",
  denied: "error",
};

const APPEAL_STATUS_TEXT = {
  not_submitted: "You have not appealed this ban.",
  pending: "Your appeal was sent to the admins and is waiting for review.",
  accepted:
    "Your appeal was accepted. If your ban has been lifted, sign out and sign in again.",
  denied: "Your appeal was denied. The ban stands.",
};

function formatDate(ms) {
  if (!ms) return null;
  return new Date(ms).toLocaleString();
}

// The full-page screen a site-banned user sees after signing in.
export default function Banned() {
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [appealText, setAppealText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const load = useCallback(() => {
    return axios
      .get("/api/auth/ban")
      .then((res) => {
        setInfo(res.data);
        setLoadError(null);
      })
      .catch(() => setLoadError("Could not load your ban. Please refresh."));
  }, []);

  useEffect(() => {
    document.title = "Banned | UltiMafia";
    load();
  }, [load]);

  const logout = async () => {
    try {
      await axios.post(
        "/api/auth/ban/logout",
        {},
        { headers: info?.csrf ? { "x-csrf": info.csrf } : {} },
      );
    } catch (_) {
      // Signing out of Firebase below still ends the sign-in.
    }
    try {
      await signOut(getAuth());
    } catch (_) {}
    window.location.assign("/welcome");
  };

  const submitAppeal = () => {
    setSubmitting(true);
    setSubmitError(null);
    axios
      .post(
        "/api/auth/ban/appeal",
        { appeal: appealText },
        { headers: { "x-csrf": info.csrf } },
      )
      .then(() => load())
      .catch((err) =>
        setSubmitError(
          (typeof err?.response?.data === "string" && err.response.data) ||
            "Could not send your appeal. Please try again.",
        ),
      )
      .finally(() => setSubmitting(false));
  };

  let body;
  if (loadError) {
    body = <Alert severity="error">{loadError}</Alert>;
  } else if (!info) {
    body = (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  } else if (!info.banned) {
    body = (
      <Stack spacing={2} alignItems="center">
        <Typography>
          {info.banEnded
            ? "Your site ban has ended. Sign in again to use the site."
            : "You are not signed in to a banned account."}
        </Typography>
        <Button variant="contained" href="/welcome">
          Go to the login page
        </Button>
      </Stack>
    );
  } else {
    const status = info.appeal?.status || "not_submitted";
    const trimmed = appealText.trim();
    const canSubmit =
      status === "not_submitted" &&
      trimmed.length >= MIN_APPEAL_LENGTH &&
      trimmed.length <= MAX_APPEAL_LENGTH &&
      !submitting;

    body = (
      <Stack spacing={2}>
        <Typography
          data-testid="ban-reason"
          sx={{ whiteSpace: "pre-wrap", fontWeight: 600, fontSize: "1.1rem" }}
        >
          Reason: {info.reason}
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 4 }}
        >
          {info.issuedAt && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Banned on
              </Typography>
              <Typography>{formatDate(info.issuedAt)}</Typography>
            </Box>
          )}
          <Box>
            <Typography variant="overline" color="text.secondary">
              Expires
            </Typography>
            <Typography>
              {info.permanent ? "Never (permanent)" : formatDate(info.expires)}
            </Typography>
          </Box>
          {info.username && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Account
              </Typography>
              <Typography>{info.username}</Typography>
            </Box>
          )}
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ fontWeight: 700, fontSize: "1.15rem" }}>
            Appeal status
          </Typography>
          <Chip
            data-testid="appeal-status"
            label={APPEAL_STATUS_LABELS[status] || status.toUpperCase()}
            color={APPEAL_STATUS_COLORS[status] || "default"}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
        <Alert severity="info">
          You can only appeal this ban <b>once</b>. Your appeal goes to every
          site admin. Explain clearly why the ban should be lifted.
        </Alert>
        <Typography color="text.secondary">
          {APPEAL_STATUS_TEXT[status]}
          {status === "pending" && info.votesRequired
            ? ` At least ${info.votesRequired} admins must agree to accept it.`
            : ""}
        </Typography>

        {status === "not_submitted" ? (
          <Stack spacing={1}>
            <TextField
              label="Your appeal"
              multiline
              minRows={4}
              value={appealText}
              onChange={(e) =>
                setAppealText(e.target.value.slice(0, MAX_APPEAL_LENGTH))
              }
              helperText={`${trimmed.length}/${MAX_APPEAL_LENGTH} (at least ${MIN_APPEAL_LENGTH} characters)`}
            />
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <Box>
              <Button
                variant="contained"
                color="primary"
                disabled={!canSubmit}
                onClick={submitAppeal}
              >
                {submitting ? "Sending..." : "Submit an appeal"}
              </Button>
            </Box>
          </Stack>
        ) : (
          info.appeal?.text && (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="overline" color="text.secondary">
                Your appeal
                {info.appeal.submittedAt
                  ? ` (sent ${formatDate(info.appeal.submittedAt)})`
                  : ""}
              </Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {info.appeal.text}
              </Typography>
            </Paper>
          )
        )}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "center",
        backgroundColor: "background.default",
        p: { xs: 1.5, sm: 3 },
      }}
    >
      <Paper
        elevation={4}
        sx={{ width: "100%", maxWidth: 640, p: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <img
            src={jailer}
            alt="Jailer"
            width={112}
            height={112}
            style={{ imageRendering: "pixelated" }}
          />
          <Typography
            variant="h3"
            component="h1"
            color="error"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              textAlign: "center",
              fontSize: { xs: "2rem", sm: "2.75rem" },
            }}
          >
            YOU ARE BANNED
          </Typography>
        </Stack>
        {body}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button variant="outlined" onClick={logout}>
            Log out
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
