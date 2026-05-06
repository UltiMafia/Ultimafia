import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Box,
  Tooltip,
  Typography,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
} from "@mui/material";
import { SiteInfoContext, UserContext } from "Contexts";
import { RoleCount } from "components/Roles";
import { PageNav } from "components/Nav";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { useErrorAlert } from "components/Alerts";
import StampTradeModal from "components/StampTradeModal";
import {
  isCountableScrapbookRole,
  getTotalObtainableStamps,
} from "shared/scrapbook";

import "css/scrapbook.css";

const STAMPS_PER_PAGE_MOBILE = 18;
const ITEMS_PER_PAGE = 20;
const ITEMS_PER_SPREAD = ITEMS_PER_PAGE * 2;
const FLIP_DURATION_MS = 550;

export function StampItem({ gameType, role, count, hasLock, clickable, onClick, size, borderType }) {
  const label = gameType === "Mafia" ? role : `${gameType} - ${role}`;
  const classNames = ["stamp"];
  if (clickable) classNames.push("stamp--clickable");
  if (hasLock) classNames.push("stamp--locked");
  if (size === "small") classNames.push("stamp--small");
  if (borderType === "r") classNames.push("stamp--border-ranked");
  else if (borderType === "c") classNames.push("stamp--border-competitive");
  if (count > 99) classNames.push("stamp--shiny");

  return (
    <Tooltip title={label} arrow>
      <div
        className={classNames.join(" ")}
        onClick={clickable ? onClick : undefined}
      >
        <div className="stamp-icon">
          <RoleCount role={role} gameType={gameType} small showPopover={false} />
        </div>
        <div className="stamp-fold" />
        {borderType === "r" && (
          <div className="stamp-rank-heart" aria-label="Ranked">
            <i className="fas fa-heart" />
          </div>
        )}
        {count > 1 && (
          <div className={`stamp-badge${count > 99 ? " star" : ""}`}>
            {count > 99 ? "\u2605" : count}
          </div>
        )}
        {hasLock && (
          <div className="stamp-lock" aria-label="Locked in trade">
            <i className="fas fa-lock" />
          </div>
        )}
      </div>
    </Tooltip>
  );
}

function renderStamp(s, { lockedCountsByRoleKey, isSelf, onStampClick, onRequestTrade, keyPrefix = "" }) {
  const key = `${s.gameType}:${s.role}`;
  const lockedCount = lockedCountsByRoleKey?.[key] || 0;
  const selfClickable = isSelf && s.count >= 2;
  const requestable = !isSelf && !!onRequestTrade && s.count >= 2;
  const clickable = selfClickable || requestable;
  return (
    <StampItem
      key={`${keyPrefix}${key}`}
      gameType={s.gameType}
      role={s.role}
      count={s.count}
      borderType={s.borderType}
      hasLock={lockedCount > 0}
      clickable={clickable}
      onClick={
        selfClickable
          ? () => onStampClick(s)
          : requestable
            ? () => onRequestTrade(s)
            : undefined
      }
    />
  );
}

function Page({ stamps, side, renderProps }) {
  const slots = [];
  for (let i = 0; i < ITEMS_PER_PAGE; i++) {
    const s = stamps[i];
    slots.push(
      s ? (
        renderStamp(s, renderProps)
      ) : (
        <div key={`empty-${i}`} className="stamp stamp--empty" />
      )
    );
  }
  return (
    <div className={`scrapbook-page scrapbook-page--${side}`}>
      <div className="scrapbook-page-stamps">{slots}</div>
    </div>
  );
}

