import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  ButtonBase,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { GameContext, UserContext } from "Contexts";
import { Avatar, NameWithAvatar } from "pages/User/UserWidgets";
import { RoleCount } from "components/Roles";
import { playerNameWithAvatarProps } from "../playerDisplay";
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

// Renders a game player exactly like the player list does (NameWithAvatar
// with the player's avatar/deck avatar, square shape, name color, animated
// color and font). Long names wrap to two lines and then ellipsize (one line
// when `small`, e.g. the compact preset and the awarded lists).
function KudosPlayer({ player, small, noLink = true, sx }) {
  const user = useContext(UserContext);
  const theme = useTheme();
  const nameSx = small
    ? {
        display: "block !important",
        whiteSpace: "nowrap !important",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }
    : {
        display: "-webkit-box !important",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        whiteSpace: "normal !important",
        overflowWrap: "anywhere",
        overflow: "hidden",
        maxHeight: "2.4em",
      };
  return (
    <Box
      sx={{
        minWidth: 0,
        "& .name-with-avatar, & .name-with-avatar .MuiStack-root": {
          minWidth: 0,
        },
        "& .user-name": { display: "block !important", minWidth: 0 },
        "& .user-name-text": {
          ...nameSx,
          lineHeight: 1.2,
          textAlign: "left",
        },
        ...sx,
      }}
    >
      <NameWithAvatar
        {...playerNameWithAvatarProps(player, { user, theme, square: true })}
        small={small}
        noLink={noLink}
        includeMiniprofile={!noLink}
        newTab
      />
    </Box>
  );
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
        {kudosOpen
          ? "Hide kudos"
          : left > 0
          ? `Kudos (${left} to vote)`
          : "Kudos results"}
      </Button>
      <Box data-testid="kudos-awarded" sx={{ mt: 0.75 }}>
        {awarded.length === 0 ? (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              display: "block",
              textAlign: "center",
            }}
          >
            {kudos.finalized
              ? "No kudos were awarded."
              : "No kudos awarded yet."}
          </Typography>
        ) : (
          <Stack spacing={0.25}>
            {awarded.map((id) => (
              <Stack
                key={id}
                direction="row"
                spacing={0.75}
                data-testid="kudos-awarded-name"
                sx={{ alignItems: "center", minWidth: 0 }}
              >
                <KudosIcon size={16} title="Kudos" />
                <KudosPlayer player={players[id]} small noLink={false} />
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", flexShrink: 0 }}
                >
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

const CONFIRM_MS = 900; // how long a freshly locked row stays before fading
const FADE_MS = 450;

function useMobileKudos() {
  const isPhoneDevice = useIsPhoneDevice();
  const narrow = useMediaQuery("(max-width:600px)");
  return isPhoneDevice || narrow;
}

// Name (with the player's name color/animation/font) and role icon, then the
// avatar, which is the vote button.
function KudosTile({
  player,
  role,
  gameType,
  setupRoles,
  isSelf,
  selected,
  awarded,
  clickable,
  dimmed,
  mobile,
  onClick,
}) {
  const user = useContext(UserContext);
  const theme = useTheme();
  const props = playerNameWithAvatarProps(player, {
    user,
    theme,
    square: true,
  });
  const size = mobile ? 50 : 56;

  const avatarButton = (
    <ButtonBase
      data-testid="kudos-portrait"
      data-player={player ? player.id : ""}
      data-self={isSelf ? "1" : "0"}
      aria-pressed={!!selected}
      aria-label={`Give kudos to ${props.name}`}
      disabled={!clickable}
      onClick={onClick}
      sx={{
        position: "relative",
        borderRadius: props.isSquare ? "6px" : "50%",
        p: "2px",
        border: "2px solid",
        borderColor: selected ? "primary.main" : "transparent",
        boxShadow: selected ? "0 0 0 3px rgba(255,140,0,0.25)" : "none",
        transition: "transform 120ms ease, border-color 120ms ease",
        "& .avatar": {
          width: `${size}px !important`,
          height: `${size}px !important`,
        },
        ...(clickable
          ? {
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: "rgba(255,140,0,0.7)",
              },
              "&:focus-visible": { borderColor: "primary.main" },
            }
          : {}),
      }}
    >
      <Avatar
        id={props.id}
        avatarId={props.avatarId}
        hasImage={props.avatar}
        name={props.name}
        isSquare={props.isSquare}
      />
      {awarded && (
        <Box
          data-testid="kudos-tile-awarded"
          sx={{
            position: "absolute",
            top: -4,
            right: -6,
            borderRadius: "50%",
            backgroundColor: "background.paper",
            p: "2px",
            lineHeight: 0,
            boxShadow: "0 0 0 1px rgba(255,140,0,0.8)",
          }}
        >
          <KudosIcon size={mobile ? 16 : 18} title="Received kudos" />
        </Box>
      )}
    </ButtonBase>
  );

  return (
    <Box
      data-testid="kudos-tile"
      data-player={player ? player.id : ""}
      sx={{
        flex: "0 0 auto",
        width: mobile ? 92 : 108,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.25,
        px: 0.5,
        pt: 0.5,
        pb: 0.5,
        borderRadius: 2,
        scrollSnapAlign: "start",
        backgroundColor: selected
          ? "rgba(255,140,0,0.14)"
          : "rgba(255,255,255,0.035)",
        opacity: isSelf ? 0.45 : dimmed ? 0.5 : 1,
        transition: "opacity 200ms ease, background-color 200ms ease",
      }}
    >
      <Stack
        direction="row"
        spacing={0.25}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minWidth: 0,
          height: 22,
          "--role-icon-size": "20px",
          "& .name-with-avatar": { minWidth: 0 },
          "& .name-with-avatar .MuiStack-root": {
            minWidth: 0,
            maxWidth: "100%",
          },
          "& .user-name": {
            display: "block !important",
            minWidth: 0,
            overflow: "hidden",
          },
          "& .user-name > .MuiStack-root": { minWidth: 0 },
          "& .user-name-text": {
            display: "block !important",
            minWidth: 0,
            whiteSpace: "nowrap !important",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "12px",
            lineHeight: "20px",
          },
          "& .role": { flexShrink: 0 },
        }}
      >
        <Box sx={{ minWidth: 0, flex: "0 1 auto", lineHeight: "20px" }}>
          <NameWithAvatar {...props} hideAvatar small noLink />
        </Box>
        {role && (
          <Box sx={{ flexShrink: 0, lineHeight: 0 }} data-testid="kudos-role">
            <RoleCount
              role={role}
              gameType={gameType}
              otherRoles={setupRoles}
              showPopover
              small
            />
          </Box>
        )}
      </Stack>
      {isSelf ? (
        <Tooltip
          title="You Cannot Kudo Yourself!"
          arrow
          placement="top"
          enterTouchDelay={0}
          leaveTouchDelay={2500}
          slotProps={{ tooltip: { sx: { fontSize: 13 } } }}
        >
          <Box
            component="span"
            data-testid="kudos-self"
            tabIndex={0}
            sx={{ display: "inline-flex", cursor: "not-allowed" }}
          >
            {avatarButton}
          </Box>
        </Tooltip>
      ) : (
        avatarButton
      )}
    </Box>
  );
}

function KudosLineupRow({ row, kudos, phase, readOnly, mobile, onVote }) {
  const game = useContext(GameContext);
  const { players, self, history, gameType, setup } = game;
  const myVote = kudos.myVotes ? kudos.myVotes[row.key] : undefined;
  const locked = myVote !== undefined;
  const canVote = !readOnly && kudos.canVote && !kudos.finalized && !locked;
  const awarded = (kudos.awarded && kudos.awarded[row.key]) || [];
  const color = ROW_COLORS[row.key] || "#d3d3d3";
  const roles =
    (history &&
      history.states &&
      history.states[history.currentState] &&
      history.states[history.currentState].roles) ||
    {};

  let status = null;
  if (locked)
    status = (
      <>
        <i className="fas fa-check" style={{ marginRight: 4 }} />
        {phase === "confirm" ? "Kudos locked in" : "Voted"}
      </>
    );
  else if (readOnly)
    status = kudos.canVote && !kudos.finalized ? "Not voted" : null;

  return (
    <Box
      data-testid="kudos-row"
      data-row={row.key}
      data-locked={locked ? "1" : "0"}
      data-phase={phase || "open"}
      sx={{
        position: "relative",
        px: 1,
        pt: 0.5,
        pb: 0.75,
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        "& + &": { borderTop: "1px solid rgba(255,255,255,0.07)" },
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: "center", mb: 0.5, minHeight: 18 }}
      >
        <Box
          sx={{
            width: 4,
            height: 12,
            borderRadius: 1,
            backgroundColor: color,
          }}
        />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color,
          }}
        >
          {row.label}
        </Typography>
        {awarded.length > 0 && (
          <Typography
            variant="caption"
            data-testid="kudos-row-awarded"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            {awarded
              .map((id) => (players[id] ? players[id].name : "?"))
              .join(", ")}{" "}
            received kudos!
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            ml: "auto !important",
            color: locked ? "primary.main" : "text.secondary",
            fontWeight: locked ? 700 : 400,
            whiteSpace: "nowrap",
          }}
        >
          {status}
        </Typography>
      </Stack>
      <Box
        data-testid="kudos-lineup"
        sx={{
          display: "flex",
          gap: mobile ? 0.75 : 1,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x proximity",
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
          pb: 0.5,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.25) transparent",
        }}
      >
        {row.candidates.map((id) => {
          const isSelf = id === self;
          return (
            <KudosTile
              key={id}
              player={players[id]}
              role={roles[id]}
              gameType={gameType}
              setupRoles={setup && setup.roles}
              isSelf={isSelf}
              selected={myVote === id}
              awarded={awarded.includes(id)}
              clickable={canVote && !isSelf}
              dimmed={locked && myVote !== id}
              mobile={mobile}
              onClick={() => !isSelf && onVote(row.key, id)}
            />
          );
        })}
      </Box>
      <Button
        data-testid="kudos-noone"
        variant="text"
        fullWidth
        size="small"
        disabled={!canVote}
        aria-pressed={myVote === KUDOS_NO_ONE}
        onClick={() => onVote(row.key, KUDOS_NO_ONE)}
        startIcon={<i className="fas fa-ban" style={{ fontSize: 12 }} />}
        sx={{
          mt: 0.5,
          py: 0,
          minHeight: 26,
          fontSize: 13,
          fontWeight: 600,
          textTransform: "none",
          color: myVote === KUDOS_NO_ONE ? "primary.main" : "text.secondary",
          border: "1px dashed",
          borderColor:
            myVote === KUDOS_NO_ONE ? "primary.main" : "rgba(255,255,255,0.22)",
          backgroundColor:
            myVote === KUDOS_NO_ONE ? "rgba(255,140,0,0.14)" : "transparent",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: "rgba(255,140,0,0.08)",
          },
          "&&.Mui-disabled": {
            backgroundColor:
              myVote === KUDOS_NO_ONE ? "rgba(255,140,0,0.14)" : "transparent",
            color: myVote === KUDOS_NO_ONE ? "primary.main" : "text.disabled",
            borderColor:
              myVote === KUDOS_NO_ONE
                ? "primary.main"
                : "rgba(255,255,255,0.12)",
          },
        }}
      >
        No one
      </Button>
      {phase === "confirm" && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: 1,
            boxShadow: "inset 0 0 0 2px rgba(255,140,0,0.55)",
          }}
        />
      )}
    </Box>
  );
}

