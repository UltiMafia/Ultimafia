import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  SettingsMenu,
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { Avatar } from "../User/User";
import { GameContext } from "../../Contexts";
import { liarsDiceAudioConfig } from "../../audio/audioConfigs";

import "css/game.css";
import "css/gameLiarsDice.css";
import { Button, Popover } from "@mui/material";

const isKickMeeting = (m) => m && m.name === "Vote Kick";
const KickActionList = () => (
  <ActionList meetingFilter={isKickMeeting} hideIfEmpty scrollable={false} />
);

export default function LiarsDiceGame(props) {
  const game = useContext(GameContext);

  const history = game.history;
  const updateHistory = game.updateHistory;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;
  const isSpectator = game.isSpectator;
  const gameOptions = game.options.gameTypeOptions;

  const playBellRef = useRef(false);
  const [showRulesModal, setShowRulesModal] = useState(true);

  const gameType = "Liars Dice";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    game.loadAudioFiles(liarsDiceAudioConfig);

    // Make game review start at pregame
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", (state) => {
      if (playBellRef.current) game.playAudio("ping");

      playBellRef.current = true;
    });

    socket.on("winners", (winners) => {});
    socket.on("diceRoll", () => {
      game.playAudio("diceRoll");
    });
    socket.on("diceRoll2", () => {
      game.playAudio("diceRoll2");
    });
    socket.on("gunshot", () => {
      game.playAudio("gunshot");
    });
  }, game.socket);

  const board = (
    <LiarsDiceBoard
      history={history}
      stateViewing={stateViewing}
      self={self}
    />
  );

  return (
    <GameTypeContext.Provider
      value={{
        singleState: true,
      }}
    >
      <TopBar hideStateSwitcher />
      <ThreePanelLayout
        leftPanelContent={
          <>
            {stateViewing < 0 && <PlayerList />}
            <KickActionList />
            <SettingsMenu />
          </>
        }
        centerPanelContent={board}
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
            <PlayerList />
            <KickActionList />
          </>
        }
        innerRightNavigationProps={{
          label: "Game",
          value: "actions",
          icon: <i className="fas fa-gamepad" />,
        }}
        innerRightContent={board}
      />
      {showRulesModal && (
        <LiarsDiceRulesModal
          options={gameOptions || {}}
          onClose={() => setShowRulesModal(false)}
        />
      )}
    </GameTypeContext.Provider>
  );
}

