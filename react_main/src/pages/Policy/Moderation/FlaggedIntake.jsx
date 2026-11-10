import React, { useState, useEffect, useContext, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Stack,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/UserWidgets";
import { Time } from "components/Basic";
import { PageNav } from "components/Nav";
import { UiAction, UiDialog, UiPending } from "components/ui";
import { LatestRequest } from "../../../lib/latestRequest";

export default function FlaggedIntake() {
  const { user } = useOutletContext() || {};
  const currentUser = useContext(UserContext);
  const activeUser = user || currentUser;

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  const [actionError, setActionError] = useState("");
  const [loadError, setLoadError] = useState("");
  const requests = useRef(new LatestRequest());
  const lastQuery = useRef({ page: 1, query: "" });

  const errorAlert = useErrorAlert();

  const canWhitelist = activeUser?.perms?.whitelist;

  useEffect(() => {
    loadFlaggedUsers(1);
    return () => requests.current.invalidate();
  }, []);

  function loadFlaggedUsers(targetPage, query = "") {
    const request = requests.current.begin();
    lastQuery.current = { page: targetPage, query };
    setLoading(true);
    setLoadError("");

    axios
      .get(`/api/user/flagged${query}`, { signal: request.signal })
      .then((res) => {
        if (!request.isCurrent()) return;
        if (res.data.length > 0 || targetPage === 1) {
          setUsers(res.data);
          setPage(targetPage);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!request.isCurrent()) return;
        setLoadError("Could not load flagged users. Please try again.");
        setLoading(false);
      });
  }

  function onPageNav(newPage) {
    if (newPage === page || loading) return;

    if (newPage > page && users.length > 0) {
      const lastJoined = users[users.length - 1]?.joined;
      loadFlaggedUsers(newPage, `?last=${encodeURIComponent(lastJoined)}`);
    } else if (newPage < page && users.length > 0) {
      const firstJoined = users[0]?.joined;
      loadFlaggedUsers(newPage, `?first=${encodeURIComponent(firstJoined)}`);
    }
  }

  function onWhitelist(userId) {
    if (!canWhitelist) return;

    setActionLoading((prev) => ({ ...prev, [userId]: "whitelist" }));

    axios
      .post("/api/mod/whitelist", { userId })
      .then(() => {
        setConfirmation(null);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      })
      .catch((e) => {
        setActionError("Could not approve this user. Please try again.");
        errorAlert(e);
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      });
  }

  function onBlacklist(userId) {
    if (!canWhitelist) return;

    setActionLoading((prev) => ({ ...prev, [userId]: "blacklist" }));

    axios
      .post("/api/mod/blacklist", { userId })
      .then(() => {
        setConfirmation(null);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      })
      .catch((e) => {
        setActionError("Could not ban this user. Please try again.");
        errorAlert(e);
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      });
  }

  const userRows = users.map((flaggedUser) => {
    const isProcessing = actionLoading[flaggedUser.id];

    return (
      <Box
        key={flaggedUser.id}
        className="flagged-intake-row"
        sx={{ py: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Stack direction="column" spacing={0.5} sx={{ minWidth: 0, flexGrow: 1, "& .user-name": { whiteSpace: "normal", overflowWrap: "anywhere" } }}>
            <Box sx={{ minWidth: 0 }}>
              <NameWithAvatar
                id={flaggedUser.id}
                name={flaggedUser.name}
                avatar={flaggedUser.avatar}
              />
            </Box>
            <Stack direction="column" spacing={0.5}>
              <Typography variant="caption" color="textSecondary">
                Joined: {new Date(flaggedUser.joined).toLocaleDateString()}
                {" ("}
                <Time minSec millisec={Date.now() - flaggedUser.joined} suffix=" ago" />
                {")"}
              </Typography>
            </Stack>
          </Stack>

          {canWhitelist && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              <UiAction disabled={!!isProcessing} onClick={() => { setActionError(""); setConfirmation({ type: "approve", user: flaggedUser }); }}>Approve user</UiAction>
              <UiAction variant="danger" disabled={!!isProcessing} onClick={() => { setActionError(""); setConfirmation({ type: "ban", user: flaggedUser }); }}>Ban user</UiAction>
            </Stack>
          )}
        </Box>
      </Box>
    );
  });

  return (
    <Box className="flagged-intake">
      <header className="moderation-section-heading">
        <h2>Flagged intake</h2>
        <p>Review flagged accounts and decide whether to approve them or permanently ban them.</p>
      </header>

      <PageNav page={page} onNav={onPageNav} inverted />
      {loading && <UiPending label="Loading flagged users" />}
      {loadError && <div role="alert"><p>{loadError}</p><UiAction onClick={() => loadFlaggedUsers(lastQuery.current.page, lastQuery.current.query)}>Retry</UiAction></div>}
      <UiDialog open={!!confirmation} title={confirmation?.type === "ban" ? "Permanently ban user?" : "Approve user?"}
        onClose={confirmation && actionLoading[confirmation.user.id] ? undefined : () => setConfirmation(null)}
        actions={<><UiAction disabled={!!(confirmation && actionLoading[confirmation.user.id])} onClick={() => setConfirmation(null)}>Cancel</UiAction><UiAction variant={confirmation?.type === "ban" ? "danger" : "primary"} busy={!!(confirmation && actionLoading[confirmation.user.id])} onClick={() => {
          if (!confirmation || actionLoading[confirmation.user.id]) return;
          setActionError("");
          if (confirmation.type === "ban") onBlacklist(confirmation.user.id);
          else onWhitelist(confirmation.user.id);
        }}>{confirmation?.type === "ban" ? "Permanently ban user" : "Approve user"}</UiAction></>}>
        <p>{confirmation?.type === "ban" ? `Permanently ban ${confirmation?.user.name} and their IP address?` : `Approve ${confirmation?.user.name} and remove them from flagged intake?`}</p>
        {actionError && <p role="alert">{actionError}</p>}
      </UiDialog>

      {!loading && !loadError && users.length === 0 ? (
        <Typography variant="body1" sx={{ py: 2, textAlign: "center" }}>
          No flagged users to review.
        </Typography>
      ) : (
        <Box sx={{ my: 1 }}>{userRows}</Box>
      )}

      <PageNav page={page} onNav={onPageNav} inverted />
    </Box>
  );
}
