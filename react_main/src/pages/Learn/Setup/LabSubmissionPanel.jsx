import React, { useState } from "react";
import axios from "axios";
import { Box, Button, Chip, Stack, Tooltip, Typography } from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { Lab as LabConsts } from "constants/Lab";

const {
  rankUpPlays: RANK_UP_PLAYS,
  graduatePlays: GRADUATE_PLAYS,
  poolTenureDays: POOL_TENURE_DAYS,
} = LabConsts;

function daysRemaining(approvedAtMs) {
  if (!approvedAtMs) return null;
  const elapsedMs = Date.now() - approvedAtMs;
  const remainingMs = POOL_TENURE_DAYS * 24 * 60 * 60 * 1000 - elapsedMs;
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

function StatusChip({ status }) {
  const map = {
    PENDING_APPROVAL: { label: "Pending Lab approval", color: "warning" },
    IN_POOL: { label: "In The Lab", color: "info" },
    GRADUATED: { label: "Graduated from The Lab", color: "success" },
    DISQUALIFIED: { label: "Disqualified from The Lab", color: "error" },
    EXPIRED: { label: "Expired from The Lab", color: "default" },
  };
  const meta = map[status];
  if (!meta) return null;
  return <Chip size="small" label={meta.label} color={meta.color} />;
}

export function LabSubmissionPanel({ setup, isSetupCreator, onSubmitted }) {
  const errorAlert = useErrorAlert();
  const [submitting, setSubmitting] = useState(false);

  if (!setup) return null;

  const status = setup.labStatus || "NOT_JOINED";
  const showsToPublic = status === "IN_POOL" || status === "GRADUATED";

  if (!isSetupCreator && !showsToPublic) return null;

  function onSubmit() {
    if (submitting) return;
    if (
      !window.confirm(
        "Submit this setup to The Lab? You can only have one setup pending or in the pool at a time, and a setup can only be submitted once."
      )
    )
      return;
    setSubmitting(true);
    axios
      .post("/api/lab/submit", { setupId: setup.id })
      .then(() => {
        if (onSubmitted) onSubmitted();
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  }

  const playsCount = setup.labPlaysCount || 0;
  const daysLeft = daysRemaining(
    setup.labApprovedAt ? new Date(setup.labApprovedAt).getTime() : null
  );

  return (
    <div className="box-panel">
      <div className="heading">The Lab</div>
      <div className="content">
        <Stack spacing={1}>
          <StatusChip status={status} />

          {status === "IN_POOL" && (
            <Box>
              <Typography variant="body2">
                {playsCount} / {GRADUATE_PLAYS} clean plays
                {playsCount >= RANK_UP_PLAYS && " — ranked ✓"}
                {daysLeft != null && ` — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
              </Typography>
              {playsCount < RANK_UP_PLAYS && (
                <Typography variant="caption" color="text.secondary">
                  {RANK_UP_PLAYS - playsCount} more clean play
                  {RANK_UP_PLAYS - playsCount === 1 ? "" : "s"} until ranked
                </Typography>
              )}
            </Box>
          )}

          {status === "DISQUALIFIED" && setup.labRejectionReason && (
            <Typography variant="caption" color="text.secondary">
              Reason: {setup.labRejectionReason}
            </Typography>
          )}

          {isSetupCreator && status === "NOT_JOINED" && setup.gameType === "Mafia" && (
            <Tooltip
              title={
                setup.closed
                  ? "Closed setups can't enter The Lab."
                  : "Submit this setup to be reviewed by mods. Approved setups get featured in daily challenges."
              }
            >
              <span>
                <Button
                  variant="contained"
                  size="small"
                  disabled={submitting || setup.closed}
                  onClick={onSubmit}
                >
                  Submit to The Lab
                </Button>
              </span>
            </Tooltip>
          )}
        </Stack>
      </div>
    </div>
  );
}

