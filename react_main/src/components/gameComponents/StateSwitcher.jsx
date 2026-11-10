import React, { useContext } from "react";
import { GameContext } from "Contexts";
import StateIcon from "../StateIcon";
import UiIcon from "../ui/UiIcon";
import { UiTabs, UiTab, UiAction } from "../ui";

export default function StateSwitcher({ compact = false, mobile = false } = {}) {
  const { history, stateViewing, updateStateViewing, review } = useContext(GameContext);
  const states = Object.keys(history.states).map(Number).sort((a, b) => {
    if (a === -2) return 1;
    if (b === -2) return -1;
    return a - b;
  });
  const index = states.indexOf(stateViewing);
  const state = history.states[stateViewing];
  const live = stateViewing === history.currentState;
  const goTo = stateNum => updateStateViewing({ type: "set", stateNum });
  const options = states.map(number => <option key={number} value={number}>
    {history.states[number].name}{!history.states[-2] ? (number === history.currentState ? " · Live" : " · History") : ""}
  </option>);

  if (mobile) return <div className={`game-phase-control${live ? "" : " is-history"}`}>
    <label className="game-phase-picker">
      <StateIcon stateName={state?.name || "Pregame"} winnerGroups={state?.winners?.groups || []} size={24} showNumber={false} />
      <span><strong>{state?.name || "Pregame"}</strong><small>{review ? "Game review" : live ? "View history" : "Viewing history"}</small></span>
      <UiIcon name="down" size={16} />
      <select aria-label="View phase" value={stateViewing} onChange={event => goTo(Number(event.target.value))}>{options}</select>
    </label>
    {!live && <button type="button" className="return-to-live" aria-label={review ? "Go to final phase" : "Return to current"} onClick={() => updateStateViewing({ type: "current" })}>{review ? "End" : "Live"}</button>}
  </div>;

  if (compact) return <div className="state-history-compact-row">
    <label className={`state-history-compact${live ? "" : " is-history"}`} title={state?.name}>
      <span aria-hidden="true">{state?.name || "Pregame"}<UiIcon name="down" size={16} /></span>
      <select aria-label="View phase" value={stateViewing} onChange={event => goTo(Number(event.target.value))}>{options}</select>
    </label>
    {!live && <button type="button" className="return-to-live-compact" aria-label="Return to current" onClick={() => updateStateViewing({ type: "current" })}>Live</button>}
  </div>;

  return (
    <div className="state-history state-history--desktop" aria-label="Game history">
      <UiAction variant="ghost" iconOnly aria-label="Go to first phase" disabled={index <= 0} onClick={() => goTo(states[0])}><UiIcon name="first" size={18} /></UiAction>
      <UiTabs value={stateViewing} onChange={(_, number) => goTo(number)} aria-label="Game phases"
        sx={{ minHeight: 0, '& .MuiTabs-indicator': { transition: 'none' } }}>
        {states.map((number, phaseIndex) => {
          const phase = history.states[number];
          return <UiTab key={number} value={number} aria-label={phase.name}
            icon={<StateIcon stateName={phase.name} winnerGroups={phase.winners?.groups || []} unfocused={number !== stateViewing} size={40} />}
            sx={{ display: Math.abs(phaseIndex - index) <= 2 ? undefined : 'none', p: .5, minWidth: 0, minHeight: 0 }} />;
        })}
      </UiTabs>
      <UiAction variant="ghost" iconOnly aria-label={review ? "Go to final phase" : "Return to current"} disabled={live} onClick={() => updateStateViewing({ type: "current" })}><UiIcon name="last" size={18} /></UiAction>
    </div>
  );
}
