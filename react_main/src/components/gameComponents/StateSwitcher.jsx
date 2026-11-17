import React, {
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Box, IconButton, Stack, Tab, Tabs, Tooltip } from "@mui/material";
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
