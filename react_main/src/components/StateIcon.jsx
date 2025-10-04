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
};

export default function StateIcon({ stateType, size = 40 }) {
  const iconSrc = statesIcons[stateType] || statesIcons["nowin"];

  const formatTitle = (type) =>
    type
      ? type
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/-/g, " ")
          .replace(/win/g, " Win!")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Unknown State";

  return (
      <img
        src={iconSrc}
        alt={stateType}
        width={size}
        height={size}
        style={{ objectFit: "contain" }}
      />
  );
}
