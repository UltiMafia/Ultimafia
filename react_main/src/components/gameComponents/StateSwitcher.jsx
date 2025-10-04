import React from "react";
import { Tooltip } from "@mui/material";
import StateIcon from "../StateIcon";

const stateIconMap = {
  pregame: "pregame",
  dawn: "day",
  day: "day",
  dusk: "night",
  night: "night",
  postgame: "bakerflagwin",
};

export default function StateSwitcher(props) {
  const { history, stateViewing, updateStateViewing, onStateNavigation } =
    props;
  const currentState = history.states[stateViewing];
  const stateName = currentState ? currentState.name : "";

  const normalizedName = stateName.toLowerCase().replace(/[0-9]/g, "").trim();
  const mappedIconType = stateIconMap[normalizedName] || "nowin";

  const numberMatch = stateName.match(/\d+/);
  const number = numberMatch ? parseInt(numberMatch[0]) : null;

  const leftArrowVisible = stateViewing != -1;
  const rightArrowVisible =
    stateViewing < history.currentState ||
    (history.currentState == -2 && stateViewing != history.currentState);

  function onStateNameClick() {
    updateStateViewing({ type: "current" });
    onStateNavigation();
  }

  return (
    <div className="state-nav">
      <i
        className={`hist-arrow fas fa-caret-left ${
          leftArrowVisible ? "" : "invisible"
        }`}
        onClick={() => {
          updateStateViewing({ type: "backward" });
          onStateNavigation();
        }}
      />

      <Tooltip title={stateName || "Unknown"}>
        <div className="state-name" onClick={onStateNameClick}>
          <StateIcon stateType={mappedIconType} size={32} number={number} />
        </div>
      </Tooltip>

      <i
        className={`hist-arrow fas fa-caret-right ${
          rightArrowVisible ? "" : "invisible"
        }`}
        onClick={() => {
          updateStateViewing({ type: "forward" });
          onStateNavigation();
        }}
      />
    </div>
  );
}
