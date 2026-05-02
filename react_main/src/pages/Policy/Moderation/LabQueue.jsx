import React, { useContext, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";
import { Time } from "components/Basic";
import { Loading } from "components/Loading";

export default function LabQueue() {
  const { user } = useOutletContext() || {};
  const currentUser = useContext(UserContext);
  const activeUser = user || currentUser;

  const [setups, setSetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const errorAlert = useErrorAlert();
  const canManage = activeUser?.perms?.manageLab;

  useEffect(() => {
    if (!canManage) return;
    setLoading(true);
    axios
      .get("/api/lab/queue")
      .then((res) => setSetups(res.data.setups || []))
      .catch(errorAlert)
      .finally(() => setLoading(false));
  }, [canManage]);

  function setBusy(id, kind) {
    setActionLoading((prev) => ({ ...prev, [id]: kind }));
  }
  function clearBusy(id) {
    setActionLoading((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function onApprove(setupId) {
    setBusy(setupId, "approve");
    axios
      .post("/api/lab/approve", { setupId })
      .then(() => setSetups((prev) => prev.filter((s) => s.id !== setupId)))
      .catch(errorAlert)
      .finally(() => clearBusy(setupId));
  }

  function onConfirmReject(setupId) {
    setBusy(setupId, "reject");
    axios
      .post("/api/lab/reject", { setupId, reason: rejectReason })
      .then(() => {
        setSetups((prev) => prev.filter((s) => s.id !== setupId));
        setRejectingId(null);
        setRejectReason("");
      })
      .catch(errorAlert)
      .finally(() => clearBusy(setupId));
  }

  if (!canManage) {
    return (
      <Typography variant="body1" sx={{ py: 2 }}>
        You do not have permission to manage The Lab.
      </Typography>
    );
  }

  if (loading && setups.length === 0) {
    return <Loading small />;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        The Lab — Approval Queue
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Review setups submitted to The Lab. Approved setups enter the
        pool, get featured in daily challenges, auto-rank at 10 clean
        plays, and graduate at 30.
      </Typography>

      {setups.length === 0 ? (
        <Typography variant="body1" sx={{ py: 2, textAlign: "center" }}>
          No setups awaiting Lab approval.
        </Typography>
      ) : (
        setups.map((setup) => {
          const isProcessing = actionLoading[setup.id];
          const isRejecting = rejectingId === setup.id;
          return (
            <Card key={setup.id} variant="outlined" sx={{ mb: 1 }}>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  py: 1.5,
                  "&:last-child": { pb: 1.5 },
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Typography
                      component="a"
                      href={`/learn/setup/${setup.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="subtitle1"
                      sx={{ fontWeight: 500 }}
                    >
                      {setup.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {setup.gameType} · {setup.total} players
                    </Typography>
                    {setup.creator && (
                      <NameWithAvatar
                        id={setup.creator.id}
                        name={setup.creator.name}
                        avatar={setup.creator.avatar}
                      />
                    )}
                    <Typography variant="caption" color="textSecondary">
                      Submitted{" "}
                      <Time
                        minSec
                        millisec={
                          Date.now() - new Date(setup.labSubmittedAt).getTime()
                        }
                        suffix=" ago"
                      />
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Approve — admit to the pool">
                      <span>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={!!isProcessing || isRejecting}
                          onClick={() => onApprove(setup.id)}
                          sx={{ border: "1px solid", borderColor: "success.main" }}
                        >
                          <i
                            className={
                              isProcessing === "approve"
                                ? "fas fa-spinner fa-spin"
                                : "fas fa-check"
                            }
                          />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Reject — disqualify with a reason">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={!!isProcessing}
                          onClick={() => {
                            setRejectingId(isRejecting ? null : setup.id);
                            setRejectReason("");
                          }}
                          sx={{ border: "1px solid", borderColor: "error.main" }}
                        >
                          <i className="fas fa-times" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>

                {setup.description && (
                  <Typography variant="body2" color="textSecondary">
                    {setup.description}
                  </Typography>
                )}

                {isRejecting && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Reason for rejection (shown to the creator)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      disabled={!!isProcessing || !rejectReason.trim()}
                      onClick={() => onConfirmReject(setup.id)}
                    >
                      Confirm reject
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );
}
