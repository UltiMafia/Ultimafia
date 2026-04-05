import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography, Stack } from "@mui/material";

import { RoleCount } from "components/Roles";
import { NameWithAvatar } from "pages/User/User";

export default function RecentTradesFeed() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      axios
        .get("/api/stampTrades/recent")
        .then((res) => {
          if (!cancelled) setTrades(res.data || []);
        })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="box-panel">
      <Typography variant="h3">Recent Trades</Typography>
      <div className="content" style={{ padding: "8px" }}>
        {trades.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No trades yet.
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {trades.map((t) => (
              <Box
                key={t.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexWrap: "wrap",
                  fontSize: "0.85rem",
                }}
              >
                <NameWithAvatar
                  id={t.initiator?.id}
                  name={t.initiator?.name}
                  avatar={t.initiator?.avatar}
                  small
                />
                <RoleCount
                  role={t.initiatorRole}
                  gameType={t.initiatorGameType}
                  small
                  showPopover={false}
                />
                <i
                  className="fas fa-exchange-alt"
                  style={{ fontSize: 11, opacity: 0.6 }}
                />
                <RoleCount
                  role={t.recipientRole}
                  gameType={t.recipientGameType}
                  small
                  showPopover={false}
                />
                <NameWithAvatar
                  id={t.recipient?.id}
                  name={t.recipient?.name}
                  avatar={t.recipient?.avatar}
                  small
                />
              </Box>
            ))}
          </Stack>
        )}
      </div>
    </div>
  );
}
