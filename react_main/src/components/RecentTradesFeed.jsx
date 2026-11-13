import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Stack,
} from "@mui/material";

import { UserContext, SiteInfoContext } from "Contexts";
import { StampItem } from "components/Scrapbook";
import { NameWithAvatar } from "pages/User/UserWidgets";
import { useViewActive } from "../hooks/useViewActivity";
import { UiAction, UiDialog, UiIcon, UiPending } from "./ui";
import LobbySidebarPanel from "pages/Play/LobbyBrowser/LobbySidebarPanel";
import { LatestRequest } from "../lib/latestRequest";

function StickerPlaceholder({ size = 32, onClick }) {
  return (
    <Box
      component={onClick ? "button" : "span"}
      {...(onClick ? { type: "button", "aria-label": "Offer a duplicate stamp" } : {})}
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
  const [sending, setSending] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [feedError, setFeedError] = useState(false);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const stampRequests = useRef(new LatestRequest());
  const STAMPS_PER_PAGE = 20;

  const user = useContext(UserContext);
  const active = useViewActive();
  const siteInfo = useContext(SiteInfoContext);
  useEffect(() => () => stampRequests.current.invalidate(), []);

  function loadOpenTrades() {
    setRefresh(value => value + 1);
  }

  useEffect(() => {
    if (!active || !user.loggedIn) return;
    let cancelled = false;
    async function loadTrades() {
      const [recent, open] = await Promise.allSettled([axios.get("/api/stampTrades/recent"), axios.get("/api/stampTrades/open")]);
      if (cancelled) return;
      if (recent.status === "fulfilled") setTrades(Array.isArray(recent.value.data) ? recent.value.data : []);
      if (open.status === "fulfilled") setOpenTrades(Array.isArray(open.value.data) ? open.value.data : []);
      setFeedError(recent.status === "rejected" || open.status === "rejected");
      setFeedLoaded(true);
    }
    loadTrades();
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadTrades();
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [active, user.loggedIn, refresh]);

  function openRespondDialog(trade) {
    const request = stampRequests.current.begin();
    setRespondingTo(trade);
    setTradeError("");
    setSelectedStamp(null);
    setStampPage(0);
    setLoadingStamps(true);

    if (user.loggedIn && user.id) {
      axios
        .get(`/api/user/${user.id}/profile`, { signal: request.signal })
        .then((res) => {
          if (!request.isCurrent()) return;
          const stamps = res.data?.stamps || [];
          setUserStamps(stamps.filter((s) => s.count >= 2));
        })
        .catch(() => { if (request.isCurrent()) setTradeError("Could not load your stamps. Close this dialog and try again."); })
        .finally(() => { if (request.isCurrent()) setLoadingStamps(false); });
    } else {
      setLoadingStamps(false);
    }
  }

  function closeDialog() {
    stampRequests.current.invalidate();
    setRespondingTo(null);
    setSelectedStamp(null);
    setUserStamps([]);
  }

  function handleConfirm() {
    if (!respondingTo || !selectedStamp || sending) return;
    setSending(true);
    setTradeError("");
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
      .catch(() => setTradeError("Could not send your trade response. Please try again."))
      .finally(() => setSending(false));
  }

  return (
    <LobbySidebarPanel title="Stamp Exchange">
      <div className="stamp-exchange-content">
        {user.loggedIn && !feedLoaded && <UiPending label="Loading stamp trades" />}
        {feedError && <div role="alert"><p>Could not update stamp trades.</p><UiAction onClick={loadOpenTrades}>Retry</UiAction></div>}
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
                    <UiIcon name="forward" size={16} />
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

        {!user.loggedIn ? (
          <Typography variant="body2" color="textSecondary">
            Log in to see stamp trades.
          </Typography>
        ) : feedLoaded && !feedError && trades.length === 0 && openTrades.length === 0 ? (
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
              {trades.map((t) => {
                const isGift = !t.recipientRole || !t.recipientGameType;
                return (
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
                      {isGift ? (
                        <>
                          <UiIcon name="forward" size={16} />
                          <Typography variant="caption" sx={{ opacity: 0.65 }}>
                            gifted
                          </Typography>
                        </>
                      ) : (
                        <>
                          <UiIcon name="refresh" size={16} />
                          <StampItem
                            role={t.recipientRole}
                            gameType={t.recipientGameType}
                            size="small"
                          />
                        </>
                      )}
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
                );
              })}
            </Stack>
          </>
        )}
      </div>

      <UiDialog open={!!respondingTo} onClose={sending ? undefined : closeDialog} maxWidth="xs" title="Respond to stamp offer"
        actions={<><UiAction disabled={sending} onClick={closeDialog}>Cancel</UiAction><UiAction variant="primary" busy={sending} onClick={handleConfirm} disabled={!selectedStamp}>Send offer</UiAction></>}>
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
        {tradeError && <p role="alert">{tradeError}</p>}
          {loadingStamps ? (
            <UiPending label="Loading duplicate stamps" />
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
                      <UiAction
                         key={key}
                         aria-label={`Offer ${s.role}`}
                         aria-pressed={isPicked}
                         onClick={() => setSelectedStamp(s)}
                      >
                        <StampItem
                          role={s.role}
                          gameType={s.gameType}
                          count={s.count}
                        />
                      </UiAction>
                    );
                  })}
              </Box>
              {userStamps.length > STAMPS_PER_PAGE && (
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <UiAction aria-label="Previous stamps"
                    disabled={stampPage === 0}
                    onClick={() => setStampPage(stampPage - 1)}
                  >
                    <UiIcon name="previous" />
                  </UiAction>
                  <Typography variant="caption">
                    {stampPage + 1} / {Math.ceil(userStamps.length / STAMPS_PER_PAGE)}
                  </Typography>
                  <UiAction aria-label="Next stamps"
                    disabled={(stampPage + 1) * STAMPS_PER_PAGE >= userStamps.length}
                    onClick={() => setStampPage(stampPage + 1)}
                  >
                    <UiIcon name="next" />
                  </UiAction>
                </Stack>
              )}
            </>
          )}
      </UiDialog>
    </LobbySidebarPanel>
  );
}
