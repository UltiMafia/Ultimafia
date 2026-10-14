import React, { useState } from "react";
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

function readDismissed() {
  try {
    return window.localStorage.getItem(IOS_BETA_TICKER_DISMISS_KEY) === "1";
  } catch (e) {
    return false;
  }
}

// One run of the ticker text. It is rendered twice side by side and the track
// slides by exactly one run, so the loop has no visible seam.
function TickerRun({ hidden }) {
  return (
    <span className="ios-beta-ticker__run" aria-hidden={hidden || undefined}>
      {[0, 1].map((rep) =>
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

  // Never over a game: the game screen owns the whole viewport.
  if (!IOS_BETA_TICKER_ENABLED || dismissed) return null;
  if (location.pathname.startsWith("/game/")) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(IOS_BETA_TICKER_DISMISS_KEY, "1");
    } catch (e) {}
    setDismissed(true);
  };

  const label = IOS_BETA_TICKER_ITEMS.join(". ");
  const track = (
    <span className="ios-beta-ticker__track">
      <TickerRun />
      <TickerRun hidden />
    </span>
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
        >
          {track}
        </a>
      ) : (
        <div className="ios-beta-ticker__viewport" aria-label={label}>
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
