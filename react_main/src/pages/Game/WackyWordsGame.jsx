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
  MobileLayout,
  GameTypeContext,
  SideMenu,
} from "./Game";
import { GameContext } from "../../Contexts";
import { Avatar } from "../User/User";

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
  const isSpectator = game.isSpectator;

  const spectatorMeetingFilter = (m) => {
    if (m.name === "Vote Kick") return false;
    if (m.inputType === "text") return false;
    if (m.inputType === "showAllOptions") return false;
    return true;
  };
  const spectatorVotingOptions = (() => {
    if (!isSpectator) return null;
    const seen = new Set();
    const options = [];
    for (const m of Object.values(meetings || {})) {
      if (!m || m.inputType !== "showAllOptions") continue;
      for (const t of m.targets || []) {
        if (seen.has(t)) continue;
        seen.add(t);
        options.push(t);
      }
    }
    return options.length > 0 ? options : null;
  })();

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

  const isCurrentState = stateViewing === history.currentState;
  const bannerNav = {
    onPrev: () => updateStateViewing({ type: "backward" }),
    onNext: () => updateStateViewing({ type: "forward" }),
    canPrev: stateViewing > 0,
    canNext: stateViewing < history.currentState,
  };

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
                  {...bannerNav}
                />
                <AcrotopiaPrompt currentQuestion={displayQuestion} />
                <AcrotopiaAskerStatus
                  asker={extraInfo.asker}
                  showStatus={!isQuestionShowable(displayQuestion)}
                />
                {isCurrentState && (
                  <AcrotopiaActionArea
                    hasPending={hasPendingAction}
                    meetingFilter={isSpectator ? spectatorMeetingFilter : undefined}
                  />
                )}
                {isCurrentState && isSpectator && spectatorVotingOptions && (
                  <SpectatorResponses options={spectatorVotingOptions} />
                )}
                {showResponses && (
                  <AcrotopiaResponses
                    responseHistory={extraInfo.responseHistory}
                    players={game.players}
                  />
                )}
              </>
            )}
          </div>
        }
        rightPanelContent={<TextMeetingLayout />}
      />
      <MobileLayout
        chatTab
        hideInfoTab
        outerLeftNavigationProps={{
          label: "Info",
          value: "players",
          icon: <i className="fas fa-info" />,
        }}
        outerLeftContent={
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
          </>
        }
        innerRightNavigationProps={{
          label: "Game",
          value: "actions",
          icon: <i className="fas fa-gamepad" />,
        }}
        innerRightContent={
          <HistoryKeeperMobile
            history={history}
            stateViewing={stateViewing}
            displayQuestion={displayQuestion}
            hasPendingAction={hasPendingAction}
            showResponses={showResponses}
            players={game.players}
            isCurrentState={isCurrentState}
            bannerNav={bannerNav}
            actionMeetingFilter={isSpectator ? spectatorMeetingFilter : undefined}
            spectatorVotingOptions={isSpectator ? spectatorVotingOptions : null}
          />
        }
      />
    </GameTypeContext.Provider>
  );
}

