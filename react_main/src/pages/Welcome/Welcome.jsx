import React, { useContext, useEffect, useState } from "react";
import { UiPageHeader } from "components/ui";
import { Container, Stack, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
import "css/main.css";
import { Auth } from "../../components/Auth";
import { getAuth, getRedirectResult, inMemoryPersistence } from "firebase/auth";
import axios from "axios";
import { collectFingerprint } from "../../utils/fingerprint";
import { useSnackbar } from "hooks/useSnackbar";
import { Loading } from "../../components/Loading";
import { UserContext } from "Contexts";

if (localStorage.getItem("firebase:debug") !== null) localStorage.removeItem("firebase:debug");
if (localStorage.getItem("showChatTab") !== null) localStorage.removeItem("showChatTab");

export const Welcome = () => {
  const user = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const snackbarHook = useSnackbar();

  useEffect(() => {
    const auth = getAuth();
    auth.setPersistence(inMemoryPersistence);
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const idToken = await auth.currentUser.getIdToken(true);
        const fingerprint = await collectFingerprint();
        axios
          .post("/api/auth", { idToken, fingerprint })
          .then(async () => { await user.refreshUser(); })
          .catch((err) => {
            if (err?.response?.status === 403 && err?.response?.data) {
              try {
                const data = typeof err.response.data === "string" ? JSON.parse(err.response.data) : err.response.data;
                if (data.siteBanned) {
                  window.location.assign(data.banPage || "/banned");
                  setIsLoading(false);
                  return;
                }
                if (data.deleted) {
                  snackbarHook.popUserDeleted();
                  setIsLoading(false);
                  return;
                }
                if (data.emailAliasInUse) {
                  snackbarHook.popSnackbar("An account already exists for this email address. Please log in with the original address instead of using a + alias.", "warning");
                  setIsLoading(false);
                  return;
                }
                if (data.signupBlocked) {
                  snackbarHook.popSignupBlocked();
                  setIsLoading(false);
                  return;
                }
              } catch (parseErr) {
                // Malformed server errors use the ordinary error presentation.
              }
            }
            snackbarHook.popUnexpectedError();
            setIsLoading(false);
          });
      } else setIsLoading(false);
    });
  }, []);

  if (user && user.loggedIn) return <Navigate to="/play" />;
  if (isLoading) return <Loading />;

  return <Container maxWidth="xs" disableGutters sx={{ py: { xs: 1, sm: 3 } }}>
    <Stack spacing={2}>
      <UiPageHeader title="Account" />
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Auth defaultTab={0} />
      </Paper>
      <Link className="ui-action ui-action--secondary" to="/play">Browse games</Link>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Link className="ui-action ui-action--ghost" to="/play/tutorial">Tutorial</Link>
        <Link className="ui-action ui-action--ghost" to="/policy/rules">Rules</Link>
      </Stack>
    </Stack>
  </Container>;
};

export default Welcome;