function BookSpread({ stamps, spreadIndex, maxSpreads, onFlip, renderProps }) {
  const [flipping, setFlipping] = useState(null);
  const [turning, setTurning] = useState(null);
  const [rotate, setRotate] = useState(false);

  const canPrev = spreadIndex > 0 && !flipping;
  const canNext = spreadIndex < maxSpreads - 1 && !flipping;

  const pageSlice = (idx) =>
    stamps.slice(idx * ITEMS_PER_PAGE, (idx + 1) * ITEMS_PER_PAGE);

  const leftIdx = spreadIndex * 2;
  const rightIdx = spreadIndex * 2 + 1;
  const leftStamps = pageSlice(leftIdx);
  const rightStamps = pageSlice(rightIdx);

  const handleFlip = (direction) => {
    if (flipping) return;
    if (direction === "next" && !canNext) return;
    if (direction === "prev" && !canPrev) return;

    if (direction === "next") {
      const newSpread = spreadIndex + 1;
      setTurning({
        side: "right",
        frontStamps: pageSlice(newSpread * 2 - 1),
        backStamps: pageSlice(newSpread * 2),
      });
    } else {
      const newSpread = spreadIndex - 1;
      setTurning({
        side: "left",
        frontStamps: pageSlice(newSpread * 2 + 2),
        backStamps: pageSlice(newSpread * 2 + 1),
      });
    }
    setFlipping(direction);
    setRotate(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setRotate(true));
    });

    setTimeout(() => {
      onFlip(direction === "next" ? spreadIndex + 1 : spreadIndex - 1);
      setFlipping(null);
      setTurning(null);
      setRotate(false);
    }, FLIP_DURATION_MS);
  };

  return (
    <div className="scrapbook-book-wrap">
      <button
        className="scrapbook-flip-arrow scrapbook-flip-arrow--left"
        onClick={() => handleFlip("prev")}
        disabled={!canPrev}
        aria-label="Previous page"
        type="button"
      >
        <i className="fas fa-chevron-left" />
      </button>
      <div className="scrapbook-book">
        <Page stamps={leftStamps} side="left" renderProps={renderProps} />
        <div className="scrapbook-spine" />
        <Page stamps={rightStamps} side="right" renderProps={renderProps} />
        {turning && (
          <div
            className={`scrapbook-turning-page scrapbook-turning-page--${turning.side}${
              rotate ? " scrapbook-turning-page--rotate" : ""
            }`}
          >
            <div className="scrapbook-turning-face scrapbook-turning-face--front">
              <div className="scrapbook-page-stamps">
                {turning.frontStamps.map((s) =>
                  renderStamp(s, { ...renderProps, keyPrefix: "tf-" })
                )}
                {Array.from({
                  length: ITEMS_PER_PAGE - turning.frontStamps.length,
                }).map((_, i) => (
                  <div key={`tf-e-${i}`} className="stamp stamp--empty" />
                ))}
              </div>
            </div>
            <div className="scrapbook-turning-face scrapbook-turning-face--back">
              <div className="scrapbook-page-stamps">
                {turning.backStamps.map((s) =>
                  renderStamp(s, { ...renderProps, keyPrefix: "tb-" })
                )}
                {Array.from({
                  length: ITEMS_PER_PAGE - turning.backStamps.length,
                }).map((_, i) => (
                  <div key={`tb-e-${i}`} className="stamp stamp--empty" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        className="scrapbook-flip-arrow scrapbook-flip-arrow--right"
        onClick={() => handleFlip("next")}
        disabled={!canNext}
        aria-label="Next page"
        type="button"
      >
        <i className="fas fa-chevron-right" />
      </button>
    </div>
  );
}

function RequestTradeDialog({ open, onClose, targetStamp, profileUserId, onTradeAction }) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const [myStamps, setMyStamps] = useState([]);
  const [selectedStamp, setSelectedStamp] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stampPage, setStampPage] = useState(0);
  const STAMPS_PER_PAGE = 30;

  useEffect(() => {
    if (!open || !user?.id) return;
    setSelectedStamp(null);
    setStampPage(0);
    axios
      .get(`/api/user/${user.id}/profile`)
      .then((res) => {
        const all = res.data?.stamps || [];
        setMyStamps(all.filter((s) => s.count >= 2));
      })
      .catch(() => setMyStamps([]));
  }, [open, user?.id]);

  function handleConfirm() {
    if (!selectedStamp || submitting) return;
    setSubmitting(true);
    axios
      .post("/api/stampTrades/initiate", {
        gameType: selectedStamp.gameType,
        role: selectedStamp.role,
        recipientUserId: profileUserId,
        requestedGameType: targetStamp.gameType,
        requestedRole: targetStamp.role,
      })
      .then(() => {
        siteInfo.showAlert("Trade sent.", "success");
        if (onTradeAction) onTradeAction();
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  }

  if (!targetStamp) return null;

  const targetLabel =
    targetStamp.gameType === "Mafia"
      ? targetStamp.role
      : `${targetStamp.gameType} - ${targetStamp.role}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="body1">Request</Typography>
          <StampItem
            role={targetStamp.role}
            gameType={targetStamp.gameType}
            size="small"
          />
          <Typography variant="body1" sx={{ opacity: 0.7 }}>
            {targetLabel}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Pick a stamp to offer
        </Typography>
        {myStamps.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            You have no stamps with duplicates to trade.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {myStamps
                .slice(stampPage * STAMPS_PER_PAGE, (stampPage + 1) * STAMPS_PER_PAGE)
                .map((s) => {
                  const key = `${s.gameType}:${s.role}`;
                  const isSelected =
                    selectedStamp &&
                    selectedStamp.gameType === s.gameType &&
                    selectedStamp.role === s.role;
                  return (
                    <Box
                      key={key}
                      sx={{
                        borderRadius: "6px",
                        border: isSelected
                          ? "2px solid var(--scheme-color, #90caf9)"
                          : "2px solid transparent",
                      }}
                    >
                      <StampItem
                        gameType={s.gameType}
                        role={s.role}
                        count={s.count}
                        clickable
                        onClick={() => setSelectedStamp(s)}
                      />
                    </Box>
                  );
                })}
            </Box>
            {myStamps.length > STAMPS_PER_PAGE && (
              <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Button
                  size="small"
                  disabled={stampPage === 0}
                  onClick={() => setStampPage(stampPage - 1)}
                >
                  <i className="fas fa-chevron-left" />
                </Button>
                <Typography variant="caption">
                  {stampPage + 1} / {Math.ceil(myStamps.length / STAMPS_PER_PAGE)}
                </Typography>
                <Button
                  size="small"
                  disabled={(stampPage + 1) * STAMPS_PER_PAGE >= myStamps.length}
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
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!selectedStamp || submitting}
        >
          Send Trade
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Scrapbook({
  stamps = [],
  hiddenStamps = [],
  isSelf = false,
  lockedCountsByRoleKey = {},
  onTradeAction,
  profileUserId,
  profileUserName,
  panelStyle = {},
  headingStyle = {},
}) {
  const [showHidden, setShowHidden] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [tradeModalStamp, setTradeModalStamp] = useState(null);
  const [requestTradeStamp, setRequestTradeStamp] = useState(null);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();
  const hasVisible = stamps.length > 0;
  const hasHidden = hiddenStamps.length > 0;

  if (!hasVisible && !hasHidden) return null;

  const rolesRaw = siteInfo?.rolesRaw || {};

  const uniqueRoles = new Set();
  for (const s of stamps)
    if (isCountableScrapbookRole(rolesRaw, s.gameType, s.role))
      uniqueRoles.add(`${s.gameType}:${s.role}`);
  for (const s of hiddenStamps)
    if (isCountableScrapbookRole(rolesRaw, s.gameType, s.role))
      uniqueRoles.add(`${s.gameType}:${s.role}`);
  const uniqueCount = uniqueRoles.size;
  const totalRoles = getTotalObtainableStamps(rolesRaw);

  const maxSpreads = Math.max(Math.ceil(stamps.length / ITEMS_PER_SPREAD), 1);
  const safeSpreadIndex = Math.min(spreadIndex, maxSpreads - 1);
  const maxPage = Math.max(
    Math.ceil(stamps.length / STAMPS_PER_PAGE_MOBILE),
    1
  );
  const pageStamps = stamps.slice(
    (page - 1) * STAMPS_PER_PAGE_MOBILE,
    page * STAMPS_PER_PAGE_MOBILE
  );

  const renderProps = {
    lockedCountsByRoleKey,
    isSelf,
    onStampClick: (s) => setTradeModalStamp(s),
    onRequestTrade: !isSelf && profileUserId ? (s) => setRequestTradeStamp(s) : null,
  };

  return (
    <div className="box-panel scrapbook-panel" style={panelStyle}>
      <Typography variant="h3" style={headingStyle}>
        Scrapbook {totalRoles > 0 && `(${uniqueCount}/${totalRoles})`}
      </Typography>
      <div className="content">
        {hasVisible ? (
          isPhoneDevice ? (
            <>
              <Box className="scrapbook-grid">
                {pageStamps.map((s) => renderStamp(s, renderProps))}
              </Box>
              {maxPage > 1 && (
                <PageNav
                  inverted
                  page={page}
                  maxPage={maxPage}
                  onNav={setPage}
                />
              )}
            </>
          ) : (
            <>
              <BookSpread
                stamps={stamps}
                spreadIndex={safeSpreadIndex}
                maxSpreads={maxSpreads}
                onFlip={setSpreadIndex}
                renderProps={renderProps}
              />
              {maxSpreads > 1 && (
                <div className="scrapbook-spread-counter">
                  {safeSpreadIndex + 1} / {maxSpreads}
                </div>
              )}
            </>
          )
        ) : (
          <Typography variant="body2" color="textSecondary">
            No stamps yet
          </Typography>
        )}
        {isSelf && hasHidden && (
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                opacity: 0.7,
              }}
              onClick={() => setShowHidden(!showHidden)}
            >
              <Typography variant="body2" color="textSecondary">
                Hidden ({hiddenStamps.reduce((sum, s) => sum + s.count, 0)})
              </Typography>
            </Box>
            <Collapse in={showHidden}>
              <Box
                sx={{
                  mt: 0.5,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {hiddenStamps.map((s) =>
                  renderStamp(s, { ...renderProps, keyPrefix: "hidden-" })
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </div>
      {tradeModalStamp && (
        <StampTradeModal
          open={!!tradeModalStamp}
          stamp={tradeModalStamp}
          onClose={() => setTradeModalStamp(null)}
          recipientId={profileUserId && !isSelf ? profileUserId : undefined}
          recipientName={profileUserName && !isSelf ? profileUserName : undefined}
          onTradeAction={() => {
            setTradeModalStamp(null);
            if (onTradeAction) onTradeAction();
          }}
        />
      )}
      {requestTradeStamp && (
        <RequestTradeDialog
          open={!!requestTradeStamp}
          targetStamp={requestTradeStamp}
          profileUserId={profileUserId}
          onClose={() => setRequestTradeStamp(null)}
          onTradeAction={() => {
            setRequestTradeStamp(null);
            if (onTradeAction) onTradeAction();
          }}
        />
      )}
    </div>
  );
}