function AcrotopiaBanner({
  round,
  totalRound,
  onPrev,
  onNext,
  canPrev,
  canNext,
}) {
  const padded = String(round || 0).padStart(2, "0");
  const total = String(totalRound || 0).padStart(2, "0");
  const arrowStyle = (enabled) => ({
    background: "none",
    border: "none",
    color: "var(--acro-accent)",
    cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.25,
    padding: "0 6px",
    fontSize: "1rem",
  });
  return (
    <header className="acrotopia-banner">
      <div className="acrotopia-banner-left">
        {onPrev && (
          <button
            onClick={canPrev ? onPrev : undefined}
            disabled={!canPrev}
            style={arrowStyle(canPrev)}
            aria-label="Previous round"
          >
            <i className="fas fa-chevron-left" />
          </button>
        )}
        <span className="acrotopia-banner-label">Round</span>
        <span className="acrotopia-banner-now">{padded}</span>
        <span className="acrotopia-banner-sep">/</span>
        <span className="acrotopia-banner-of">{total}</span>
        {onNext && (
          <button
            onClick={canNext ? onNext : undefined}
            disabled={!canNext}
            style={arrowStyle(canNext)}
            aria-label="Next round"
          >
            <i className="fas fa-chevron-right" />
          </button>
        )}
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

function AcrotopiaAskerStatus({ asker, showStatus }) {
  if (!showStatus || !asker) return null;
  return (
    <section className="acrotopia-prompt">
      <p className="acrotopia-prompt-text">
        <em>{asker} is asking a question…</em>
      </p>
    </section>
  );
}

function AcrotopiaActionArea({ hasPending, meetingFilter }) {
  return (
    <section
      className={`acrotopia-action-area${
        hasPending ? " acrotopia-action-pending" : ""
      }`}
    >
      <ActionList
        bare
        meetingFilter={meetingFilter || ((m) => m.name !== "Vote Kick")}
        hideIfEmpty
        className="acrotopia-action-list"
      />
    </section>
  );
}

function SpectatorResponses({ options }) {
  return (
    <section className="acrotopia-section">
      <h3 className="acrotopia-section-label">Responses</h3>
      <ul className="acrotopia-responses">
        {options.map((opt, i) => (
          <li key={`${opt}-${i}`} className="acrotopia-response">
            <span className="acrotopia-response-quote" aria-hidden="true">
              &ldquo;
            </span>
            <span className="acrotopia-response-text">{opt}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AcrotopiaResponses({ responseHistory, players }) {
  const playerByName = {};
  if (players) {
    for (const p of Object.values(players)) {
      if (p && p.name) playerByName[p.name] = p;
    }
  }
  return (
    <section className="acrotopia-section">
      <h3 className="acrotopia-section-label">Responses</h3>
      <ul className="acrotopia-responses">
        {responseHistory.map((r, i) => {
          const author = playerByName[r.display];
          return (
            <li key={`${r.name}-${i}`} className="acrotopia-response">
              {r.isWinner && (
                <>
                  <i
                    className="fas fa-crown"
                    title="Winning response"
                    style={{
                      color: "#ff9800",
                      WebkitTextStroke: "1px #000",
                      marginRight: "6px",
                    }}
                  />
                  {r.pointsAwarded > 0 && (
                    <span
                      style={{
                        color: "#ff9800",
                        fontWeight: "bold",
                        marginRight: "6px",
                      }}
                    >
                      +{r.pointsAwarded}
                    </span>
                  )}
                </>
              )}
              <span className="acrotopia-response-quote" aria-hidden="true">
                &ldquo;
              </span>
              <span className="acrotopia-response-text">{r.name}</span>
              <span className="acrotopia-response-author">
                {author && (
                  <Avatar
                    small
                    id={author.userId}
                    hasImage={author.avatar}
                    name={author.name}
                  />
                )}
                <span>{r.display}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HistoryKeeperMobile({
  history,
  stateViewing,
  displayQuestion,
  hasPendingAction,
  showResponses,
  players,
  isCurrentState,
  bannerNav,
  actionMeetingFilter,
  spectatorVotingOptions,
}) {
  if (stateViewing < 0) return null;
  const state = history.states[stateViewing];
  if (!state) return null;
  const { round, totalRound, responseHistory, asker } = state.extraInfo || {};

  return (
    <SideMenu
      title="Game Info"
      scrollable
      content={
        <div
          className={`acrotopia-stage acrotopia-stage-mobile${
            hasPendingAction ? " acrotopia-stage-active" : ""
          }`}
        >
          <AcrotopiaBanner
            round={round}
            totalRound={totalRound}
            {...(bannerNav || {})}
          />
          <AcrotopiaPrompt currentQuestion={displayQuestion} />
          <AcrotopiaAskerStatus
            asker={asker}
            showStatus={!isQuestionShowable(displayQuestion)}
          />
          {isCurrentState && (
            <AcrotopiaActionArea
              hasPending={hasPendingAction}
              meetingFilter={actionMeetingFilter}
            />
          )}
          {isCurrentState && spectatorVotingOptions && (
            <SpectatorResponses options={spectatorVotingOptions} />
          )}
          {showResponses && responseHistory && responseHistory.length > 0 && (
            <AcrotopiaResponses
              responseHistory={responseHistory}
              players={players}
            />
          )}
        </div>
      }
    />
  );
}
