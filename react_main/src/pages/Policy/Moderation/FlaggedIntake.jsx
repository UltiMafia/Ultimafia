import React, { useState, useEffect, useContext } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";
import { Time } from "components/Basic";
import { PageNav } from "components/Nav";
import { Loading } from "components/Loading";

export default function FlaggedIntake() {
  const { user } = useOutletContext() || {};
  const currentUser = useContext(UserContext);
  const activeUser = user || currentUser;

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const errorAlert = useErrorAlert();

  const canWhitelist = activeUser?.perms?.whitelist;

  useEffect(() => {
    loadFlaggedUsers(1);
  }, []);

  function loadFlaggedUsers(targetPage) {
    setLoading(true);

    const params = targetPage === 1 ? "" : `?last=${users[users.length - 1]?.joined || ""}`;

    axios
      .get(`/api/user/flagged${params}`)
      .then((res) => {
        if (res.data.length > 0 || targetPage === 1) {
          setUsers(res.data);
          setPage(targetPage);
        }
        setLoading(false);
      })
      .catch((e) => {
        errorAlert(e);
        setLoading(false);
      });
  }

  function onPageNav(newPage) {
    if (newPage === page) return;

    if (newPage > page && users.length > 0) {
      const lastJoined = users[users.length - 1]?.joined;
      axios
        .get(`/api/user/flagged?last=${lastJoined}`)
        .then((res) => {
          if (res.data.length > 0) {
            setUsers(res.data);
            setPage(newPage);
          }
        })
        .catch(errorAlert);
    } else if (newPage < page && users.length > 0) {
      const firstJoined = users[0]?.joined;
      axios
        .get(`/api/user/flagged?first=${firstJoined}`)
        .then((res) => {
          if (res.data.length > 0) {
            setUsers(res.data);
            setPage(newPage);
          }
        })
        .catch(errorAlert);
    }
  }

  function onWhitelist(userId) {
    if (!canWhitelist) return;

    setActionLoading((prev) => ({ ...prev, [userId]: "whitelist" }));

    axios
      .post("/api/mod/whitelist", { userId })
      .then(() => {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      })
      .catch((e) => {
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
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      })
      .catch((e) => {
        errorAlert(e);
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      });
  }

  if (loading && users.length === 0) {
    return <Loading small />;
  }

  const userRows = users.map((flaggedUser) => {
    const isProcessing = actionLoading[flaggedUser.id];

    return (
      <Card
        key={flaggedUser.id}
        variant="outlined"
        sx={{ mb: 1 }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
            "&:last-child": { pb: 1.5 },
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexGrow: 1 }}>
            <Box sx={{ minWidth: 150 }}>
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
            <Stack direction="row" spacing={1}>
              <Tooltip title="Whitelist (approve user)">
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => onWhitelist(flaggedUser.id)}
                    disabled={!!isProcessing}
                    sx={{
                      border: "1px solid",
                      borderColor: "success.main",
                      "&:hover": {
                        backgroundColor: "success.main",
                        color: "white",
                      },
                    }}
                  >
                    <i
                      className={isProcessing === "whitelist" ? "fas fa-spinner fa-spin" : "fas fa-check"}
                    />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Blacklist (permanent IP ban)">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onBlacklist(flaggedUser.id)}
                    disabled={!!isProcessing}
                    sx={{
                      border: "1px solid",
                      borderColor: "error.main",
                      "&:hover": {
                        backgroundColor: "error.main",
                        color: "white",
                      },
                    }}
                  >
                    <i
                      className={isProcessing === "blacklist" ? "fas fa-spinner fa-spin" : "fas fa-times"}
                    />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  });

  return (
    <Box className="flagged-intake">
      <Typography variant="h4" sx={{ mb: 2 }}>
        Flagged User Intake
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Review flagged users and decide whether to whitelist (approve) or blacklist (permanently ban) them.
      </Typography>

      <PageNav page={page} onNav={onPageNav} inverted />

      {users.length === 0 ? (
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
