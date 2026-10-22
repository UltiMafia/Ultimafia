import React, { useState, useEffect, useContext } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/UserWidgets";
import { Time } from "components/Basic";
import { Loading } from "components/Loading";

const decisionButtons = [
  { decision: "approved", title: "Approve", icon: "fa-check", color: "success" },
  { decision: "rejected", title: "Reject", icon: "fa-times", color: "error" },
];

export default function GithubLinks() {
  const { user } = useOutletContext() || {};
  const currentUser = useContext(UserContext);
  const activeUser = user || currentUser;
  const canReview = activeUser?.perms?.approveGithubLinks;

  const [status, setStatus] = useState("pending");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const errorAlert = useErrorAlert();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/mod/githubLinks?status=${status}`)
      .then((res) => setLinks(res.data))
      .catch(errorAlert)
      .finally(() => setLoading(false));
  }, [status]);

  function onReview(userId, decision) {
    setActionLoading((prev) => ({ ...prev, [userId]: decision }));
    axios
      .post("/api/mod/githubLinks", { userId, decision })
      .then(() => setLinks((prev) => prev.filter((l) => l.id !== userId)))
      .catch(errorAlert)
      .finally(() =>
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        })
      );
  }

  const rows = links.map((link) => {
    const processing = actionLoading[link.id];
    const decisions = decisionButtons.filter((b) => b.decision !== status);

    return (
      <Card key={link.id} variant="outlined" sx={{ mb: 1 }}>
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
              <NameWithAvatar id={link.id} name={link.name} avatar={link.avatar} />
            </Box>
            <Stack direction="column" spacing={0.5}>
              <Link
                href={`https://github.com/${link.github.username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{link.github.username}
              </Link>
              {link.github.requestedAt && (
                <Typography variant="caption" color="textSecondary">
                  Requested{" "}
                  <Time minSec millisec={Date.now() - link.github.requestedAt} suffix=" ago" />
                </Typography>
              )}
            </Stack>
          </Stack>

          {canReview && (
            <Stack direction="row" spacing={1}>
              {decisions.map((button) => (
                <Tooltip title={button.title} key={button.decision}>
                  <span>
                    <IconButton
                      size="small"
                      color={button.color}
                      onClick={() => onReview(link.id, button.decision)}
                      disabled={!!processing}
                      sx={{
                        border: "1px solid",
                        borderColor: `${button.color}.main`,
                        "&:hover": {
                          backgroundColor: `${button.color}.main`,
                          color: "white",
                        },
                      }}
                    >
                      <i
                        className={
                          processing === button.decision
                            ? "fas fa-spinner fa-spin"
                            : `fas ${button.icon}`
                        }
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  });

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        GitHub Links
      </Typography>
      <Tabs value={status} onChange={(_, value) => setStatus(value)} sx={{ mb: 2 }}>
        <Tab label="Pending" value="pending" />
        <Tab label="Approved" value="approved" />
        <Tab label="Rejected" value="rejected" />
      </Tabs>
      {loading ? (
        <Loading small />
      ) : rows.length > 0 ? (
        rows
      ) : (
        <Typography color="textSecondary">No {status} GitHub links.</Typography>
      )}
    </Box>
  );
}
