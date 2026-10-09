import React, { useContext } from "react";
import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { GameContext } from "Contexts";
import { Avatar } from "pages/User/UserWidgets";
import { KUDOS_ICON } from "pages/User/profileIcons";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

export const KUDOS_NO_ONE = "*";

const ROW_COLORS = {
  Village: "#66adff",
  Mafia: "#e45b5b",
  Cult: "#b161d3",
  Independent: "#c7ce48",
};

export function kudosAwardedIds(kudos) {
  const ids = [];
  if (!kudos) return ids;
  for (const row of kudos.rows || [])
    for (const id of (kudos.awarded && kudos.awarded[row.key]) || [])
      if (!ids.includes(id)) ids.push(id);
  return ids;
}

export function kudosRowsLeftToVote(kudos) {
  if (!kudos || !kudos.canVote) return 0;
  return (kudos.rows || []).filter((r) => !(r.key in (kudos.myVotes || {})))
    .length;
}

export function KudosIcon({ size = 16, title = "Received kudos", sx }) {
  return (
    <Tooltip title={title} arrow>
      <Box
        component="img"
        src={KUDOS_ICON}
        alt="Kudos"
        sx={{ width: size, height: size, flexShrink: 0, ...sx }}
      />
    </Tooltip>
  );
}

// Toggle button + awarded names, shown at the top of the Actions panel in
// postgame. Replaces the old "Vote to give kudos" meeting.
export function KudosPanel() {
  const game = useContext(GameContext);
  const { kudos, kudosOpen, setKudosOpen, players } = game;
  if (!kudos) return null;

  const awarded = kudosAwardedIds(kudos);
  const left = kudosRowsLeftToVote(kudos);

  return (
    <Box
      data-testid="kudos-panel"
      sx={{ px: 1, pt: 1, pb: 0.5, width: "100%", boxSizing: "border-box" }}
    >
      <Button
        data-testid="kudos-toggle"
        fullWidth
        variant={kudosOpen ? "outlined" : "contained"}
        aria-pressed={!!kudosOpen}
        onClick={() => setKudosOpen(!kudosOpen)}
        startIcon={
          <Box component="img" src={KUDOS_ICON} alt="" sx={{ width: 20 }} />
        }
        endIcon={
          <i className={`fas fa-chevron-${kudosOpen ? "up" : "down"}`} />
        }
        sx={{ fontWeight: 700 }}
      >
        Kudos
        {left > 0 && !kudosOpen ? ` (${left} to vote)` : ""}
      </Button>
      <Box data-testid="kudos-awarded" sx={{ mt: 0.75 }}>
        {awarded.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", textAlign: "center" }}
          >
            {kudos.finalized ? "No kudos were awarded." : "No kudos awarded yet."}
          </Typography>
        ) : (
          <Stack spacing={0.25}>
            {awarded.map((id) => (
              <Stack
                key={id}
                direction="row"
                spacing={0.75}
                sx={{ alignItems: "center", minWidth: 0 }}
              >
                <KudosIcon size={16} title="Kudos" />
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ fontWeight: 600, minWidth: 0 }}
                >
                  {players[id] ? players[id].name : "?"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  received kudos
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function Portrait({ player, selected, locked, isSelf, disabled, awarded, onClick }) {
  const size = 44;
  const content = (
    <ButtonBase
      data-testid="kudos-portrait"
      data-player={player ? player.id : ""}
      data-self={isSelf ? "1" : "0"}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={!!selected}
      sx={{
        width: 76,
        flexShrink: 0,
        flexDirection: "column",
        p: 0.5,
        borderRadius: 1.5,
        border: "2px solid",
        borderColor: selected ? "primary.main" : "transparent",
        backgroundColor: selected ? "rgba(255,140,0,0.18)" : "transparent",
        opacity: isSelf ? 0.4 : locked && !selected ? 0.45 : 1,
        cursor: isSelf ? "not-allowed" : disabled ? "default" : "pointer",
        "&:hover": disabled
          ? {}
          : { backgroundColor: "rgba(255,255,255,0.08)" },
        position: "relative",
      }}
    >
      <Box sx={{ position: "relative", width: size, height: size }}>
        <Avatar
          hasImage={player && player.avatar}
          id={player && player.userId}
          avatarId={player && (player.anonId === undefined ? player.userId : player.anonId)}
          name={player ? player.name : "?"}
        />
        {awarded && (
          <Box
            component="img"
            src={KUDOS_ICON}
            alt="Kudos"
            sx={{ position: "absolute", right: -6, bottom: -4, width: 20 }}
          />
        )}
        {locked && selected && (
          <Box
            sx={{
              position: "absolute",
              left: -6,
              top: -6,
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: "primary.main",
              color: "#000",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="fas fa-lock" />
          </Box>
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          width: "100%",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
          color: "text.primary",
        }}
      >
        {player ? player.name : "?"}
      </Typography>
    </ButtonBase>
  );

  if (isSelf)
    return (
      <Tooltip
        title="You Cannot Kudo Yourself!"
        arrow
        placement="top"
        slotProps={{ tooltip: { sx: { fontSize: 13 } } }}
        enterTouchDelay={0}
        leaveTouchDelay={2500}
      >
        <Box
          component="span"
          data-testid="kudos-self"
          tabIndex={0}
          sx={{ display: "inline-flex", cursor: "not-allowed" }}
        >
          {content}
        </Box>
      </Tooltip>
    );
  return content;
}

function NoOneOption({ selected, cast, disabled, onClick }) {
  return (
    <ButtonBase
      data-testid="kudos-noone"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={!!cast}
      sx={{
        width: 76,
        flexShrink: 0,
        flexDirection: "column",
        p: 0.5,
        borderRadius: 1.5,
        border: "2px",
        borderStyle: cast ? "solid" : "dashed",
        borderColor: selected ? (cast ? "primary.main" : "text.secondary") : "transparent",
        backgroundColor: cast ? "rgba(255,140,0,0.18)" : "transparent",
        opacity: disabled && !cast ? 0.45 : 1,
        "&:hover": disabled ? {} : { backgroundColor: "rgba(255,255,255,0.08)" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "2px solid",
          borderColor: "text.secondary",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
          fontSize: 18,
        }}
      >
        <i className="fas fa-ban" />
      </Box>
      <Typography
        variant="caption"
        sx={{ mt: 0.5, lineHeight: 1.2, color: "text.primary" }}
      >
        No one
      </Typography>
    </ButtonBase>
  );
}

function KudosRow({ row, kudos, players, self, onVote }) {
  const myVote = kudos.myVotes ? kudos.myVotes[row.key] : undefined;
  const locked = myVote !== undefined;
  const canVote = kudos.canVote && !kudos.finalized;
  const awarded = (kudos.awarded && kudos.awarded[row.key]) || [];
  const color = ROW_COLORS[row.key] || "#d3d3d3";

  let status;
  if (locked) status = "Locked";
  else if (!canVote) status = kudos.finalized ? "Closed" : "View only";
  else status = "Not voted";

  return (
    <Box
      data-testid="kudos-row"
      data-row={row.key}
      data-locked={locked ? "1" : "0"}
      sx={{
        borderLeft: `4px solid ${color}`,
        pl: 1,
        py: 0.75,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", mb: 0.5 }} spacing={1}>
        <Typography sx={{ fontWeight: 700, color }}>{row.label}</Typography>
        <Typography
          variant="caption"
          sx={{
            ml: "auto !important",
            color: locked ? "primary.main" : "text.secondary",
            pr: 1,
          }}
        >
          {locked && <i className="fas fa-lock" style={{ marginRight: 4 }} />}
          {status}
        </Typography>
      </Stack>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
        }}
      >
        <NoOneOption
          selected={!locked || myVote === KUDOS_NO_ONE}
          cast={myVote === KUDOS_NO_ONE}
          disabled={!canVote || locked}
          onClick={() => onVote(row.key, KUDOS_NO_ONE)}
        />
        {row.candidates.map((id) => {
          const isSelf = id === self;
          return (
            <Portrait
              key={id}
              player={players[id]}
              isSelf={isSelf}
              selected={myVote === id}
              locked={locked}
              awarded={awarded.includes(id)}
              disabled={!canVote || locked || isSelf}
              onClick={() => !isSelf && onVote(row.key, id)}
            />
          );
        })}
      </Box>
      {awarded.length > 0 && (
        <Typography
          data-testid="kudos-row-awarded"
          variant="body2"
          sx={{ mt: 0.5, fontWeight: 600 }}
        >
          <Box
            component="img"
            src={KUDOS_ICON}
            alt=""
            sx={{ width: 16, verticalAlign: "-3px", mr: 0.5 }}
          />
          {awarded
            .map((id) => (players[id] ? players[id].name : "?"))
            .join(", ")}{" "}
          received kudos!
        </Typography>
      )}
    </Box>
  );
}

// Semi-transparent kudos voting panel floating over the game, so chat stays
// visible around and behind it. Toggled from the Actions panel.
export function KudosOverlay() {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();
  const { kudos, kudosOpen, setKudosOpen, players, self, socket } = game;

  if (!kudos || !kudosOpen) return null;

  function onVote(rowKey, target) {
    if (!socket || !socket.send) return;
    socket.send("kudosVote", { row: rowKey, target });
  }

  return (
    <Box
      data-testid="kudos-overlay"
      role="dialog"
      aria-label="Kudos"
      sx={{
        position: "fixed",
        zIndex: 1250,
        top: isPhoneDevice ? 8 : 72,
        left: isPhoneDevice ? 8 : "50%",
        right: isPhoneDevice ? 8 : "auto",
        transform: isPhoneDevice ? "none" : "translateX(-50%)",
        width: isPhoneDevice ? "auto" : "min(560px, 92vw)",
        maxHeight: isPhoneDevice ? "calc(100% - 96px)" : "calc(100vh - 180px)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(20, 20, 22, 0.88)",
        backdropFilter: "blur(2px)",
        border: "1px solid",
        borderColor: "primary.main",
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        color: "text.primary",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", px: 1.5, pt: 1, pb: 0.5 }}
      >
        <Box component="img" src={KUDOS_ICON} alt="" sx={{ width: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Give Kudos
        </Typography>
        <IconButton
          data-testid="kudos-close"
          aria-label="Close kudos"
          size="small"
          onClick={() => setKudosOpen(false)}
          sx={{ ml: "auto !important", color: "text.secondary" }}
        >
          <i className="fas fa-times" />
        </IconButton>
      </Stack>
      <Typography
        variant="caption"
        sx={{ px: 1.5, pb: 0.5, color: "text.secondary", display: "block" }}
      >
        {kudos.finalized
          ? "Kudos voting is over."
          : kudos.canVote
          ? "Pick one player per team, or No one. Votes are secret and lock once cast."
          : "Only players in this game can vote."}
      </Typography>
      <Box sx={{ overflowY: "auto", px: 1, pb: 1 }}>
        {kudos.rows.map((row) => (
          <KudosRow
            key={row.key}
            row={row}
            kudos={kudos}
            players={players}
            self={self}
            onVote={onVote}
          />
        ))}
      </Box>
    </Box>
  );
}
