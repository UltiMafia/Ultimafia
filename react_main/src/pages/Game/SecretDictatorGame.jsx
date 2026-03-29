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
            <SpeechFilter />
          </>
        }
        innerRightContent={
          <>
            <GameBoard history={history} stateViewing={stateViewing} />
          </>
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

  if (stateViewing === -1) return null;

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

  return (
    <div className="sd-game-board">
      <div className="sd-game-board-inner">
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
         
        />
        <div className="sd-tracks-center-overlay">
          <PolicyTracks
            policyInfo={extraInfo.policyInfo}
            presidentialPowersBoard={extraInfo.presidentialPowersBoard}
            electionTracker={extraInfo.electionInfo?.electionTracker}
            deckInfo={extraInfo.deckInfo}
          />
        </div>
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

