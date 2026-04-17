import React, { useState, useContext } from "react";
import {
  Box,
  Tooltip,
  Typography,
  Collapse,
} from "@mui/material";
import { SiteInfoContext } from "Contexts";
import { RoleCount } from "components/Roles";
import { PageNav } from "components/Nav";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import StampTradeModal from "components/StampTradeModal";

import "css/scrapbook.css";

const STAMPS_PER_PAGE_MOBILE = 18;
const ITEMS_PER_PAGE = 20;
const ITEMS_PER_SPREAD = ITEMS_PER_PAGE * 2;
const FLIP_DURATION_MS = 550;

export function StampItem({ gameType, role, count, hasLock, clickable, onClick, size }) {
  const label = gameType === "Mafia" ? role : `${gameType} - ${role}`;
  const classNames = ["stamp"];
  if (clickable) classNames.push("stamp--clickable");
  if (hasLock) classNames.push("stamp--locked");
  if (size === "small") classNames.push("stamp--small");

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

function renderStamp(s, { lockedCountsByRoleKey, isSelf, onStampClick, keyPrefix = "" }) {
  const key = `${s.gameType}:${s.role}`;
  const lockedCount = lockedCountsByRoleKey?.[key] || 0;
  const available = s.count - lockedCount;
  const clickable = isSelf && available > 1;
  return (
    <StampItem
      key={`${keyPrefix}${key}`}
      gameType={s.gameType}
      role={s.role}
      count={s.count}
      hasLock={lockedCount > 0}
      clickable={clickable}
      onClick={clickable ? () => onStampClick(s) : undefined}
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

export default function Scrapbook({
  stamps = [],
  hiddenStamps = [],
  isSelf = false,
  lockedCountsByRoleKey = {},
  onTradeAction,
  panelStyle = {},
  headingStyle = {},
}) {
  const [showHidden, setShowHidden] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [tradeModalStamp, setTradeModalStamp] = useState(null);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();
  const hasVisible = stamps.length > 0;
  const hasHidden = hiddenStamps.length > 0;

  if (!hasVisible && !hasHidden) return null;

  const rolesRaw = siteInfo?.rolesRaw || {};
  const isCountableRole = (gameType, role) => {
    const data = rolesRaw[gameType]?.[role];
    if (!data) return true;
    return data.alignment !== "Event";
  };

  const uniqueRoles = new Set();
  for (const s of stamps)
    if (isCountableRole(s.gameType, s.role))
      uniqueRoles.add(`${s.gameType}:${s.role}`);
  for (const s of hiddenStamps)
    if (isCountableRole(s.gameType, s.role))
      uniqueRoles.add(`${s.gameType}:${s.role}`);
  const uniqueCount = uniqueRoles.size;
  const mafiaRoles = rolesRaw["Mafia"] || {};
  const totalRoles = Object.values(mafiaRoles).filter(
    (r) => r?.alignment !== "Event"
  ).length;

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
          onTradeAction={() => {
            setTradeModalStamp(null);
            if (onTradeAction) onTradeAction();
          }}
        />
      )}
    </div>
  );
}