function LiarsDiceRulesModal({ options, onClose }) {
  return (
    <div className="ld-modal-backdrop" onClick={onClose}>
      <div className="ld-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="ld-modal-title">Liars Dice — Active Rules</h2>
        <ul className="ld-modal-list">
          <li>
            Everyone starts with{" "}
            <b>{options.startingDice ?? 5}</b> dice.
          </li>
          {options.wildOnes && (
            <li>
              <b>Wild Ones</b> — ones count towards any face amount.
            </li>
          )}
          {options.spotOn && (
            <li>
              <b>Spot On</b> — on your turn, guess the previous bidder called
              the exact amount. If right, everyone else loses a die.
            </li>
          )}
        </ul>
        <button className="ld-modal-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

function LiarsDiceBoard({ history, stateViewing, self }) {
  if (stateViewing < 0) return null;

  const extraInfo = history.states[stateViewing]?.extraInfo || {};
  const isTheFlyingDutchman = extraInfo.isTheFlyingDutchman;
  const whoseTurnIsIt = extraInfo.whoseTurnIsIt;
  const players = extraInfo.randomizedPlayers || [];

  return (
    <div className="liars-dice-wrapper ld-board">
      <div className="liars-dice-players-container">
        {players.map((player, index) => (
          <LiarsDicePlayerRow
            key={index}
            userId={player.userId}
            playerName={player.playerName}
            avatar={player.avatar}
            diceValues={player.rolledDice}
            previousRolls={player.previousRolls}
            isCurrentPlayer={player.playerId === self}
            isTheFlyingDutchman={isTheFlyingDutchman}
            whoseTurnIsIt={whoseTurnIsIt}
          />
        ))}
      </div>
      <LiarsDiceBetForm />
    </div>
  );
}

// Mirrors UHH_VARIANT_COUNT / GENIUS_VARIANT_COUNT in
// Games/types/LiarsDice/items/Microphone.js. The server picks an index; the
// client renders the matching template on the board so the dice icon stays
// inline. Keep the array lengths in sync with the server constants.
const LD_UHH_VARIANTS = [
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> guesses uhh.. <b>{amount}</b>x {die} 's?
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> guesses... <b>{amount}</b>x {die} 's? Huh?
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> guesses... <b>{amount}</b>x {die} 's? Sorry, did I hear
      that right?
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{amount}</b>x {die} 's from <b>{name}</b>? Could you repeat that bid?
    </>
  ),
  ({ name, amount, die }) => (
    <>
      "<b>{amount}</b>x {die} 's?" <b>{name}</b>, I just want to confirm I have
      that correct.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b>, I think I missed your bid - was it <b>{amount}</b>x {die}{" "}
      's you said?
    </>
  ),
];

const LD_GENIUS_VARIANTS = [
  ({ name, amount, die, allDice }) => (
    <>
      We have a genius in here! <b>{name}</b> thinks there are <b>{amount}</b>x{" "}
      {die} 's among these {allDice}.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      Putting the 'liar' in Liar's Dice — <b>{name}</b> thinks there are{" "}
      <b>{amount}</b>x {die} 's.
    </>
  ),
  ({ name, amount, die, allDice }) => (
    <>
      <b>{name}</b> would like us all to believe there are <b>{amount}</b>x{" "}
      {die} 's among these {allDice} dice!
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> bids <b>{amount}</b>x {die} 's! I'm sure nobody would think
      of calling a lie on this one.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> bids <b>{amount}</b>x {die} 's. Seems legit to me!
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> says there are <b>{amount}</b>x {die} 's. I believe them!
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{amount}</b>x {die} 's? If <b>{name}</b> says so, it must be true!
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> bids <b>{amount}</b>x {die} 's. I have no reason to doubt
      them.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      If <b>{name}</b> says there are <b>{amount}</b>x {die} 's, who are we to
      question such wisdom?
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> bids <b>{amount}</b>x {die} 's. The confidence is truly
      inspiring.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> believes there are <b>{amount}</b>x {die} 's. And I thought
      I'd seen it all!
    </>
  ),
  ({ name, amount, die }) => (
    <>
      Ladies and gentlemen, behold: <b>{name}</b> and their astonishing bid of{" "}
      <b>{amount}</b>x {die} 's!
    </>
  ),
  ({ name, amount, die }) => (
    <>
      Apparently, <b>{name}</b> knows something we don't with a bid of{" "}
      <b>{amount}</b>x {die} 's.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      Wow, <b>{name}</b> just redefined optimism with a bid of <b>{amount}</b>x{" "}
      {die} 's.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      If confidence were dice, <b>{name}</b> would definitely have{" "}
      <b>{amount}</b>x {die} 's.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      Did <b>{name}</b> say <b>{amount}</b>x {die} 's? That's... ambitious.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> bids <b>{amount}</b>x {die} 's. I guess we're all in for a
      surprise.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b>, are you sure you meant <b>{amount}</b>x {die} 's? That's
      quite a number.
    </>
  ),
  ({ name, amount, die }) => (
    <>
      According to <b>{name}</b>, there are <b>{amount}</b>x {die} 's. Any
      challengers?
    </>
  ),
  ({ name, amount, die }) => (
    <>
      <b>{name}</b> claims there are <b>{amount}</b>x {die} 's. I guess we'll
      see.
    </>
  ),
];

function LiarsDiceBetForm() {
  const game = useContext(GameContext);
  const { history, stateViewing, socket } = game;

  const [amount, setAmount] = useState("");
  const [face, setFace] = useState(null);
  const [faceMenuAnchor, setFaceMenuAnchor] = useState(null);
  const [bidError, setBidError] = useState("");

  const currentState =
    stateViewing >= 0 ? history.states[stateViewing] : null;
  const bidInfo = currentState?.extraInfo?.bidInfo || {};
  const lastBidderName = bidInfo.lastBidder ?? null;

  // On every new bid (turn change): clear stale error and pre-fill the
  // amount input with the minimum legal next bid (previous + 1) so the
  // player only has to pick a face and submit.
  useEffect(() => {
    setBidError("");
    const last = parseInt(bidInfo.lastAmountBid, 10) || 0;
    setAmount(String(last + 1));
  }, [lastBidderName, bidInfo.lastAmountBid, bidInfo.lastFaceBid]);

  if (stateViewing < 0) return null;

  const meetings = currentState?.meetings || {};

  const meetingByName = (name) =>
    Object.values(meetings).find((m) => m.name === name);
  const amountMeeting = meetingByName("Amount");
  const faceMeeting = meetingByName("Face");
  const callLieMeeting = meetingByName("CallLie");
  const spotOnMeeting = meetingByName("SpotOn");

  const isMyTurn = !!amountMeeting && !!faceMeeting;
  const hasPriorBid = bidInfo.lastBidder != null;

  // Nothing meaningful to show: no prior bid AND not my turn.
  if (!hasPriorBid && !isMyTurn) return null;

  const lastAmount = parseInt(bidInfo.lastAmountBid, 10) || 0;
  const lastFace = parseInt(bidInfo.lastFaceBid, 10) || 0;
  const minAmount = lastAmount > 0 ? lastAmount : 1;
  const maxAmount = bidInfo.allDice || 99;
  const canBet = isMyTurn && parseInt(amount, 10) > 0 && !!face;

  const submitBet = () => {
    if (!isMyTurn) return;
    const parsed = parseInt(amount, 10);
    if (!parsed || !face) return;
    const parsedFace = parseInt(face, 10);
    if (parsed < lastAmount) {
      setBidError("You can't bid lower than the previous player.");
      return;
    }
    if (parsed === lastAmount && parsedFace <= lastFace) {
      setBidError(
        "You must increase either the amount or the face value of the previous bid."
      );
      return;
    }
    setBidError("");
    socket.send("vote", {
      meetingId: amountMeeting.id,
      selection: String(parsed),
    });
    // Stagger the second vote — the server's vote-spam rate-limit penalizes
    // near-zero gaps (`1 / (ms+1) * 1000` per vote), so two sends within the
    // same tick trip "voting too quickly".
    setTimeout(() => {
      socket.send("vote", {
        meetingId: faceMeeting.id,
        selection: `dice${face}`,
      });
    }, 200);
  };

  const submitCallBluff = () => {
    if (!callLieMeeting) return;
    socket.send("vote", {
      meetingId: callLieMeeting.id,
      selection: "Yes!",
    });
  };

  const submitSpotOn = () => {
    if (!spotOnMeeting) return;
    socket.send("vote", {
      meetingId: spotOnMeeting.id,
      selection: "Yes!",
    });
  };

  return (
    <div className="ld-bet-form ld-bet-form-mine">
      {hasPriorBid && (
        <div className="ld-prev-bid-row">
          <span className="ld-prev-bid-text">
            {(() => {
              const die = (
                <span
                  className={`dice dice-${bidInfo.lastFaceBid} ld-inline-die`}
                />
              );
              const props = {
                name: bidInfo.lastBidder,
                amount: bidInfo.lastAmountBid,
                allDice: bidInfo.allDice,
                die,
              };
              if (typeof bidInfo.geniusVariant === "number") {
                return LD_GENIUS_VARIANTS[bidInfo.geniusVariant](props);
              }
              if (typeof bidInfo.uhhVariant === "number") {
                return LD_UHH_VARIANTS[bidInfo.uhhVariant](props);
              }
              return (
                <>
                  <b>{bidInfo.lastBidder}</b> guesses that there are at least{" "}
                  <b>{bidInfo.lastAmountBid}</b> die showing {die}
                </>
              );
            })()}
          </span>
          {isMyTurn && (
            <div className="ld-call-group">
              {callLieMeeting && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={submitCallBluff}
                  className="ld-action-btn ld-bluff-btn"
                >
                  CALL BLUFF
                </Button>
              )}
              {spotOnMeeting && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={submitSpotOn}
                  className="ld-action-btn ld-spoton-btn"
                >
                  SPOT ON
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {bidInfo.annoyedJustTriggered && (
        <div className="ld-bet-announcement">
          For the rest of the round, bids can only increase amount by 1.
        </div>
      )}
      {isMyTurn && (
        <>
          <div className="ld-bet-header">Up the bet!</div>
          <div className="ld-bet-row">
            <span className="ld-bet-text">There are at least</span>
            <input
              type="number"
              className="ld-amount-input"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (bidError) setBidError("");
              }}
              min={minAmount}
              max={maxAmount}
              placeholder={String(minAmount)}
            />
            <span className="ld-bet-text">die showing the number</span>
            <button
              type="button"
              className="ld-face-trigger"
              onClick={(e) => setFaceMenuAnchor(e.currentTarget)}
            >
              <span
                className={`dice ${face ? `dice-${face}` : "dice-unknown"} ld-face-die`}
              />
            </button>
            <Popover
              open={Boolean(faceMenuAnchor)}
              anchorEl={faceMenuAnchor}
              onClose={() => setFaceMenuAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}
              disableRestoreFocus
            >
              <div className="ld-face-menu">
                {[1, 2, 3, 4, 5, 6].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="ld-face-option"
                    onClick={() => {
                      setFace(f);
                      if (bidError) setBidError("");
                      setFaceMenuAnchor(null);
                    }}
                  >
                    <span className={`dice dice-${f}`} />
                  </button>
                ))}
              </div>
            </Popover>
            <Button
              variant="contained"
              size="small"
              onClick={submitBet}
              disabled={!canBet}
              className="ld-action-btn ld-bet-btn"
            >
              BET
            </Button>
          </div>
          {bidError && <div className="ld-bet-error">{bidError}</div>}
        </>
      )}
    </div>
  );
}

function LiarsDicePlayerRow({
  userId,
  playerName,
  avatar,
  diceValues,
  previousRolls,
  isCurrentPlayer,
  isTheFlyingDutchman,
  whoseTurnIsIt,
}) {
  previousRolls = previousRolls || [];
  const isSamePlayer = whoseTurnIsIt === userId;
  return (
    <div className="liars-dice-player-section">
      <div
        className="ld-player-avatar"
        onClick={() => window.open(`/user/${userId}`, "_blank")}
      >
        <Avatar id={userId} name={playerName} hasImage={avatar} />
        <div
          className={`ld-player-name-small ${
            isCurrentPlayer ? "current-player" : ""
          }`}
        >
          {isSamePlayer && (
            <span className="ld-turn-dot ld-turn-dot-mine ld-name-dot" />
          )}
          {playerName}
        </div>
      </div>
      <div
        className="liars-dice-dice-container"
        style={
          isTheFlyingDutchman
            ? {
                borderColor: isSamePlayer ? "grey" : "#3B5841",
              }
            : {
                borderColor: isSamePlayer ? "grey" : undefined,
              }
        }
      >
        <div className="current-rolls">
          {diceValues.map((value, index) => (
            <div
              key={index}
              className={`dice ${
                isCurrentPlayer ? `dice-${value}` : "dice-unknown"
              }`}
            ></div>
          ))}
        </div>
        {previousRolls.length > 0 && (
          <>
            <div className="previous-rolls">
              <div
                className="previous-rolls-label"
                style={
                  isTheFlyingDutchman
                    ? {
                        color: "#3B5841",
                      }
                    : {}
                }
              >
                Last round:
              </div>
              <div className="previous-rolls-dice">
                {previousRolls.map((value, index) => (
                  <div
                    key={index}
                    className={`dice previous-rolls dice-${value}`}
                  ></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
