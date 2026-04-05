import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography, Stack } from "@mui/material";

import { StampItem } from "components/Scrapbook";
import { NameWithAvatar } from "pages/User/User";

export default function RecentTradesFeed() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      axios
        .get("/api/stampTrades/recent")
        .then((res) => {
          if (!cancelled) setTrades(Array.isArray(res.data) ? res.data : []);
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
      <Typography variant="h3" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <i className="fas fa-stamp" style={{ fontSize: "0.9em", opacity: 0.8 }} />
        Stamp Exchange
      </Typography>
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
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: 1,
                  fontSize: "0.75rem",
                  "& .user-name .MuiTypography-root": { fontSize: "0.75rem" },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
                  <NameWithAvatar
                    id={t.initiator?.id}
                    name={t.initiator?.name}
                    avatar={t.initiator?.avatar}
                    small
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <StampItem
                    role={t.initiatorRole}
                    gameType={t.initiatorGameType}
                    size="small"
                  />
                  <i
                    className="fas fa-exchange-alt"
                    style={{ fontSize: 10, opacity: 0.6 }}
                  />
                  <StampItem
                    role={t.recipientRole}
                    gameType={t.recipientGameType}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-start", minWidth: 0 }}>
                  <NameWithAvatar
                    id={t.recipient?.id}
                    name={t.recipient?.name}
                    avatar={t.recipient?.avatar}
                    small
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </div>
    </div>
  );
}
