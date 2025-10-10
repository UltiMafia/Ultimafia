import { Tooltip } from "@mui/material";
import React from "react";

export const statesIcons = {
  pregame: require("images/game_state/pregame-state.png"),
  day: require("images/game_state/day-state.png"),
  night: require("images/game_state/night-state.png"),
  bakerflagwin: require("images/game_state/bakerflagwin-state.png"),
  cultwin: require("images/game_state/cultwin-state.png"),
  independentwin: require("images/game_state/independentwin-state.png"),
  jointwin1: require("images/game_state/jointwin1-state.png"),
  jointwin2: require("images/game_state/jointwin2-state.png"),
  jointwin3: require("images/game_state/jointwin3-state.png"),
  jointwin4: require("images/game_state/jointwin4-state.png"),
  mafiawin: require("images/game_state/mafiawin-state.png"),
  nowin: require("images/game_state/nowin-state.png"),
  triwin: require("images/game_state/triwin-state.png"),
  villagewin: require("images/game_state/villagewin-state.png"),
  ghost: require("images/roles/ghost-vivid.png"),
  admiral: require("images/roles/village/admiral-vivid.png"),
};

const stateIconMap = {
  pregame: "pregame",
  dawn: "night",
  day: "day",
  dusk: "night",
  night: "night",
  postgame: "bakerflagwin",
  "give clue": "ghost",
  "treasure chest": "admiral",
};

export default function StateIcon({
  stateName,
  stateNum,
  unfocused = false,
  size = 40,
}) {
  const normalizedName = stateName.toLowerCase().replace(/[0-9]/g, "").trim();
  const stateType = stateIconMap[normalizedName] || "nowin";

  const numberMatch = stateName.match(/\d+/);
  const number = numberMatch ? parseInt(numberMatch[0]) : null;

  const iconSrc = statesIcons[stateType];

  const digits = number ? String(number).split("") : [];

  const icon = (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        width: size,
        height: size,
        filter: unfocused ? "opacity(50%)" : undefined,
      }}
    >
      <img
        src={iconSrc}
        alt={stateType}
        width={size}
        height={size}
        style={{ display: "block" }}
      />

      {digits.length > 0 && (
        <div
          className="digit-wrapper"
          style={{
            position: "absolute",
            bottom: "0px",
            right: "0px",
          }}
        >
          {digits.map((digit, i) => (
            <div key={i} className={`digit digit-${digit}`} />
          ))}
        </div>
      )}
    </div>
  );

  if (unfocused) {
    return icon;
  } else {
    return (
      <Tooltip title={stateName} key={stateNum}>
        {icon}
      </Tooltip>
    );
  }
}
