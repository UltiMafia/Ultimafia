import React, { useState, useContext } from "react";
import axios from "axios";
import { Box, Typography, Button, Stack } from "@mui/material";

import { SiteInfoContext } from "Contexts";
import { RoleCount } from "components/Roles";
import { NameWithAvatar } from "pages/User/User";
import { useErrorAlert } from "components/Alerts";

export default function PendingTradeConfirmations({
  trades = [],
  onAction,
  panelStyle = {},
  headingStyle = {},
}) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [busyId, setBusyId] = useState(null);

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
        siteInfo.showAlert("Trade rejected.", "success");
        if (onAction) onAction();
      })
      .catch(errorAlert)
      .finally(() => setBusyId(null));
  }

  return (
    <div className="box-panel" style={panelStyle}>
      <Typography variant="h3" style={headingStyle}>
        Pending Trades
      </Typography>
      <div className="content" style={{ padding: "8px" }}>
        <Stack spacing={1}>
          {trades.map((t) => (
            <Box
              key={t.id}
              className="pending-trade-card"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
                p: 1,
                border: "1px solid var(--scheme-color-border)",
                borderRadius: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 240 }}>
                <NameWithAvatar
                  id={t.other?.id}
                  name={t.other?.name}
                  avatar={t.other?.avatar}
                  small
                />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  offers
                </Typography>
                <RoleCount
                  role={t.recipientRole}
                  gameType={t.recipientGameType}
                  small
                  showPopover={false}
                />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  for your
                </Typography>
                <RoleCount
                  role={t.initiatorRole}
                  gameType={t.initiatorGameType}
                  small
                  showPopover={false}
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  disabled={busyId === t.id}
                  onClick={() => handleConfirm(t.id)}
                >
                  Confirm
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  disabled={busyId === t.id}
                  onClick={() => handleReject(t.id)}
                >
                  Reject
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </div>
    </div>
  );
}
