import React, {
  useCallback,
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
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { GameContext, UserContext } from "Contexts";
import { NameWithAvatar } from "pages/User/UserWidgets";
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
        Kudos
        {left > 0 && !kudosOpen ? ` (${left} to vote)` : ""}
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

const cellSx = (compact) => ({
  width: "100%",
  minWidth: 0,
  minHeight: compact ? 34 : 52,
  justifyContent: "flex-start",
  textAlign: "left",
  px: compact ? 0.5 : 0.75,
  py: compact ? 0.25 : 0.5,
  borderRadius: 1.5,
  border: "2px solid",
  position: "relative",
});

function Portrait({
  player,
  selected,
  locked,
  isSelf,
  disabled,
  awarded,
  onClick,
  compact,
}) {
  const content = (
    <ButtonBase
      data-testid="kudos-portrait"
      data-player={player ? player.id : ""}
      data-self={isSelf ? "1" : "0"}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={!!selected}
      sx={{
        ...cellSx(compact),
        borderColor: selected ? "primary.main" : "transparent",
        backgroundColor: selected ? "rgba(255,140,0,0.18)" : "transparent",
        opacity: isSelf ? 0.4 : locked && !selected ? 0.45 : 1,
        "&:hover": disabled
          ? {}
          : { backgroundColor: "rgba(255,255,255,0.08)" },
      }}
    >
      <KudosPlayer player={player} small={compact} sx={{ flex: 1 }} />
      {awarded && <KudosIcon size={18} title="Kudos" sx={{ ml: 0.5 }} />}
      {locked && selected && (
        <Box
          sx={{
            position: "absolute",
            left: -7,
            top: -7,
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
    </ButtonBase>
  );

  if (isSelf)
    return (
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
          sx={{ display: "flex", minWidth: 0, cursor: "not-allowed" }}
        >
          {content}
        </Box>
      </Tooltip>
    );
  return content;
}

function NoOneOption({ selected, cast, disabled, onClick, compact }) {
  return (
    <ButtonBase
      data-testid="kudos-noone"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={!!cast}
      sx={{
        ...cellSx(compact),
        borderStyle: cast ? "solid" : "dashed",
        borderColor: selected
          ? cast
            ? "primary.main"
            : "text.secondary"
          : "transparent",
        backgroundColor: cast ? "rgba(255,140,0,0.18)" : "transparent",
        opacity: disabled && !cast ? 0.45 : 1,
        "&:hover": disabled
          ? {}
          : { backgroundColor: "rgba(255,255,255,0.08)" },
      }}
    >
      <Box
        sx={{
          width: compact ? 20 : 40,
          height: compact ? 20 : 40,
          flexShrink: 0,
          borderRadius: "50%",
          border: compact ? "1px solid" : "2px solid",
          borderColor: "text.secondary",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
          fontSize: compact ? 10 : 18,
          boxSizing: "border-box",
        }}
      >
        <i className="fas fa-ban" />
      </Box>
      <Typography
        sx={{
          ml: compact ? 0.5 : 1,
          color: "text.primary",
          fontSize: compact ? 13 : undefined,
        }}
      >
        No one
      </Typography>
    </ButtonBase>
  );
}

function KudosRow({ row, kudos, players, self, onVote, density = "normal" }) {
  const compact = density === "compact";
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
        py: compact ? 0.4 : 0.75,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", mb: compact ? 0.25 : 0.5 }}
        spacing={1}
      >
        <Typography
          sx={{ fontWeight: 700, color, fontSize: compact ? 13 : undefined }}
        >
          {row.label}
        </Typography>
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
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${
            compact ? 118 : density === "large" ? 180 : 150
          }px, 1fr))`,
          gap: compact ? 0.5 : 0.75,
          pr: 1,
        }}
      >
        <NoOneOption
          compact={compact}
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
              compact={compact}
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
        <Stack
          data-testid="kudos-row-awarded"
          direction="row"
          spacing={0.75}
          useFlexGap
          sx={{ mt: 0.75, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}
        >
          <KudosIcon size={16} title="Kudos" />
          {awarded.map((id) => (
            <KudosPlayer key={id} player={players[id]} small />
          ))}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            received kudos!
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

const LAYOUT_KEY = "kudosOverlayLayout";
const PRESETS = {
  compact: { label: "S", title: "Compact", width: 440 },
  normal: { label: "M", title: "Normal", width: 580 },
  large: { label: "L", title: "Large", width: 780 },
};
const MIN_W = 340;
const MIN_H = 180;
const MARGIN = 8;

function loadLayout() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || "null");
    if (saved && PRESETS[saved.preset]) return saved;
  } catch (e) {}
  return null;
}

function saveLayout(layout) {
  try {
    if (layout) window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    else window.localStorage.removeItem(LAYOUT_KEY);
  } catch (e) {}
}

// Keeps a window rect inside the viewport.
function clampRect(r, height) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.max(MIN_W, Math.min(r.w, vw - 2 * MARGIN));
  const h =
    r.h == null ? null : Math.max(MIN_H, Math.min(r.h, vh - 2 * MARGIN));
  const boxH = h == null ? height || 0 : h;
  const x = Math.max(MARGIN, Math.min(r.x, vw - w - MARGIN));
  const y = Math.max(
    MARGIN,
    Math.min(r.y, Math.max(MARGIN, vh - boxH - MARGIN))
  );
  return { ...r, x, y, w, h };
}

// Desktop window behavior: drag by the title bar, resize from the corner or
// edges, size presets, remembered in localStorage, reset to center.
function useKudosWindow(enabled, boxRef) {
  const [layout, setLayout] = useState(() => loadLayout());
  const dragRef = useRef(null);

  const centered = useCallback((preset, height) => {
    const w = Math.min(PRESETS[preset].width, window.innerWidth - 2 * MARGIN);
    const h = height || 0;
    return clampRect(
      {
        centered: true,
        preset,
        w,
        h: null,
        x: Math.round((window.innerWidth - w) / 2),
        y: Math.round(Math.max(MARGIN, (window.innerHeight - h) / 2)),
      },
      h
    );
  }, []);

  // First open (nothing saved): center once the height is known.
  // A remembered layout from a bigger screen is pulled back into view.
  useLayoutEffect(() => {
    if (!enabled || !boxRef.current) return;
    const h = boxRef.current.getBoundingClientRect().height;
    if (!layout) {
      setLayout(centered("normal", h));
      return;
    }
    if (dragRef.current) return;
    // Until the user moves it, stay centered as rows/awards change its height.
    const c = layout.centered
      ? centered(layout.preset, h)
      : clampRect(layout, h);
    if (
      c.x !== layout.x ||
      c.y !== layout.y ||
      c.w !== layout.w ||
      c.h !== layout.h
    )
      setLayout(c);
  });

  useEffect(() => {
    if (!enabled) return;
    const onResize = () =>
      setLayout((l) =>
        l ? clampRect(l, boxRef.current?.getBoundingClientRect().height) : l
      );
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled]);

  const commit = (l) => {
    setLayout(l);
    saveLayout(l);
  };

  function startGesture(e, mode) {
    if (!enabled || e.button !== 0 || !layout) return;
    if (mode === "move" && e.target.closest("button")) return;
    e.preventDefault();
    const rect = boxRef.current.getBoundingClientRect();
    dragRef.current = {
      mode,
      sx: e.clientX,
      sy: e.clientY,
      start: { ...layout, h: mode === "move" ? layout.h : rect.height },
      height: rect.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moveGesture(e) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    let next = { ...d.start };
    next.centered = false;
    if (d.mode === "move") {
      next.x += dx;
      next.y += dy;
    } else {
      if (d.mode.includes("e")) next.w += dx;
      if (d.mode.includes("s")) next.h += dy;
    }
    setLayout(clampRect(next, d.height));
  }

  function endGesture() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setLayout((l) => {
      saveLayout(l);
      return l;
    });
  }

  function setPreset(preset) {
    const h = boxRef.current?.getBoundingClientRect().height;
    const w = Math.min(PRESETS[preset].width, window.innerWidth - 2 * MARGIN);
    const cx = layout ? layout.x + layout.w / 2 : window.innerWidth / 2;
    if (!layout || layout.centered) {
      commit(centered(preset, h));
      return;
    }
    commit(
      clampRect(
        { ...layout, preset, w, h: null, x: cx - w / 2, y: layout.y },
        h
      )
    );
  }

  function reset() {
    saveLayout(null);
    setLayout(null); // re-centered by the layout effect at the next render
  }

  const gestureHandlers = (mode) => ({
    onPointerDown: (e) => startGesture(e, mode),
    onPointerMove: moveGesture,
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
  });

  return { layout, gestureHandlers, setPreset, reset };
}

function ResizeHandle({ mode, handlers, sx }) {
  return (
    <Box
      data-testid={`kudos-resize-${mode}`}
      {...handlers}
      sx={{ position: "absolute", zIndex: 1, touchAction: "none", ...sx }}
    />
  );
}

// Semi-transparent kudos voting panel floating over the game, so chat stays
// visible around and behind it. Toggled from the Actions panel. On desktop
// it's a draggable, resizable window; on phones it's a full-width sheet.
export function KudosOverlay() {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();
  const narrow = useMediaQuery("(max-width:600px)");
  const mobile = isPhoneDevice || narrow;
  const { kudos, kudosOpen, setKudosOpen, players, self, socket } = game;
  const open = !!(kudos && kudosOpen);
  const boxRef = useRef(null);
  const win = useKudosWindow(open && !mobile, boxRef);

  if (!open) return null;

  function onVote(rowKey, target) {
    if (!socket || !socket.send) return;
    socket.send("kudosVote", { row: rowKey, target });
  }

  const layout = mobile ? null : win.layout;
  const density = mobile ? "normal" : layout ? layout.preset : "normal";
  const compact = density === "compact";

  const placement = mobile
    ? {
        top: 8,
        left: 8,
        right: 8,
        width: "auto",
        maxHeight: "calc(100% - 96px)",
      }
    : layout
    ? {
        top: layout.y,
        left: layout.x,
        width: layout.w,
        height: layout.h == null ? "auto" : layout.h,
        maxHeight: `calc(100vh - ${layout.y + MARGIN}px)`,
      }
    : {
        // measuring pass before the first centered layout
        top: 0,
        left: 0,
        width: Math.min(PRESETS.normal.width, window.innerWidth - 2 * MARGIN),
        maxHeight: "calc(100vh - 16px)",
        visibility: "hidden",
      };

  return (
    <Box
      ref={boxRef}
      data-testid="kudos-overlay"
      data-preset={density}
      role="dialog"
      aria-label="Kudos"
      sx={{
        position: "fixed",
        zIndex: 1250,
        ...placement,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(20, 20, 22, 0.88)",
        backdropFilter: "blur(2px)",
        border: "1px solid",
        borderColor: "primary.main",
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        color: "text.primary",
        boxSizing: "border-box",
      }}
    >
      <Stack
        data-testid="kudos-titlebar"
        direction="row"
        spacing={1}
        {...(mobile ? {} : win.gestureHandlers("move"))}
        onDoubleClick={
          mobile ? undefined : (e) => !e.target.closest("button") && win.reset()
        }
        title={mobile ? undefined : "Drag to move, double-click to re-center"}
        sx={{
          alignItems: "center",
          px: 1.5,
          pt: compact ? 0.5 : 1,
          pb: 0.5,
          cursor: mobile ? "default" : "move",
          userSelect: "none",
          touchAction: mobile ? "auto" : "none",
        }}
      >
        <Box
          component="img"
          src={KUDOS_ICON}
          alt=""
          draggable={false}
          sx={{ width: compact ? 18 : 24 }}
        />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: compact ? "0.95rem" : "1.1rem" }}
        >
          Give Kudos
        </Typography>
        <Box sx={{ ml: "auto !important" }} />
        {!mobile && (
          <Stack direction="row" spacing={0.25} data-testid="kudos-presets">
            {Object.entries(PRESETS).map(([key, p]) => (
              <Tooltip key={key} title={p.title} arrow>
                <Button
                  data-testid={`kudos-preset-${key}`}
                  size="small"
                  variant={density === key ? "contained" : "text"}
                  onClick={() => win.setPreset(key)}
                  sx={{
                    minWidth: 28,
                    px: 0.5,
                    py: 0,
                    lineHeight: 1.6,
                    fontWeight: 700,
                  }}
                >
                  {p.label}
                </Button>
              </Tooltip>
            ))}
            <Tooltip title="Re-center" arrow>
              <IconButton
                data-testid="kudos-reset"
                aria-label="Re-center kudos window"
                size="small"
                onClick={() => win.reset()}
                sx={{ color: "text.secondary" }}
              >
                <i className="fas fa-crosshairs" style={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        <IconButton
          data-testid="kudos-close"
          aria-label="Close kudos"
          size="small"
          onClick={() => setKudosOpen(false)}
          sx={{ color: "text.secondary" }}
        >
          <i className="fas fa-times" />
        </IconButton>
      </Stack>
      {!compact && (
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
      )}
      <Box
        sx={{ overflowY: "auto", px: 1, pb: 1, minHeight: 0, flex: "1 1 auto" }}
      >
        {kudos.rows.map((row) => (
          <KudosRow
            key={row.key}
            row={row}
            kudos={kudos}
            players={players}
            self={self}
            onVote={onVote}
            density={density}
          />
        ))}
      </Box>
      {!mobile && (
        <>
          <ResizeHandle
            mode="e"
            handlers={win.gestureHandlers("e")}
            sx={{
              top: 8,
              right: -4,
              bottom: 16,
              width: 8,
              cursor: "ew-resize",
            }}
          />
          <ResizeHandle
            mode="s"
            handlers={win.gestureHandlers("s")}
            sx={{
              left: 8,
              right: 16,
              bottom: -4,
              height: 8,
              cursor: "ns-resize",
            }}
          />
          <ResizeHandle
            mode="se"
            handlers={win.gestureHandlers("se")}
            sx={{
              right: 0,
              bottom: 0,
              width: 16,
              height: 16,
              cursor: "nwse-resize",
              background:
                "linear-gradient(135deg, transparent 50%, rgba(255,140,0,0.8) 50%, rgba(255,140,0,0.8) 60%, transparent 60%, transparent 70%, rgba(255,140,0,0.8) 70%, rgba(255,140,0,0.8) 80%, transparent 80%)",
              borderBottomRightRadius: 8,
            }}
          />
        </>
      )}
    </Box>
  );
}
