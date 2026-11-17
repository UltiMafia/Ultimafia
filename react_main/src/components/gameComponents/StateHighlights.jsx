import React from "react";
import { Box, Typography } from "@mui/material";

import { summariseState } from "../../utils/stateHighlights";

// Muted secondary text. The tooltip paints its own light-on-dark colors, so
// these use the inherited color instead of theme text colors, which would be
// unreadable on the tooltip surface in light mode.
function Role({ children }) {
  if (!children) return null;

  return (
    <Typography
      component="span"
      sx={{ ml: 0.5, fontSize: "0.72rem", opacity: 0.75 }}
    >
      · {children}
    </Typography>
  );
}

// One row per event: a small fixed label keeps the rows aligned, and the line
// itself stays on one line so a long custom message cannot push the rest of the
// list around.
function Row({ label, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        gap: 0.75,
        mt: 0.35,
        minWidth: 0,
      }}
    >
      <Typography
        component="span"
        sx={{
          flex: "0 0 auto",
          width: 30,
          fontSize: "0.58rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          lineHeight: 1.6,
          textTransform: "uppercase",
          opacity: 0.6,
          color: "inherit",
        }}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        sx={{
          minWidth: 0,
          fontSize: "0.78rem",
          lineHeight: 1.4,
          color: "inherit",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

// Chronological events of one history state, in the order the game recorded
// them: shots fired, deaths, and the day's condemnation. Nothing is grouped and
// nothing is inferred.
//
// The summary is recomputed from the live history on every render, so an open
// tooltip follows events as they arrive instead of freezing at open time.
export default function StateHighlights({ states, stateNum }) {
  const summary = summariseState(states, stateNum);

  return (
    <Box
      sx={{
        // A fixed width keeps every event row the same length, so long custom
        // death messages truncate instead of resizing the whole tooltip.
        width: summary.events.length > 0 ? 420 : undefined,
        maxWidth: 420,
        py: 0.25,
        color: "inherit",
      }}
    >
      <Typography
        component="div"
        sx={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.25 }}
      >
        {summary.name}
      </Typography>

      {summary.result && (
        <Typography
          component="div"
          sx={{ mt: 0.35, fontSize: "0.78rem", fontWeight: 600 }}
        >
          {summary.result}
        </Typography>
      )}

      {summary.isEmpty && (
        <Typography
          component="div"
          sx={{ mt: 0.25, fontSize: "0.75rem", opacity: 0.8 }}
        >
          No events.
        </Typography>
      )}

      {summary.events.map((event, index) => {
        if (event.kind === "shot") {
          return (
            <Row key={index} label="Shot">
              {event.text}
            </Row>
          );
        }

        return (
          <Row key={index} label="Died">
            <Box component="span" sx={{ fontWeight: 600 }}>
              {event.name}
            </Box>
            {event.detail && (
              <Box component="span" sx={{ opacity: 0.85 }}>
                {" — "}
                {event.detail}
              </Box>
            )}
            <Role>{event.role}</Role>
          </Row>
        );
      })}
    </Box>
  );
}
