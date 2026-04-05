import React, { useState, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { SiteInfoContext } from "Contexts";
import { StampItem } from "components/Scrapbook";
import { NameWithAvatar } from "pages/User/User";
import { useErrorAlert } from "components/Alerts";

function StickerPlaceholder({ size = 48 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        border: "1px dashed var(--scheme-color-border)",
        borderRadius: "2px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.5,
        flexShrink: 0,
      }}
    >
      ?
    </Box>
  );
}

function RespondDialog({ open, onClose, trade, stamps, lockedCountsByRoleKey, onResponded }) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [picked, setPicked] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Only offer stamps the user has duplicates of (available >= 2).
  const options = (stamps || [])
    .map((s) => {
      const key = `${s.gameType}:${s.role}`;
      const locked = lockedCountsByRoleKey?.[key] || 0;
      return { ...s, available: s.count - locked };
    })
    .filter((s) => s.available >= 2);

  function handleSubmit() {
    if (!picked || submitting) return;
    setSubmitting(true);
    axios
      .post("/api/stampTrades/respond", {
        tradeId: trade.id,
        gameType: picked.gameType,
        role: picked.role,
      })
      .then(() => {
        siteInfo.showAlert("Response sent.", "success");
        onResponded();
        onClose();
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Offer a duplicate sticker</DialogTitle>
      <DialogContent dividers>
        {options.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            You have no duplicate stickers to offer.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {options.map((s) => {
              const key = `${s.gameType}:${s.role}`;
              const isPicked =
                picked &&
                picked.gameType === s.gameType &&
                picked.role === s.role;
              return (
                <Box
                  key={key}
                  onClick={() => setPicked(s)}
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    border: isPicked
                      ? "2px solid var(--scheme-color)"
                      : "2px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <StampItem
                    role={s.role}
                    gameType={s.gameType}
                    count={s.count}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!picked || submitting}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PendingTradeConfirmations({
  trades = [],
  stamps = [],
  lockedCountsByRoleKey = {},
  onAction,
  panelStyle = {},
  headingStyle = {},
}) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [busyId, setBusyId] = useState(null);
  const [respondTrade, setRespondTrade] = useState(null);

  if (!trades.length) return null;

  function handleConfirm(tradeId) {
    if (busyId) return;
    setBusyId(tradeId);
    axios
      .post("/api/stampTrades/confirm", { tradeId })
      .then(() => {
        siteInfo.showAlert("Trade completed.", "success");
        if (onAction) onAction();
      })
      .catch(errorAlert)
      .finally(() => setBusyId(null));
  }

  function handleReject(tradeId) {
    if (busyId) return;
    setBusyId(tradeId);
    axios
      .post("/api/stampTrades/reject", { tradeId })
      .then(() => {
        siteInfo.showAlert("Trade removed.", "success");
        if (onAction) onAction();
      })
      .catch(errorAlert)
      .finally(() => setBusyId(null));
  }

  function renderActions(t) {
    // PENDING_RESPONSE
    if (t.status === "PENDING_RESPONSE") {
      if (t.isInitiator) {
        // you initiated, waiting on them
        return (
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            disabled={busyId === t.id}
            onClick={() => handleReject(t.id)}
          >
            Cancel
          </Button>
        );
      }
      // they initiated, you need to respond
      return (
        <>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            disabled={busyId === t.id}
            onClick={() => handleReject(t.id)}
          >
            Reject
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            disabled={busyId === t.id}
            onClick={() => setRespondTrade(t)}
          >
            Respond
          </Button>
        </>
      );
    }
    // PENDING_CONFIRMATION
    if (t.isInitiator) {
      // they responded, you confirm
      return (
        <>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            disabled={busyId === t.id}
            onClick={() => handleReject(t.id)}
          >
            Reject
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            disabled={busyId === t.id}
            onClick={() => handleConfirm(t.id)}
          >
            Confirm
          </Button>
        </>
      );
    }
    // you responded, waiting on them
    return (
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        disabled={busyId === t.id}
        onClick={() => handleReject(t.id)}
      >
        Cancel
      </Button>
    );
  }

  return (
    <div className="box-panel" style={panelStyle}>
      <Typography variant="h3" style={headingStyle}>
        Pending Trades
      </Typography>
      <div className="content" style={{ padding: "8px" }}>
        <Stack spacing={1}>
          {trades.map((t) => {
            // Your sticker / their sticker from your perspective.
            const yourRole = t.isInitiator ? t.initiatorRole : t.recipientRole;
            const yourGameType = t.isInitiator
              ? t.initiatorGameType
              : t.recipientGameType;
            const theirRole = t.isInitiator ? t.recipientRole : t.initiatorRole;
            const theirGameType = t.isInitiator
              ? t.recipientGameType
              : t.initiatorGameType;
            return (
              <Box
                key={t.id}
                sx={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.75,
                  p: 1,
                  border: "1px solid var(--scheme-color-border)",
                  borderRadius: 1,
                  minWidth: 0,
                  maxWidth: "100%",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 8,
                    maxWidth: "60%",
                    "& .user-name .MuiTypography-root": { fontSize: "0.7rem" },
                    "& .user-name": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <NameWithAvatar
                    id={t.other?.id}
                    name={t.other?.name}
                    avatar={t.other?.avatar}
                    small
                  />
                </Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ justifyContent: "center", mt: 2.5 }}
                >
                  {yourRole && yourGameType ? (
                    <StampItem role={yourRole} gameType={yourGameType} />
                  ) : (
                    <StickerPlaceholder />
                  )}
                  <i
                    className="fas fa-exchange-alt"
                    style={{ fontSize: 12, opacity: 0.6 }}
                  />
                  {theirRole && theirGameType ? (
                    <StampItem role={theirRole} gameType={theirGameType} />
                  ) : (
                    <StickerPlaceholder />
                  )}
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "flex-end" }}
                >
                  {renderActions(t)}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </div>
      <RespondDialog
        open={!!respondTrade}
        onClose={() => setRespondTrade(null)}
        trade={respondTrade || {}}
        stamps={stamps}
        lockedCountsByRoleKey={lockedCountsByRoleKey}
        onResponded={() => {
          if (onAction) onAction();
        }}
      />
    </div>
  );
}
