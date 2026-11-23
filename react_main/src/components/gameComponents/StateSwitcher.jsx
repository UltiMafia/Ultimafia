import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  ButtonBase,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import StateIcon from "../StateIcon";
import StateHighlights from "./StateHighlights";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { GameContext } from "Contexts";

// Phones keep the icons at one fixed size because the window shows a handful of
// states next to the selected one. Desktop shrinks them only as far as needed to
// fit the whole history in the top bar, then scrolls the rest.
const PHONE_ICON_SIZE = 40;
const MIN_ICON_SIZE = 26;
const MAX_ICON_SIZE = 40;
// Room each state cell needs besides its icon: keeps neighbouring tap targets
// from touching and leaves space for the scroll margin.
const CELL_PADDING = 6;
// Medium IconButton, used for the jump-to-first/jump-to-current controls.
const JUMP_BUTTON_WIDTH = 40;

export default function StateSwitcher({ stateRange = null }) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();
  // Desktop shows every state across the full width of the top bar. Phones keep
  // a scrolling window around the state being viewed.
  const showsAllStates = !isPhoneDevice;
  const hideFastForward = isPhoneDevice;

  const { history, stateViewing, updateStateViewing } = game;
  const [menuAnchor, setMenuAnchor] = useState(null);
  const mobileControlsRef = useRef(null);
  useEffect(() => {
    const controls = mobileControlsRef.current;
    if (!isPhoneDevice || !controls) return;

    // CSS touch-action alone still allowed double-tap zoom on iOS. Cancel
    // single-finger taps locally and dispatch one click, retaining mouse/keyboard
    // activation and leaving swipes, long presses and multi-touch untouched.
    let tap = null;
    const document = controls.ownerDocument;
    const cancel = () => {
      tap = null;
      document.removeEventListener("touchstart", multiStart, true);
    };
    // A second finger may start outside this control group. Observe it only
    // while a tap is pending; never cancel that finger's native default.
    const multiStart = (event) => { if (event.touches.length > 1) cancel(); };
    const start = (event) => {
      cancel();
      const point = event.touches[0];
      tap = event.touches.length === 1 ? {
        id: point.identifier, x: point.clientX, y: point.clientY,
        time: Date.now(), button: event.target.closest("button"),
      } : null;
      if (tap) document.addEventListener("touchstart", multiStart, { passive: true, capture: true });
    };
    const move = (event) => {
      if (!tap) return;
      const point = Array.from(event.touches).find(point => point.identifier === tap.id);
      if (event.touches.length !== 1 || !point ||
          Math.hypot(point.clientX - tap.x, point.clientY - tap.y) > 10) cancel();
    };
    const end = (event) => {
      const gesture = tap;
      cancel();
      if (!gesture || event.touches.length || !event.cancelable ||
          Date.now() - gesture.time > 500) return;
      const point = Array.from(event.changedTouches).find(point => point.identifier === gesture.id);
      if (!point || Math.hypot(point.clientX - gesture.x, point.clientY - gesture.y) > 10) return;
      // Also cancel taps on disabled arrows and the gaps between controls.
      event.preventDefault();
      if (gesture.button && !gesture.button.disabled) gesture.button.click();
    };
    controls.addEventListener("touchstart", start, { passive: true, capture: true });
    controls.addEventListener("touchmove", move, { passive: true, capture: true });
    controls.addEventListener("touchcancel", cancel, { passive: true, capture: true });
    controls.addEventListener("touchend", end, { passive: false, capture: true });
    return () => {
      cancel();
      controls.removeEventListener("touchstart", start, true);
      controls.removeEventListener("touchmove", move, true);
      controls.removeEventListener("touchcancel", cancel, true);
      controls.removeEventListener("touchend", end, true);
    };
  }, [isPhoneDevice]);
  const [menuId] = useState(() => `phase-menu-${Math.random().toString(36).slice(2)}`);
  useEffect(() => {
    setMenuAnchor(null);
  }, [stateViewing, isPhoneDevice, game.selectedPanel]);

  const STATE_RANGE = stateRange !== null ? stateRange : isPhoneDevice ? 1 : 2;

  const leftArrowVisible = stateViewing !== -1;
  const rightArrowVisible =
    stateViewing < history.currentState ||
    (history.currentState === -2 && stateViewing !== history.currentState);

  const handleClick = (action) => {
    updateStateViewing(action);
  };

  // Measured on the whole switcher rather than on the scrolling strip, so the
  // answer does not change depending on whether the jump buttons are shown.
  const switcherRef = useRef(null);
  const scrollRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(0);

  useLayoutEffect(() => {
    const switcher = switcherRef.current;
    if (
      !showsAllStates ||
      !switcher ||
      typeof ResizeObserver === "undefined"
    ) {
      return undefined;
    }

    const measure = () => setAvailableWidth(switcher.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(switcher);
    return () => observer.disconnect();
  }, [showsAllStates]);

  const iconStyle = {
    width: "1em",
    height: "1em",
  };

  let stateNums = Object.keys(history.states).map((stateNum) =>
    Number.parseInt(stateNum)
  );
  stateNums.sort((a, b) => {
    // Postgame is always greater
    if (a === -2) {
      return 1;
    }
    if (b === -2) {
      return -1;
    } else {
      return a - b;
    }
  });
  const reverseStateNums = Object.fromEntries(
    stateNums.map((stateNum, i) => [stateNum, i])
  );
  const currentStateIndex = reverseStateNums[stateViewing];

  const padInvisibleLeft = Math.max(0, STATE_RANGE - currentStateIndex);
  const padInvisibleRight = Math.max(
    0,
    STATE_RANGE - stateNums.length + 1 + currentStateIndex
  );

  // Every state is clickable on desktop, so the strip is sized from the room
  // the top bar actually leaves for it rather than from a fixed window of
  // states around the one being viewed.
  const stateCount = stateNums.length;
  const evenCellWidth =
    availableWidth > 0 && stateCount > 0 ? availableWidth / stateCount : 0;
  const fittingIconSize = showsAllStates
    ? Math.max(
        MIN_ICON_SIZE,
        Math.min(MAX_ICON_SIZE, Math.floor(evenCellWidth) - CELL_PADDING)
      )
    : PHONE_ICON_SIZE;
  // The jump buttons only appear when the full history cannot fit; their room
  // is taken out of the strip before sizing the icons.
  const stripOverflows =
    showsAllStates &&
    stateCount * (fittingIconSize + CELL_PADDING) > availableWidth + 1;
  const stripCellWidth = stripOverflows
    ? Math.max(
        0,
        Math.floor(
          Math.max(0, availableWidth - JUMP_BUTTON_WIDTH * 2) / stateCount
        )
      )
    : evenCellWidth;
  const stateIconSize = stripOverflows
    ? Math.max(
        MIN_ICON_SIZE,
        Math.min(MAX_ICON_SIZE, stripCellWidth - CELL_PADDING)
      )
    : fittingIconSize;
  const minimumStripWidth = stateCount * (stateIconSize + CELL_PADDING);

  // Keep the viewed state on screen while the strip scrolls, without moving
  // any ancestor scroller.
  useLayoutEffect(() => {
    const strip = scrollRef.current;
    if (!showsAllStates || !strip || !stripOverflows) {
      return;
    }
    const selected = strip.querySelector('[role="tab"][aria-selected="true"]');
    if (!selected) {
      return;
    }

    const stripBox = strip.getBoundingClientRect();
    const selectedBox = selected.getBoundingClientRect();
    if (selectedBox.left < stripBox.left + CELL_PADDING) {
      strip.scrollLeft -= stripBox.left + CELL_PADDING - selectedBox.left;
    } else if (selectedBox.right > stripBox.right - CELL_PADDING) {
      strip.scrollLeft += selectedBox.right - (stripBox.right - CELL_PADDING);
    }
  }, [
    showsAllStates,
    stripOverflows,
    stateViewing,
    stateIconSize,
    stateCount,
  ]);

  const stateTabs = stateNums.map((stateNum) => {
    const state = history.states[stateNum];
    const stateName = state ? state.name : "Unknown State";
    const index = reverseStateNums[stateNum];

    // Determine winnerGroups, if any
    const gameState = game.history.states[stateNum];
    let winnerGroups = [];
    if (gameState && gameState.winners && gameState.winners.groups) {
      winnerGroups = gameState.winners.groups;
    }

    const isInRange =
      showsAllStates ||
      (index >= currentStateIndex - STATE_RANGE &&
        index <= currentStateIndex + STATE_RANGE);

    // Desktop hovers over every state to summarise that state's events; phones
    // keep the bare icon because they have no hover.
    const iconContent = (
      <Stack sx={{ alignItems: "center", py: 0.25 }}>
        <StateIcon
          stateName={stateName}
          winnerGroups={winnerGroups}
          unfocused={stateNum !== stateViewing}
          size={stateIconSize}
          withTooltip={!showsAllStates}
        />
      </Stack>
    );

    // If you change the sizing of this, make sure to tweak the
    // padInvisibleLeft and padInvisibleRight calcs accordingly
    return (
      <Tab
        key={stateNum}
        aria-label={stateName}
        icon={
          showsAllStates ? (
            <Tooltip
              title={
                <StateHighlights
                  states={history.states}
                  stateNum={stateNum}
                />
              }
              placement="bottom"
              enterDelay={200}
              enterNextDelay={120}
              leaveDelay={0}
              arrow
              disableInteractive
              slotProps={{
                tooltip: { sx: { maxWidth: 440, px: 1.25, py: 1 } },
              }}
            >
              {iconContent}
            </Tooltip>
          ) : (
            iconContent
          )
        }
        sx={{
          display: isInRange ? undefined : "none",
          px: 0.25,
          paddingBottom: 0.5,
          paddingTop: 0,
          minWidth: showsAllStates ? stateIconSize + CELL_PADDING : 0,
          maxWidth: showsAllStates ? "none" : undefined,
          minHeight: 0,
          flex: showsAllStates ? "1 1 0" : undefined,
        }}
      />
    );
  });

  if (isPhoneDevice) {
    const currentState = history.states[stateViewing];
    const previousState = stateNums[currentStateIndex - 1];
    const nextState = stateNums[currentStateIndex + 1];
    const mobileArrow = (direction, stateNum) => (
      <IconButton
        disableRipple
        aria-label={direction === "previous" ? "Previous phase" : "Next phase"}
        disabled={stateNum === undefined}
        onClick={() => stateNum !== undefined && handleClick({ type: "set", stateNum })}
        sx={{
          width: 44, height: 44, flex: "none", bgcolor: "background.paper", touchAction: "manipulation",
          border: 1, borderColor: "divider", boxShadow: 3,
          "&:hover": { bgcolor: "background.paper" },
          "&.Mui-disabled": { bgcolor: "background.paper", color: "text.secondary", opacity: 1, transition: "none", pointerEvents: "auto" },
          "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
        }}
      >
        <i className={`fas fa-angle-${direction === "previous" ? "left" : "right"}`} style={iconStyle} />
      </IconButton>
    );

    return (
      <>
      <Stack ref={mobileControlsRef} direction="row" role="group" aria-label="Game phase navigation" sx={{ alignItems: "center", justifyContent: "center", gap: 1, maxWidth: "calc(100% - 16px)", pointerEvents: "auto", touchAction: "manipulation" }}>
        {mobileArrow("previous", previousState)}
        <Paper
          component={ButtonBase}
          disableRipple
          variant="outlined"
          aria-label="Choose phase"
          aria-haspopup="menu"
          aria-expanded={Boolean(menuAnchor)}
          aria-controls={menuAnchor ? menuId : undefined}
          onClick={event => setMenuAnchor(event.currentTarget)}
          sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, border: 1, borderColor: "divider", borderRadius: 99, px: 2, py: 0.5, minHeight: 44, minWidth: 0, boxShadow: 3, "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" } }}
        >
          {currentState && <StateIcon stateName={currentState.name} winnerGroups={currentState.winners?.groups || []} size={28} />}
          <Typography noWrap aria-live="polite" sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{currentState?.name || "Unknown State"}</Typography>
          <i className="fas fa-angle-down" aria-hidden="true" />
        </Paper>
        {mobileArrow("next", nextState)}
      </Stack>
      <Menu
        id={menuId}
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        transitionDuration={0}
        disableScrollLock
        MenuListProps={{ "aria-label": "Game phases" }}
        PaperProps={{ sx: { mt: 1, maxHeight: "min(60dvh, 360px)", minWidth: 180 } }}
      >
        {stateNums.map(stateNum => {
          const state = history.states[stateNum];
          return <MenuItem
            key={stateNum}
            aria-label={state.name}
            selected={stateNum === stateViewing}
            aria-current={stateNum === stateViewing ? "step" : undefined}
            onClick={() => {
              handleClick({ type: "set", stateNum });
              setMenuAnchor(null);
            }}
            sx={{ gap: 1.5, minHeight: 44, touchAction: "manipulation" }}
          >
            <StateIcon stateName={state.name} winnerGroups={state.winners?.groups || []} size={24} />
            {state.name}
          </MenuItem>;
        })}
      </Menu>
      </>
    );
  }

  const handleChange = (event, newValue) => {
    const newState = stateNums[newValue];
    handleClick({ type: "set", stateNum: newState });
  };

  return (
    <Stack
      ref={switcherRef}
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: showsAllStates ? "flex-start" : "center",
        py: 0.5,
        borderRadius: 1,
        flex: showsAllStates ? "1 1 auto" : undefined,
        minWidth: 0,
      }}
    >
      {/* <IconButton
        sx={{
          visibility: leftArrowVisible ? undefined : "hidden",
        }}
        onClick={() => handleClick({ type: "backward" })}
      >
        <i className="fas fa-angle-left" style={iconStyle} />
      </IconButton> */}

      {!hideFastForward && stripOverflows && (
        <IconButton
          aria-label="Go to first state"
          sx={{
            visibility: leftArrowVisible ? undefined : "hidden",
          }}
          onClick={() => handleClick({ type: "first" })}
        >
          <i className="fas fa-angle-double-left" style={iconStyle} />
        </IconButton>
      )}

      <Box
        ref={scrollRef}
        sx={{
          flex: showsAllStates ? "1 1 auto" : undefined,
          minWidth: 0,
          overflowX: showsAllStates ? "auto" : "visible",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Tabs
          value={reverseStateNums[stateViewing]}
          onChange={handleChange}
          variant="standard"
          scrollButtons={false}
          allowScrollButtonsMobile={false}
          sx={{
            width: showsAllStates ? "100%" : undefined,
            maxWidth: showsAllStates ? "none" : "100%",
            minWidth: showsAllStates ? minimumStripWidth : 0,
            minHeight: 0,
            overflow: showsAllStates ? "visible" : undefined,
            paddingLeft: showsAllStates
              ? 0
              : `calc(${padInvisibleLeft} * (var(--mui-spacing) + ${PHONE_ICON_SIZE}px))`,
            paddingRight: showsAllStates
              ? 0
              : `calc(${padInvisibleRight} * (var(--mui-spacing) + ${PHONE_ICON_SIZE}px))`,
            "& .MuiTabs-flexContainer": {
              width: showsAllStates ? "100%" : undefined,
            },
            "& .MuiTabs-indicator": {
              transition: "none",
            },
          }}
        >
          {stateTabs}
        </Tabs>
      </Box>

      {!hideFastForward && stripOverflows && (
        <IconButton
          aria-label="Go to current state"
          sx={{
            visibility: rightArrowVisible ? undefined : "hidden",
          }}
          onClick={() => handleClick({ type: "current" })}
        >
          <i className="fas fa-angle-double-right" style={iconStyle} />
        </IconButton>
      )}

      {/* <IconButton
        sx={{
          visibility: rightArrowVisible ? undefined : "hidden",
        }}
        onClick={() => handleClick({ type: "forward" })}
      >
        <i className="fas fa-angle-right" style={iconStyle}  />
      </IconButton> */}
    </Stack>
  );
}
