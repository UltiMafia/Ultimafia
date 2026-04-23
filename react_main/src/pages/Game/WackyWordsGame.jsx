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

  const displayQuestion = pickDisplayQuestion(
    extraInfo?.currentQuestion,
    meetings
  );

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
              scrollable={false}
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
                <AcrotopiaPrompt currentQuestion={displayQuestion} />
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
  if (!isQuestionShowable(currentQuestion)) return null;
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

const PROMPT_IN_CHAT_SENTINEL = "Your prompt is displayed in the chat!";

function isQuestionShowable(q) {
  if (q == null) return false;
  if (Array.isArray(q)) {
    return q.some(
      (v) => typeof v === "string" && v.trim() !== "" && v !== "Placeholder"
    );
  }
  if (typeof q === "string") {
    return (
      q.trim() !== "" &&
      q !== "Placeholder" &&
      q !== PROMPT_IN_CHAT_SENTINEL
    );
  }
  return true;
}

function pickDisplayQuestion(currentQuestion, meetings) {
  if (currentQuestion !== PROMPT_IN_CHAT_SENTINEL) return currentQuestion;
  if (!meetings) return currentQuestion;
  for (const m of Object.values(meetings)) {
    const prompt = m && m.textOptions && m.textOptions.promptText;
    if (prompt) return prompt;
  }
  return currentQuestion;
}

function renderPromptWithBlanks(text) {
  if (text == null || text === "") return null;

  if (Array.isArray(text)) {
    return (
      <span className="acrotopia-prompt-choices">
        {text.map((t, i) => (
          <span key={i} className="acrotopia-prompt-choice">
            <span className="acrotopia-prompt-choice-label">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="acrotopia-prompt-choice-text">
              {renderPromptWithBlanks(t)}
            </span>
          </span>
        ))}
      </span>
    );
  }

  if (typeof text !== "string") return String(text);

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
            <span className="acrotopia-response-text">{r.name}</span>
            <span className="acrotopia-response-author">{r.display}</span>
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
