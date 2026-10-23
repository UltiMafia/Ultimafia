import React, { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";

import {
  IOS_BETA_URL,
  IOS_BETA_TICKER_DISMISS_KEY,
  IOS_BETA_TICKER_ENABLED,
  IOS_BETA_TICKER_ITEMS,
} from "../constants/iosBeta";
import "css/iosBetaTicker.css";

// Visual scroll speed in px/s. Duration scales with run width so adding
// copies on a wider screen does not make the ticker look faster.
const TICKER_SPEED_PX_PER_SEC = 50;

function readDismissed() {
  try {
    return window.localStorage.getItem(IOS_BETA_TICKER_DISMISS_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function TickerItems({ copies, hidden }) {
  const reps = Math.max(1, copies);
  return (
    <span className="ios-beta-ticker__run" aria-hidden={hidden || undefined}>
      {Array.from({ length: reps }, (_, rep) =>
        IOS_BETA_TICKER_ITEMS.map((text, i) => (
          <span className="ios-beta-ticker__item" key={`${rep}-${i}`}>
            <span className="ios-beta-ticker__mark">▲</span>
            {text}
            <span className="ios-beta-ticker__divider">◆</span>
          </span>
        ))
      )}
    </span>
  );
}

export default function IosBetaTicker() {
  const location = useLocation();
  const [dismissed, setDismissed] = useState(readDismissed);
  const viewportRef = useRef(null);
  const unitRef = useRef(null);
  const [copies, setCopies] = useState(2);
  const [durationSec, setDurationSec] = useState(40);

  const onGamePage = location.pathname.startsWith("/game/");
  const show = IOS_BETA_TICKER_ENABLED && !dismissed && !onGamePage;

  useLayoutEffect(() => {
    if (!show) return undefined;

    const viewport = viewportRef.current;
    const unit = unitRef.current;
    if (!viewport || !unit) return undefined;

    const update = () => {
      const vw = viewport.clientWidth;
      const unitWidth = unit.scrollWidth;
      if (vw <= 0 || unitWidth <= 0) return;

      // Each half of the track (one run) must be at least as wide as the
      // viewport so the bar is full at rest and while scrolling. One extra
      // copy covers rounding and the dismiss button overlapping the edge.
      const needed = Math.max(2, Math.ceil(vw / unitWidth) + 1);
      setCopies(needed);

      const runWidth = needed * unitWidth;
      setDurationSec(Math.max(20, runWidth / TICKER_SPEED_PX_PER_SEC));
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    // Fonts/layout can change the unit width after first paint.
    ro.observe(unit);
    return () => ro.disconnect();
  }, [show]);

  if (!show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(IOS_BETA_TICKER_DISMISS_KEY, "1");
    } catch (e) {}
    setDismissed(true);
  };

  const label = IOS_BETA_TICKER_ITEMS.join(". ");
  const track = (
    <>
      {/* Off-flow single cycle used only to measure unit width. */}
      <span className="ios-beta-ticker__measure" ref={unitRef} aria-hidden>
        <TickerItems copies={1} hidden />
      </span>
      <span
        className="ios-beta-ticker__track"
        style={{ "--ios-beta-ticker-duration": `${durationSec}s` }}
      >
        <TickerItems copies={copies} />
        <TickerItems copies={copies} hidden />
      </span>
    </>
  );

  return (
    <Box
      className="ios-beta-ticker"
      role="region"
      aria-label="UltiMafia for iOS public beta"
      sx={{
        flexShrink: 0,
        backgroundColor: (t) => alpha(t.palette.primary.main, 0.14),
        borderBottom: 1,
        borderColor: "divider",
        color: "text.primary",
        "& .ios-beta-ticker__mark": { color: "success.main" },
        "& .ios-beta-ticker__divider": { color: "primary.main" },
      }}
    >
      {IOS_BETA_URL ? (
        <a
          className="ios-beta-ticker__viewport"
          href={IOS_BETA_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          ref={viewportRef}
        >
          {track}
        </a>
      ) : (
        <div
          className="ios-beta-ticker__viewport"
          aria-label={label}
          ref={viewportRef}
        >
          {track}
        </div>
      )}
      <IconButton
        className="ios-beta-ticker__close"
        size="small"
        aria-label="Dismiss iOS beta banner"
        onClick={dismiss}
        sx={{ color: "text.secondary", backgroundColor: "inherit" }}
      >
        <Icon icon="mdi:close" width={16} height={16} />
      </IconButton>
    </Box>
  );
}
