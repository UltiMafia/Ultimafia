import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import ReactLoading from "react-loading";
import { findSpectatorChatMeeting } from "shared/spectatorChat";
import { GameContext } from "../../Contexts";
import { subscribeSocketListeners } from "../../Socket";

const TypingContext = createContext(null);

export function RosterTypingProvider({ children }) {
  const { socket, history, stateViewing, self, isSpectator, review } = useContext(GameContext);
  const currentState = history.currentState;
  const [typing, setTyping] = useState(null);

  useEffect(() => {
    setTyping(null);
    if (!socket?.on || review) return;

    return subscribeSocketListeners(socket, (connection) => {
      connection.on("typing", ({ playerId, meetingId }) => {
        setTyping((previous) => {
          const meetings = new Map(previous?.meetings);
          if (meetingId == null) meetings.delete(playerId);
          else meetings.set(playerId, meetingId);
          return { socket, currentState, self, isSpectator, meetings };
        });
      });
    }, { replay: false });
  }, [socket, currentState, self, isSpectator, review]);

  const state = history.states[currentState];
  const active = !review && stateViewing === currentState &&
    typing?.socket === socket && typing?.currentState === currentState &&
    typing?.self === self && typing?.isSpectator === isSpectator;
  const spectatorMeeting = findSpectatorChatMeeting(state?.meetings, isSpectator);
  const value = active ? {
    typing: typing.meetings,
    visibleMeetings: new Set([state?.selTab, spectatorMeeting?.id].filter(Boolean)),
    hiddenDeadPlayers: currentState === -2 || state?.dead?.[self] ? null : state?.dead,
  } : null;

  return <TypingContext.Provider value={value}>{children}</TypingContext.Provider>;
}

export function RosterRow({ participant, hasRoleColumn = false, className = "", style, children }) {
  const activity = useContext(TypingContext);
  const theme = useTheme();
  const meetingId = activity?.typing.get(participant.id);
  const isTyping = activity?.visibleMeetings.has(meetingId) && !activity.hiddenDeadPlayers?.[participant.id];

  return (
    <div className={`player ${className}`} data-player-name={participant.name} style={style}>
      {children}
      {isTyping && (
        <ReactLoading
          className={`typing-icon${hasRoleColumn ? " has-role" : ""}`}
          type="bubbles"
          color={theme.palette.text.primary}
          width="20"
          height="20"
          role="img"
          aria-label="Typing"
        />
      )}
    </div>
  );
}
