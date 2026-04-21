import React, { useRef, useEffect, useContext, useState } from "react"; // useState kept for peekedPolicies/loyaltyReveal

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  SpeechFilter,
  SettingsMenu,
  Notes,
  PinnedMessages,
  MobileLayout,
  GameTypeContext,
} from "./Game";

const isKickMeeting = (m) => m && m.name === "Vote Kick";
const KickActionList = () => (
  <ActionList meetingFilter={isKickMeeting} hideIfEmpty scrollable={false} />
);
import { Tooltip } from "@mui/material";
import { GameContext } from "../../Contexts";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { PolicyTracks } from "./SDPolicyTracks";
import { PlayerCircle } from "./SDPlayerCircle";
import { SDPolicyAction } from "./SDPolicyAction";

import "css/game.css";
import "css/gameSecretDictator.css";

export default function SecretDictatorGame(props) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();

  const history = game.history;
  const updateHistory = game.updateHistory;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;
  const isSpectator = game.isSpectator;

  const playBellRef = useRef(false);
  const [peekedPolicies, setPeekedPolicies] = useState(null);
  const [loyaltyReveal, setLoyaltyReveal] = useState(null);

  const gameType = "Secret Dictator";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    // Make game review start at pregame
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", (state) => {
      if (playBellRef.current) game.playAudio("ping");

      playBellRef.current = true;
    });

    socket.on("policyPeek", ({ policies }) => {
      setPeekedPolicies(policies);
    });

    socket.on("loyaltyReveal", ({ name, alignment }) => {
      setLoyaltyReveal({ name, alignment });
    });

    socket.on("winners", (winners) => {});
  }, game.socket);

  return (
    <GameTypeContext.Provider
      value={{
        singleState: true,
      }}
    >
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <PlayerList />
            <KickActionList />
            <SpeechFilter />
            <SettingsMenu />
          </>
        }
        centerPanelContent={
          <GameBoard history={history} stateViewing={stateViewing} />
        }
        rightPanelContent={
          <>
            <TextMeetingLayout />
            <PinnedMessages />
            <Notes />
          </>
        }
      />
      <MobileLayout
        outerLeftContent={
          <>
            <PlayerList />
            <KickActionList />
            <SpeechFilter />
          </>
        }
        innerRightNavigationProps={{
          label: "Game",
          value: "actions",
          icon: <i className="fas fa-gamepad" />,
        }}
        innerRightContent={
          <GameBoard history={history} stateViewing={stateViewing} />
        }
        additionalInfoContent={
          <>
            <PinnedMessages />
            <Notes />
          </>
        }
      />
      {peekedPolicies && (
        <PolicyPeekModal
          policies={peekedPolicies}
          onClose={() => setPeekedPolicies(null)}
        />
      )}
      {loyaltyReveal && (
        <LoyaltyRevealModal
          name={loyaltyReveal.name}
          alignment={loyaltyReveal.alignment}
          onClose={() => setLoyaltyReveal(null)}
        />
      )}
    </GameTypeContext.Provider>
  );
}

