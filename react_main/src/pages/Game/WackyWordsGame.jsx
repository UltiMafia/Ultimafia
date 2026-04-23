import React, { useRef, useEffect, useContext } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  SpeechFilter,
  SettingsMenu,
  Notes,
  MobileLayout,
  GameTypeContext,
  SideMenu,
} from "./Game";
import { GameContext } from "../../Contexts";

import "css/gameAcrotopia.css";

export default function WackyWordsGame() {
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;

  const playBellRef = useRef(false);

  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", () => {
      if (playBellRef.current) game.playAudio("ping");
      playBellRef.current = true;
    });
    socket.on("winners", () => {});
  }, game.socket);

  const currentState = history.states[stateViewing];
  const extraInfo = currentState && currentState.extraInfo;
  const meetings = currentState ? currentState.meetings : {};
  const self = game.self;

  const meetingList = Object.values(meetings || {});
  const hasPendingAction = meetingList.some(
    (m) =>
      m &&
      m.name !== "Vote Kick" &&
      !m.finished &&
      m.amMember &&
      !(m.votes && m.votes[self])
  );
  const isVotingPhase = meetingList.some(
    (m) => m && !m.finished && m.inputType === "showAllOptions"
  );
  const showResponses =
    !isVotingPhase &&
    extraInfo &&
    extraInfo.responseHistory &&
    extraInfo.responseHistory.length > 0;

  const scores = extraInfo?.scores;
  const playerHasVoted = extraInfo?.playerHasVoted;

  const renderPlayerMarker = (player) => (
    <span className="acrotopia-score-chip acrotopia-player-chip">
      {scores?.[player.name] ?? 0}
    </span>
  );
  const renderPlayerRowEnd = (player) =>
    playerHasVoted?.[player.name] ? (
      <i
        className="fas fa-check-circle acrotopia-row-voted"
        title="Voted"
      />
    ) : null;

  return (
    <GameTypeContext.Provider value={{ singleState: true }}>
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <PlayerList
              renderMarker={extraInfo ? renderPlayerMarker : undefined}
              renderRowEnd={extraInfo ? renderPlayerRowEnd : undefined}
            />
            <ActionList
              meetingFilter={(m) => m.name === "Vote Kick"}
              hideIfEmpty
            />
            <Notes />
            <SpeechFilter />
            <SettingsMenu />
          </>
        }
        centerPanelContent={
          <div
            className={`acrotopia-stage${
              hasPendingAction ? " acrotopia-stage-active" : ""
            }`}
          >
            {extraInfo && (
              <>
                <AcrotopiaBanner
                  round={extraInfo.round}
                  totalRound={extraInfo.totalRound}
                />
                <AcrotopiaPrompt currentQuestion={extraInfo.currentQuestion} />
                <AcrotopiaActionArea hasPending={hasPendingAction} />
                {showResponses && (
                  <AcrotopiaResponses
                    responseHistory={extraInfo.responseHistory}
                  />
                )}
              </>
            )}
          </div>
        }
        rightPanelContent={<TextMeetingLayout />}
      />
      <MobileLayout
        innerRightContent={
          <>
            <HistoryKeeperMobile
              history={history}
              stateViewing={stateViewing}
              showResponses={showResponses}
            />
            <ActionList />
          </>
        }
      />
    </GameTypeContext.Provider>
  );
}

function AcrotopiaBanner({ round, totalRound }) {
  const padded = String(round || 0).padStart(2, "0");
  const total = String(totalRound || 0).padStart(2, "0");
  return (
    <header className="acrotopia-banner">
      <div className="acrotopia-banner-left">
        <span className="acrotopia-banner-label">Round</span>
        <span className="acrotopia-banner-now">{padded}</span>
        <span className="acrotopia-banner-sep">/</span>
        <span className="acrotopia-banner-of">{total}</span>
      </div>
      <div className="acrotopia-banner-tag">Wacky Words</div>
    </header>
  );
}

function AcrotopiaPrompt({ currentQuestion }) {
  return (
    <section className="acrotopia-prompt">
      <span className="acrotopia-prompt-mark" aria-hidden="true">
        &ldquo;
      </span>
      <p className="acrotopia-prompt-text">
        {renderPromptWithBlanks(currentQuestion)}
      </p>
    </section>
  );
}

function renderPromptWithBlanks(text) {
  if (!text) return null;
  const parts = text.split(/(_{2,})/g);
  return parts.map((part, i) =>
    /^_{2,}$/.test(part) ? (
      <span key={i} className="acrotopia-blank">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function AcrotopiaActionArea({ hasPending }) {
  return (
    <section
      className={`acrotopia-action-area${
        hasPending ? " acrotopia-action-pending" : ""
      }`}
    >
      <ActionList
        bare
        meetingFilter={(m) => m.name !== "Vote Kick"}
        hideIfEmpty
        className="acrotopia-action-list"
      />
    </section>
  );
}

function AcrotopiaResponses({ responseHistory }) {
  return (
    <section className="acrotopia-section">
      <h3 className="acrotopia-section-label">Responses</h3>
      <ul className="acrotopia-responses">
        {responseHistory.map((r, i) => (
          <li key={`${r.name}-${i}`} className="acrotopia-response">
            <span className="acrotopia-response-quote" aria-hidden="true">
              &ldquo;
            </span>
            <span className="acrotopia-response-text">{r.display}</span>
            <span className="acrotopia-response-author">{r.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HistoryKeeperMobile({ history, stateViewing, showResponses }) {
  if (stateViewing < 0) return null;
  const state = history.states[stateViewing];
  if (!state) return null;
  const { round, totalRound, currentQuestion, responseHistory } =
    state.extraInfo || {};

  return (
    <SideMenu
      title="Game Info"
      scrollable
      content={
        <div className="acrotopia-stage acrotopia-stage-mobile">
          <AcrotopiaBanner round={round} totalRound={totalRound} />
          <AcrotopiaPrompt currentQuestion={currentQuestion} />
          {showResponses && responseHistory && responseHistory.length > 0 && (
            <AcrotopiaResponses responseHistory={responseHistory} />
          )}
        </div>
      }
    />
  );
}
