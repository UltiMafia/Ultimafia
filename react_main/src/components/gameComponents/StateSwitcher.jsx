import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, IconButton, Paper, Stack, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import StateIcon from "../StateIcon";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

export default function StateSwitcher({ history, stateViewing, updateStateViewing, onStateNavigation, hideFastForward = false }) {
  const isPhoneDevice = useIsPhoneDevice();

  const STATE_RANGE = isPhoneDevice ? 1 : 2;

  const leftArrowVisible = stateViewing !== -1;
  const rightArrowVisible =
    stateViewing < history.currentState ||
    (history.currentState === -2 && stateViewing !== history.currentState);

  const handleClick = (action) => {
    updateStateViewing(action);
    onStateNavigation();
  };

  const stateIconSize = 40;
  const iconStyle = {
    width: "1em",
    height: "1em",
  };

  let stateNums = Object.keys(history.states).map(stateNum => Number.parseInt(stateNum));
  stateNums.sort((a, b) => {
    // Postgame is always greater
    if(a === -2) {
      return 1;
    }
    if(b === -2) {
      return -1;
    }
    else {
      return a - b;
    }
  });
  const reverseStateNums = Object.fromEntries(stateNums.map((stateNum, i) => [stateNum, i]));
  const currentStateIndex = reverseStateNums[stateViewing];

  const padInvisibleLeft = Math.max(0, STATE_RANGE - currentStateIndex);
  const padInvisibleRight = Math.max(0, STATE_RANGE - stateNums.length + 1 + currentStateIndex);

  const paginatedStates = stateNums.map((stateNum) => {
    const state = history.states[stateNum];
    const stateName = state ? state.name : "Unknown State";
    const index = reverseStateNums[stateNum];

    const isInRange = (index >= currentStateIndex - STATE_RANGE) && (index <= currentStateIndex + STATE_RANGE);

    // If you change the sizing of this, make sure to tweak the padInvisibleLeft and padInvisibleRight calcs accordingly
    return (
      <Tab
        component="div"
        key={stateNum}
        aria-label={stateName}
        icon={<StateIcon
          stateName={stateName}
          stateNum={stateNum}
          unfocused={stateNum !== stateViewing}
          size={stateIconSize}
        />}
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
    onStateNavigation();
  };

  return (
    <Stack direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "center",
        py: .5,
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

      {!hideFastForward && (<IconButton
        sx={{
          visibility: leftArrowVisible ? undefined : "hidden",
        }}
        onClick={() => handleClick({ type: "first" })}
      >
        <i className="fas fa-angle-double-left" style={iconStyle} />
      </IconButton>)}

      <Stack direction="column" sx={{
        alignItems: "center",
      }}>
        <Tabs
          value={reverseStateNums[stateViewing]}
          onChange={handleChange}
          sx={{
            maxWidth: "100%",
            minHeight: 0,
            paddingLeft: `calc(${padInvisibleLeft} * (var(--mui-spacing) + ${stateIconSize}px))`,
            paddingRight: `calc(${padInvisibleRight} * (var(--mui-spacing) + ${stateIconSize}px))`,
            '& .MuiTabs-indicator': {
              transition: "none",
            },
          }}
        >
          {paginatedStates}
        </Tabs>
      </Stack>

      {!hideFastForward && (<IconButton
        sx={{
          visibility: rightArrowVisible ? undefined : "hidden",
        }}
        onClick={() => handleClick({ type: "current" })}
      >
        <i className="fas fa-angle-double-right" style={iconStyle} />
      </IconButton>)}

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
