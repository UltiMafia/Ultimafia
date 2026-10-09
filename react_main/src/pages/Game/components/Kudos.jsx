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

// "Kudos Awarded:" list at the top of the (main) Actions panel. Renders
// nothing until at least one kudo is awarded (live guaranteed or final).
export function KudosPanel() {
  const game = useContext(GameContext);
  const { kudos, players } = game;
  const awarded = kudosAwardedIds(kudos);
  if (awarded.length === 0) return null;

  return (
    <Box
      data-testid="kudos-panel"
      sx={{ px: 1, pt: 1, pb: 0.5, width: "100%", boxSizing: "border-box" }}
    >
      <Typography
        data-testid="kudos-awarded-title"
        sx={{ fontWeight: 700, fontSize: 14, mb: 0.5 }}
      >
        Kudos Awarded:
      </Typography>
      <Stack data-testid="kudos-awarded" spacing={0.25}>
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
          </Stack>
        ))}
      </Stack>
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

// Width a team group needs to show all its tiles on one line.
const TILE_W = { desktop: 108, mobile: 92 };
const TILE_GAP = { desktop: 8, mobile: 6 };
const GROUP_PAD = 16; // horizontal padding + border of a group card
// Teams this big always get a line to themselves.
const BIG_TEAM = 4;

export function kudosGroupWidth(count, mobile) {
  const k = mobile ? "mobile" : "desktop";
  return count * TILE_W[k] + Math.max(0, count - 1) * TILE_GAP[k] + GROUP_PAD;
}

function KudosLineupRow({ row, kudos, phase, mobile, onVote }) {
  const game = useContext(GameContext);
  const { players, self, history, gameType, setup } = game;
  const myVote = kudos.myVotes ? kudos.myVotes[row.key] : undefined;
  const locked = myVote !== undefined;
  const canVote = kudos.canVote && !kudos.finalized && !locked;
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

  return (
    <Box
      data-testid="kudos-row"
      data-row={row.key}
      data-locked={locked ? "1" : "0"}
      data-phase={phase || "open"}
      data-size={row.candidates.length}
      sx={{
        position: "relative",
        height: "100%",
        boxSizing: "border-box",
        px: 1,
        pt: 0.5,
        pb: 0.75,
        borderRadius: 1.5,
        border: "1px solid rgba(255,255,255,0.07)",
        borderTop: `2px solid ${color}55`,
        backgroundColor: "rgba(255,255,255,0.02)",
        display: "flex",
        flexDirection: "column",
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          columnGap: 0.75,
          rowGap: 0.25,
          flexWrap: "wrap",
          mb: 0.5,
          minHeight: 18,
        }}
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
            sx={{
              color: "primary.main",
              fontWeight: 600,
              lineHeight: 1.3,
              minWidth: 0,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
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
          flex: "1 0 auto",
          display: "flex",
          alignItems: "flex-start",
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
        startIcon={<i className="fas fa-ban" style={{ fontSize: 11 }} />}
        sx={{
          mt: 0.25,
          py: 0,
          minHeight: 22,
          lineHeight: "20px",
          fontSize: 12,
          "& .MuiButton-startIcon": { mr: 0.5 },
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
// vote in it, and the dock goes away when every row is voted (or voting
// ends). The chevron minimizes/expands it in place. Results live in the
// Actions panel's "Kudos Awarded:" list.
export function KudosDock({ onResize }) {
  const game = useContext(GameContext);
  const { kudos, socket } = game;
  const mobile = useMobileKudos();
  const boxRef = useRef(null);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const [phases, setPhases] = useState({}); // row -> confirm | fading | gone
  const seenRef = useRef(null);
  const timersRef = useRef([]);
  const [collapsed, setCollapsed] = useState(false);

  const rows = (kudos && kudos.rows) || [];
  const voting = !!kudos && kudos.canVote && !kudos.finalized;
  const allGone =
    rows.length > 0 && rows.every((r) => phases[r.key] === "gone");
  const visible = voting && rows.length > 0 && !allGone;
  const open = visible && !collapsed;
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
        setTimeout(
          () => setPhases((p) => ({ ...p, [key]: "gone" })),
          CONFIRM_MS + FADE_MS
        )
      );
    }
  }, [kudos && voteKey]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(
      () => onResizeRef.current && onResizeRef.current()
    );
    ro.observe(el);
    return () => ro.disconnect();
  });

  if (!visible) return null;

  function onVote(rowKey, target) {
    if (!socket || !socket.send) return;
    socket.send("kudosVote", { row: rowKey, target });
  }

  const visibleRows = rows.filter((r) => phases[r.key] !== "gone");

  return (
    <Box
      ref={boxRef}
      data-testid="kudos-dock"
      data-mode="voting"
      data-collapsed={collapsed ? "1" : "0"}
      role="region"
      aria-label="Kudos"
      sx={{
        flex: "0 0 auto",
        maxHeight: collapsed ? "none" : measuring || maxH == null ? 0 : maxH,
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
        data-testid="kudos-dock-header"
        onClick={() => collapsed && setCollapsed(false)}
        sx={{
          alignItems: "center",
          px: 1.25,
          pt: 0.75,
          pb: collapsed ? 0.75 : 0.25,
          cursor: collapsed ? "pointer" : "default",
        }}
      >
        <Box component="img" src={KUDOS_ICON} alt="" sx={{ width: 20 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
          Give Kudos
        </Typography>
        <IconButton
          data-testid="kudos-collapse"
          aria-label={collapsed ? "Expand kudos" : "Minimize kudos"}
          aria-expanded={!collapsed}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
          sx={{ ml: "auto !important", color: "text.secondary" }}
        >
          <i
            className={`fas fa-chevron-${collapsed ? "up" : "down"}`}
            style={{ fontSize: 14 }}
          />
        </IconButton>
      </Stack>
      {!collapsed && kudos.testMode && (
        <Stack
          data-testid="kudos-testmode"
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            mx: 1,
            mb: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            border: "1px dashed rgba(255,214,0,0.55)",
            backgroundColor: "rgba(255,214,0,0.08)",
            color: "#ffd600",
          }}
        >
          <i className="fas fa-flask" style={{ fontSize: 12 }} />
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, lineHeight: 1.4 }}
          >
            Test mode: kudos won't be saved
          </Typography>
        </Stack>
      )}
      <Box
        data-testid="kudos-groups"
        sx={{
          overflowY: "auto",
          minHeight: 0,
          px: 1,
          pb: 1,
          display: collapsed ? "none" : "flex",
          flexWrap: "wrap",
          alignItems: "stretch",
          gap: 0.75,
        }}
      >
        {visibleRows.map((row) => {
          const n = row.candidates.length;
          const natural = kudosGroupWidth(n, mobile);
          // Big teams take a whole line (and scroll/swipe inside it); small
          // teams share a line when they fit side by side, and grow to fill it.
          const flex = n >= BIG_TEAM ? "1 1 100%" : `1 1 ${natural}px`;
          return (
            <Collapse
              key={row.key}
              in={phases[row.key] !== "fading"}
              timeout={FADE_MS}
              appear={false}
              data-testid="kudos-group"
              data-row={row.key}
              sx={{
                flex,
                minWidth: 0,
                maxWidth: "100%",
                "& .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner": {
                  height: "100%",
                },
              }}
            >
              <KudosLineupRow
                row={row}
                kudos={kudos}
                phase={phases[row.key]}
                mobile={mobile}
                onVote={onVote}
              />
            </Collapse>
          );
        })}
      </Box>
    </Box>
  );
}
