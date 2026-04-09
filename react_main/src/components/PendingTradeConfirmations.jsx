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
  IconButton,
  Tooltip,
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
    const reject = (
      <Tooltip title="Cancel" arrow>
        <IconButton
          size="small"
          disabled={busyId === t.id}
          onClick={() => handleReject(t.id)}
          sx={{ opacity: 0.6 }}
        >
          <i className="fas fa-times" />
        </IconButton>
      </Tooltip>
    );
    // PENDING_RESPONSE
    if (t.status === "PENDING_RESPONSE") {
      if (t.isInitiator) {
        return reject;
      }
      return (
        <>
          {reject}
          <Tooltip title="Respond" arrow>
            <IconButton
              size="small"
              disabled={busyId === t.id}
              onClick={() => setRespondTrade(t)}
              color="primary"
            >
              <i className="fas fa-sync-alt" />
            </IconButton>
          </Tooltip>
        </>
      );
    }
    // PENDING_CONFIRMATION
    // waitingOnYou indicates this user should confirm (initiator for normal
    // trades, recipient for auto-responded profile trades).
    if (t.waitingOnYou) {
      return (
        <>
          {reject}
          <Tooltip title="Confirm" arrow>
            <IconButton
              size="small"
              disabled={busyId === t.id}
              onClick={() => handleConfirm(t.id)}
              color="primary"
            >
              <i className="fas fa-check" />
            </IconButton>
          </Tooltip>
        </>
      );
    }
    return reject;
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
            const yourRole = t.isInitiator
              ? t.initiatorRole
              : t.recipientRole;
            const yourGameType = t.isInitiator
              ? t.initiatorGameType
              : t.recipientGameType;
            const theirRole = t.isInitiator
              ? t.recipientRole
              : t.initiatorRole;
            const theirGameType = t.isInitiator
              ? t.recipientGameType
              : t.initiatorGameType;
            return (
              <Box
                key={t.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 32px auto 32px 56px",
                  alignItems: "center",
                  columnGap: 0.75,
                  p: 0.5,
                  border: "1px solid var(--scheme-color-border)",
                  borderRadius: 1,
                  minWidth: 0,
                  fontSize: "0.75rem",
                  "& .user-name .MuiTypography-root": { fontSize: "0.75rem" },
                }}
              >
                <Box sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", justifySelf: "start" }}>
                  {t.other ? (
                    <NameWithAvatar
                      id={t.other.id}
                      name={t.other.name}
                      avatar={t.other.avatar}
                      small
                    />
                  ) : (
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>
                      Public
                    </Typography>
                  )}
                </Box>
                {yourRole && yourGameType ? (
                  <StampItem role={yourRole} gameType={yourGameType} size="small" />
                ) : (
                  <StickerPlaceholder size={32} />
                )}
                <i
                  className="fas fa-exchange-alt"
                  style={{ fontSize: 10, opacity: 0.6, justifySelf: "center" }}
                />
                {theirRole && theirGameType ? (
                  <StampItem role={theirRole} gameType={theirGameType} size="small" />
                ) : (
                  <StickerPlaceholder size={32} />
                )}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  {renderActions(t)}
                </Box>
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