function PolicyPeekModal({ policies, onClose }) {
  return (
    <div className="sd-peek-overlay" onClick={onClose}>
      <div className="sd-peek-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="sd-peek-title">POLICY PEEK</div>
        <div className="sd-peek-subtitle">Next 3 policies in the draw pile</div>
        <div className="sd-peek-cards">
          {policies.map((policy, i) => {
            const isLiberal = policy === "Liberal";
            return (
              <div
                key={i}
                className={`sd-peek-card sd-peek-card--${isLiberal ? "liberal" : "fascist"}`}
              >
                {policy}
              </div>
            );
          })}
        </div>
        <button className="sd-peek-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function LoyaltyRevealModal({ name, alignment, onClose }) {
  const isFascist = alignment === "Fascists";
  return (
    <div className="sd-peek-overlay" onClick={onClose}>
      <div className="sd-peek-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="sd-peek-title">LOYALTY INVESTIGATION</div>
        <div className="sd-peek-subtitle">Classified — eyes only</div>
        <div className={`sd-loyalty-badge sd-loyalty-badge--${isFascist ? "fascist" : "liberal"}`}>
          <div className="sd-loyalty-name">{name}</div>
          <div className="sd-loyalty-alignment">{alignment}</div>
        </div>
        <button className="sd-peek-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function GameBoard({ history, stateViewing }) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();

  if (stateViewing === -1) return <div className="sd-game-board sd-game-board--pregame" />;

  const state = history.states[stateViewing];
  const extraInfo = state.extraInfo;
  const deadMap = state.dead || {};

  const players = Object.values(game.players)
    .filter((p) => !p.left)
    .map((p) => ({ ...p, dead: !!deadMap[p.id] }));

  const meetings = Object.values(state.meetings || {});

  const nominationMeeting = meetings.find(
    (m) => m.actionName === "Nominate Chancellor" && m.canVote && m.voting
  );

  const electionMeeting = meetings.find(
    (m) => m.actionName === "Election Vote" && m.voting
  );

  const executiveMeeting = meetings.find(
    (m) =>
      ["Execute", "Nominate as Presidential Candidate", "Investigate Loyalty"].includes(m.actionName) &&
      m.canVote && m.voting
  );

  const discardMeeting = meetings.find(
    (m) => m.actionName === "Discard Policy" && m.canVote && m.voting
  );

  const enactMeeting = meetings.find(
    (m) =>
      (m.actionName === "Enact Policy" || m.actionName === "Enact Policy (No Veto)") &&
      m.canVote && m.voting
  );

  const vetoMeeting = meetings.find(
    (m) => m.actionName === "Assent Veto" && m.canVote && m.voting
  );

  if (isPhoneDevice) {
    return (
      <div className="sd-game-board sd-game-board--mobile">
        <PolicyTracks
          policyInfo={extraInfo.policyInfo}
          presidentialPowersBoard={extraInfo.presidentialPowersBoard}
          electionTracker={extraInfo.electionInfo?.electionTracker}
          deckInfo={extraInfo.deckInfo}
        />
        <SDPolicyAction
          discardMeeting={discardMeeting}
          enactMeeting={enactMeeting}
          vetoMeeting={vetoMeeting}
          socket={game.socket}
        />
        <SDElectionVote
          electionMeeting={electionMeeting}
          selfId={game.self}
          socket={game.socket}
          mobile
        />
        <PlayerCircle
          players={players}
          candidateInfo={extraInfo.candidateInfo}
          nominationMeeting={nominationMeeting}
          executiveMeeting={executiveMeeting}
          electionMeeting={electionMeeting}
          voteResults={extraInfo.lastVoteResults}
          selfId={game.self}
          socket={game.socket}
          roles={state.roles || {}}
          mobile
          externalVoteButtons
        />
      </div>
    );
  }

  return (
    <div className="sd-game-board">
      <div className="sd-game-board-inner">
        <SDGameInfo setup={game.setup} />
        <PlayerCircle
          players={players}
          candidateInfo={extraInfo.candidateInfo}
          nominationMeeting={nominationMeeting}
          executiveMeeting={executiveMeeting}
          electionMeeting={electionMeeting}
          voteResults={extraInfo.lastVoteResults}
          selfId={game.self}
          socket={game.socket}
          roles={state.roles || {}}
          externalVoteButtons
        />
        <div className="sd-tracks-center-overlay">
          <PolicyTracks
            policyInfo={extraInfo.policyInfo}
            presidentialPowersBoard={extraInfo.presidentialPowersBoard}
            electionTracker={extraInfo.electionInfo?.electionTracker}
            deckInfo={extraInfo.deckInfo}
          />
        </div>
        <SDElectionVote
          electionMeeting={electionMeeting}
          selfId={game.self}
          socket={game.socket}
        />
        <SDPolicyAction
          discardMeeting={discardMeeting}
          enactMeeting={enactMeeting}
          vetoMeeting={vetoMeeting}
          socket={game.socket}
        />
      </div>
    </div>
  );
}

function SDGameInfo({ setup }) {
  const [expanded, setExpanded] = useState(true);

  const roleSet = setup?.roles?.[0];
  if (!roleSet) return null;

  // Role keys from the setup look like "Liberal:1:0" — strip the modifier suffix.
  const counts = { Liberal: 0, Fascist: 0, Dictator: 0 };
  for (const [roleKey, count] of Object.entries(roleSet)) {
    const name = roleKey.split(":")[0];
    if (name in counts) counts[name] += count;
  }

  // Per Secret Hitler rules (see WinWithFascists.js): the Dictator is revealed
  // their teammates only in 5–6 player games.
  const dictatorKnows = setup.total <= 6;

  return (
    <div
      className={`sd-game-info ${expanded ? "" : "sd-game-info--collapsed"}`}
      role="complementary"
      aria-label="Game info"
    >
      <button
        type="button"
        className="sd-game-info-title"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>Game Info</span>
        <i className="sd-game-info-chevron fas fa-chevron-down" />
      </button>
      {expanded && (
        <div className="sd-game-info-roles">
          <span className="sd-game-info-chip sd-game-info-chip--liberal">
            {counts.Liberal} Liberal
          </span>
          <span className="sd-game-info-chip sd-game-info-chip--fascist">
            {counts.Fascist} Fascist
          </span>
          <span className="sd-game-info-chip sd-game-info-chip--dictator">
            <span>{counts.Dictator} Dictator</span>
            <Tooltip
              title={dictatorKnows ? "Dictator knows Fascists" : "Dictator does not know Fascists"}
              placement="left"
              arrow
            >
              <i
                className={`sd-game-info-eye sd-game-info-eye--${dictatorKnows ? "yes" : "no"} fas ${dictatorKnows ? "fa-eye" : "fa-eye-slash"}`}
                aria-label={dictatorKnows ? "Dictator knows Fascists" : "Dictator does not know Fascists"}
              />
            </Tooltip>
          </span>
        </div>
      )}
    </div>
  );
}

function SDElectionVote({ electionMeeting, selfId, socket, mobile }) {
  if (!electionMeeting || !selfId) return null;
  const electionMemberIds = new Set(
    (electionMeeting.members || []).map((m) => m.id)
  );
  if (!electionMemberIds.has(selfId)) return null;

  const myVote = electionMeeting.votes?.[selfId];

  const handleVote = (choice) => {
    socket.send("vote", {
      meetingId: electionMeeting.id,
      selection: choice,
    });
  };

  return (
    <div className={`sd-election-vote${mobile ? " sd-election-vote--mobile" : ""}`}>
      <div className="sd-election-vote-label">YOUR VOTE</div>
      <div className="sd-vote-buttons sd-vote-buttons--large">
        <button
          className={`sd-vote-btn sd-vote-btn--large sd-vote-btn--ja${myVote === "Ja!" ? " sd-vote-btn--selected" : ""}${!myVote ? " sd-vote-btn--pending" : ""}`}
          onClick={() => handleVote("Ja!")}
        >
          Ja!
        </button>
        <button
          className={`sd-vote-btn sd-vote-btn--large sd-vote-btn--nein${myVote === "Nein!" ? " sd-vote-btn--selected" : ""}${!myVote ? " sd-vote-btn--pending" : ""}`}
          onClick={() => handleVote("Nein!")}
        >
          Nein!
        </button>
      </div>
    </div>
  );
}

