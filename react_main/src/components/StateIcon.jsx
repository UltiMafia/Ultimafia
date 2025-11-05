import React, { useContext, useEffect, useState } from "react";
import { Tooltip } from "@mui/material";
import { GameContext } from "Contexts";

export const statesIcons = {
  pregame: require("images/game_state/pregame-state.png"),
  dawn: require("images/game_state/dawn-state.png"),
  day: require("images/game_state/day-state.png"),
  dusk: require("images/game_state/dusk-state.png"),
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
  ghost: require("images/game_state/ghost-state.png"),
  admiral: require("images/roles/village/admiral-vivid.png"),
};

const stateIconMap = {
  pregame: "pregame",
  dawn: "dawn",
  day: "day",
  dusk: "dusk",
  night: "night",
  postgame: "bakerflagwin",
  "give clue": "ghost",
  "treasure chest": "admiral",
  epilogue: "ghost",
};

export default function StateIcon({
  stateName,
  winnerGroups,
  unfocused = false,
  size = 40,
}) {
  winnerGroups = winnerGroups.map((g) => g.toLowerCase());
  const normalizedName = stateName.toLowerCase().replace(/[0-9]/g, "").trim();
  let stateType = stateIconMap[normalizedName] || "nowin";

  if (normalizedName === "postgame" && winnerGroups.length > 0) {
    const hasMafia = winnerGroups.includes("mafia");
    const hasVillage = winnerGroups.includes("village");
    const hasCult = winnerGroups.includes("cult");
    const hasNoOne = winnerGroups.includes("no one");

    if (hasNoOne) {
      stateType = "nowin";
    } else if (hasMafia && !hasVillage && !hasCult && winnerGroups.length > 1) {
      stateType = "jointwin1";
    } else if (hasCult && !hasVillage && !hasMafia && winnerGroups.length > 1) {
      stateType = "jointwin2";
    } else if (hasMafia && hasCult && winnerGroups.length === 2) {
      stateType = "jointwin3";
    } else if (hasVillage && !hasMafia && !hasCult && winnerGroups.length > 1) {
      stateType = "jointwin4";
    } else if (hasMafia && hasCult && !hasVillage && winnerGroups.length > 2) {
      stateType = "triwin";
    } else if (hasMafia) {
      stateType = "mafiawin";
    } else if (hasVillage) {
      stateType = "villagewin";
    } else if (hasCult) {
      stateType = "cultwin";
    } else {
      stateType = "independentwin";
    }
  }

  const numberMatch = stateName.match(/\d+/);
  const number = numberMatch ? parseInt(numberMatch[0]) : null;

  const iconSrc = statesIcons[stateType];

  const digits = number ? String(number).split("") : [];

  const icon = (
    <div
      className="game-state-icon"
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
    return <Tooltip title={stateName}>{icon}</Tooltip>;
  }
}
