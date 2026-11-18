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
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { GameContext } from "Contexts";

export default function StateSwitcher({ stateRange = null }) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();
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

  const stateIconSize = 40;
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

  const padInvisibleLeft = Math.max(0, STATE_RANGE - currentStateIndex);
  const padInvisibleRight = Math.max(
    0,
    STATE_RANGE - stateNums.length + 1 + currentStateIndex
  );

  const paginatedStates = stateNums.map((stateNum) => {
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
      index >= currentStateIndex - STATE_RANGE &&
      index <= currentStateIndex + STATE_RANGE;

    // If you change the sizing of this, make sure to tweak the padInvisibleLeft and padInvisibleRight calcs accordingly
    return (
      <Tab
        key={stateNum}
        aria-label={stateName}
        icon={
          <StateIcon
            stateName={stateName}
            winnerGroups={winnerGroups}
            unfocused={stateNum !== stateViewing}
            size={stateIconSize}
          />
        }
        sx={{
          display: isInRange ? undefined : "none",
          px: 0.5,
          paddingBottom: 0.5,
          paddingTop: 0,
          minWidth: 0,
          minHeight: 0,
        }}
      />
    );
  });

  const handleChange = (event, newValue) => {
    const newState = stateNums[newValue];
    handleClick({ type: "set", stateNum: newState });
  };

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "center",
        py: 0.5,
        borderRadius: 1,
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

      {!hideFastForward && (
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

      <Stack
        direction="column"
        sx={{
          alignItems: "center",
        }}
      >
        <Tabs
          value={reverseStateNums[stateViewing]}
          onChange={handleChange}
          variant="standard"
          scrollButtons={false}
          allowScrollButtonsMobile={false}
          sx={{
            maxWidth: "100%",
            minHeight: 0,
            paddingLeft: `calc(${padInvisibleLeft} * (var(--mui-spacing) + ${stateIconSize}px))`,
            paddingRight: `calc(${padInvisibleRight} * (var(--mui-spacing) + ${stateIconSize}px))`,
            "& .MuiTabs-indicator": {
              transition: "none",
            },
          }}
        >
          {paginatedStates}
        </Tabs>
      </Stack>

      {!hideFastForward && (
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