// Kudos voting docked in the chat column, between the messages and the chat
// input. One lineup per team; a row locks, confirms and fades away once you
// vote in it, and the dock goes away when every row is voted. Reopened from
// the Actions panel it shows a read-only view of the results.
export function KudosDock({ onResize }) {
  const game = useContext(GameContext);
  const { kudos, kudosOpen, setKudosOpen, socket } = game;
  const mobile = useMobileKudos();
  const boxRef = useRef(null);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const [phases, setPhases] = useState({}); // row -> confirm | fading | gone
  const seenRef = useRef(null);
  const timersRef = useRef([]);
  const finishedRef = useRef(false);

  const open = !!(kudos && kudosOpen);
  // The chat column grows with its content, so size the dock from the space
  // the column has without it: measure with the dock collapsed, then cap it so
  // the chat keeps at least MIN_CHAT px (rows scroll inside the dock).
  const [maxH, setMaxH] = useState(null);
  const [measuring, setMeasuring] = useState(true);
  useLayoutEffect(() => {
    if (!open) {
      setMeasuring(true);
      return;
    }
    const el = boxRef.current;
    if (!measuring || !el || !el.parentElement) return;
    const wrap = el.parentElement;
    let others = 0;
    for (const child of wrap.children)
      if (child !== el && !child.classList.contains("speech-display"))
        others += child.getBoundingClientRect().height;
    const minChat = mobile ? 130 : 140;
    setMaxH(
      Math.max(
        150,
        Math.floor(wrap.getBoundingClientRect().height - others - minChat)
      )
    );
    setMeasuring(false);
  }, [open, measuring, mobile]);
  useEffect(() => {
    const onResize = () => setMeasuring(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const myVotes = (kudos && kudos.myVotes) || {};
  const voteKey = Object.keys(myVotes).sort().join(",");

  useEffect(() => {
    if (!kudos) return;
    if (seenRef.current === null) {
      // Rows already voted before this mounted (e.g. a reload) start hidden.
      seenRef.current = new Set(Object.keys(myVotes));
      setPhases(
        Object.fromEntries([...seenRef.current].map((k) => [k, "gone"]))
      );
      return;
    }
    for (const key of Object.keys(myVotes)) {
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      setPhases((p) => ({ ...p, [key]: "confirm" }));
      timersRef.current.push(
        setTimeout(
          () => setPhases((p) => ({ ...p, [key]: "fading" })),
          CONFIRM_MS
        ),
        setTimeout(() => {
          finishedRef.current = true;
          setPhases((p) => ({ ...p, [key]: "gone" }));
        }, CONFIRM_MS + FADE_MS)
      );
    }
  }, [kudos && voteKey]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const rows = (kudos && kudos.rows) || [];
  const voting = !!kudos && kudos.canVote && !kudos.finalized;
  const allGone = rows.every((r) => phases[r.key] === "gone");
  const readOnly = !voting || allGone;

  // The last row just faded out: put the dock away.
  useEffect(() => {
    if (finishedRef.current && allGone) {
      finishedRef.current = false;
      setKudosOpen(false);
    }
  }, [allGone]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(
      () => onResizeRef.current && onResizeRef.current()
    );
    ro.observe(el);
    return () => ro.disconnect();
  });

  if (!kudos || !kudosOpen || rows.length === 0) return null;

  function onVote(rowKey, target) {
    if (!socket || !socket.send) return;
    socket.send("kudosVote", { row: rowKey, target });
  }

  const visibleRows = readOnly
    ? rows
    : rows.filter((r) => phases[r.key] !== "gone");
  const left = kudosRowsLeftToVote(kudos);

  return (
    <Box
      ref={boxRef}
      data-testid="kudos-dock"
      data-mode={readOnly ? "results" : "voting"}
      role="region"
      aria-label="Kudos"
      sx={{
        flex: "0 0 auto",
        maxHeight: measuring || maxH == null ? 0 : maxH,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderTop: "2px solid",
        borderColor: "primary.main",
        backgroundColor: "background.paper",
        backgroundImage:
          "linear-gradient(180deg, rgba(255,140,0,0.08), rgba(255,140,0,0) 40px)",
        boxShadow: "0 -6px 16px rgba(0,0,0,0.35)",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", px: 1.25, pt: 0.75, pb: 0.25 }}
      >
        <Box component="img" src={KUDOS_ICON} alt="" sx={{ width: 20 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
          {readOnly ? "Kudos results" : "Give Kudos"}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {readOnly
            ? kudos.finalized
              ? "Voting is over."
              : kudos.canVote
              ? "Your votes are in."
              : "Only players in this game can vote."
            : mobile
            ? "Tap an avatar. Votes are secret."
            : `Click an avatar to give kudos. Votes are secret and lock in. ${left} to go.`}
        </Typography>
        <IconButton
          data-testid="kudos-close"
          aria-label="Hide kudos"
          size="small"
          onClick={() => setKudosOpen(false)}
          sx={{ ml: "auto !important", color: "text.secondary" }}
        >
          <i className="fas fa-chevron-down" style={{ fontSize: 14 }} />
        </IconButton>
      </Stack>
      <Box sx={{ overflowY: "auto", minHeight: 0 }}>
        {visibleRows.map((row) => (
          <Collapse
            key={row.key}
            in={readOnly || phases[row.key] !== "fading"}
            timeout={FADE_MS}
            appear={false}
          >
            <KudosLineupRow
              row={row}
              kudos={kudos}
              phase={readOnly ? null : phases[row.key]}
              readOnly={readOnly}
              mobile={mobile}
              onVote={onVote}
            />
          </Collapse>
        ))}
      </Box>
    </Box>
  );
}
