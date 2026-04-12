import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import { UserContext, SiteInfoContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { StampItem } from "components/Scrapbook";
import { NameWithAvatar } from "pages/User/User";

function StickerPlaceholder({ size = 32, onClick }) {
  return (
    <Box
      onClick={onClick}
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
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { opacity: 0.8, borderColor: "primary.main" } : {},
      }}
    >
      ?
    </Box>
  );
}

export default function RecentTradesFeed() {
  const [trades, setTrades] = useState([]);
  const [openTrades, setOpenTrades] = useState([]);
  const [respondingTo, setRespondingTo] = useState(null);
  const [userStamps, setUserStamps] = useState([]);
  const [loadingStamps, setLoadingStamps] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState(null);
  const [stampPage, setStampPage] = useState(0);
  const STAMPS_PER_PAGE = 20;

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  function loadOpenTrades() {
    axios
      .get("/api/stampTrades/open")
      .then((res) => setOpenTrades(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }

  useEffect(() => {
    let cancelled = false;
    function loadRecent() {
      axios
        .get("/api/stampTrades/recent")
        .then((res) => {
          if (!cancelled) setTrades(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => {});
    }
    function loadOpen() {
      axios
        .get("/api/stampTrades/open")
        .then((res) => {
          if (!cancelled) setOpenTrades(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => {});
    }
    loadRecent();
    loadOpen();
    const interval = setInterval(() => {
      loadRecent();
      loadOpen();
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function openRespondDialog(trade) {
    setRespondingTo(trade);
    setSelectedStamp(null);
    setStampPage(0);
    setLoadingStamps(true);

    if (user.loggedIn && user.id) {
      axios
        .get(`/api/user/${user.id}/profile`)
        .then((res) => {
          const stamps = res.data?.stamps || [];
          setUserStamps(stamps.filter((s) => s.count >= 2));
        })
        .catch(() => setUserStamps([]))
        .finally(() => setLoadingStamps(false));
    } else {
      setLoadingStamps(false);
    }
  }

  function closeDialog() {
    setRespondingTo(null);
    setSelectedStamp(null);
    setUserStamps([]);
  }

  function handleConfirm() {
    if (!respondingTo || !selectedStamp) return;
    axios
      .post("/api/stampTrades/respond", {
        tradeId: respondingTo.id,
        gameType: selectedStamp.gameType,
        role: selectedStamp.role,
      })
      .then(() => {
        closeDialog();
        loadOpenTrades();
        siteInfo.showAlert("Trade response sent!", "success");
      })
      .catch(errorAlert);
  }

  return (
    <div className="box-panel">
      <Typography variant="h3" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <i className="fas fa-stamp" style={{ fontSize: "0.9em", opacity: 0.8 }} />
        Stamp Exchange
      </Typography>
      <div className="content" style={{ padding: "8px" }}>
        {openTrades.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 0.5, opacity: 0.7 }}>
              Open Trades
            </Typography>
            <Stack spacing={0.75} sx={{ mb: 1.5 }}>
              {openTrades.map((t) => {
                const isOwnOffer = user.loggedIn && t.initiator?.id === user.id;
                return (
                  <Box
                    key={t.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      fontSize: "0.75rem",
                      opacity: isOwnOffer ? 0.75 : 1,
                      "& .user-name .MuiTypography-root": { fontSize: "0.75rem" },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <NameWithAvatar
                        id={t.initiator?.id}
                        name={t.initiator?.name}
                        avatar={t.initiator?.avatar}
                        small
                      />
                    </Box>
                    <StampItem
                      role={t.initiatorRole}
                      gameType={t.initiatorGameType}
                      size="small"
                    />
                    <i
                      className="fas fa-exchange-alt"
                      style={{ fontSize: 10, opacity: 0.6 }}
                    />
                    <StickerPlaceholder
                      onClick={
                        user.loggedIn && !isOwnOffer
                          ? () => openRespondDialog(t)
                          : undefined
                      }
                    />
                  </Box>
                );
              })}
            </Stack>
          </>
        )}

        {trades.length === 0 && openTrades.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No trades yet.
          </Typography>
        ) : trades.length > 0 && (
          <>
            {openTrades.length > 0 && (
              <Typography variant="subtitle2" sx={{ mb: 0.5, opacity: 0.7 }}>
                Recent
              </Typography>
            )}
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
          </>
        )}
      </div>

      <Dialog open={!!respondingTo} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="body1">Offer a sticker for</Typography>
            <NameWithAvatar
              id={respondingTo?.initiator?.id}
              name={respondingTo?.initiator?.name}
              avatar={respondingTo?.initiator?.avatar}
              small
            />
            <Typography variant="body1">'s</Typography>
            <StampItem
              role={respondingTo?.initiatorRole}
              gameType={respondingTo?.initiatorGameType}
              size="small"
            />
            <Typography variant="body1">{respondingTo?.initiatorRole}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {loadingStamps ? (
            <Typography variant="body2" color="textSecondary">
              Loading...
            </Typography>
          ) : userStamps.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              You have no duplicate stickers to offer.
            </Typography>
          ) : (
            <>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {userStamps
                  .slice(stampPage * STAMPS_PER_PAGE, (stampPage + 1) * STAMPS_PER_PAGE)
                  .map((s) => {
                    const key = `${s.gameType}:${s.role}`;
                    const isPicked =
                      selectedStamp?.role === s.role &&
                      selectedStamp?.gameType === s.gameType;
                    return (
                      <Box
                        key={key}
                        onClick={() => setSelectedStamp(s)}
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
              {userStamps.length > STAMPS_PER_PAGE && (
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    disabled={stampPage === 0}
                    onClick={() => setStampPage(stampPage - 1)}
                  >
                    <i className="fas fa-chevron-left" />
                  </Button>
                  <Typography variant="caption">
                    {stampPage + 1} / {Math.ceil(userStamps.length / STAMPS_PER_PAGE)}
                  </Typography>
                  <Button
                    size="small"
                    disabled={(stampPage + 1) * STAMPS_PER_PAGE >= userStamps.length}
                    onClick={() => setStampPage(stampPage + 1)}
                  >
                    <i className="fas fa-chevron-right" />
                  </Button>
                </Stack>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={!selectedStamp}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
