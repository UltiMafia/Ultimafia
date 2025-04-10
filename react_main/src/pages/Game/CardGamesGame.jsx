import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  BotBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  OptionsList,
  Timer,
  Notes,
  SettingsMenu,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";

import "../../css/game.css";
import "../../css/gameCardGames.css";

export default function CardGamesGame(props) {
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

  const gameType = "Card Games";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  const audioFileNames = ["diceRoll", "diceRoll2", "gunshot"];
  const audioLoops = [];
  const audioOverrides = [];
  const audioVolumes = [];

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    game.loadAudioFiles(
      audioFileNames,
      audioLoops,
      audioOverrides,
      audioVolumes
    );

    // Make game review start at pregame
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", (state) => {
      if (playBellRef.current) game.playAudio("ping");

      playBellRef.current = true;

      // for (let stateName of stateNames)
      // 	if (state.name.indexOf(stateName) == 0)
      // 		game.playAudio(stateName);
    });

    socket.on("winners", (winners) => {
      // game.stopAudios(stateNames);
      // if (winners.groups.indexOf("Resistance") != -1)
      // 	game.playAudio("resistancewin");
      // else
      // 	game.playAudio("spieswin");
    });
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

  return (
    <>
      <BotBar
        gameType={gameType}
        setup={game.setup}
        history={history}
        stateViewing={stateViewing}
        updateStateViewing={updateStateViewing}
        players={players}
        socket={game.socket}
        options={game.options}
        spectatorCount={game.spectatorCount}
        setLeave={game.setLeave}
        finished={game.finished}
        review={game.review}
        setRehostId={game.setRehostId}
        noLeaveRef={game.noLeaveRef}
        dev={game.dev}
        ThePot={game.ThePot}
        gameName={
          <div className="game-name">
            <span
              style={{
                color: history.states?.[stateViewing]?.extraInfo
                  ?.isTheFlyingDutchman
                  ? "#48654e"
                  : "#8B0000",
              }}
            >
              Card Games
            </span>
          </div>
        }
        timer={<Timer timers={game.timers} history={history} />}
        hideStateSwitcher
      />
      <ThreePanelLayout
        leftPanelContent={
          <>
            {history.currentState == -1 && (
              <PlayerList
                players={players}
                history={history}
                gameType={gameType}
                stateViewing={stateViewing}
                activity={game.activity}
              />
            )}
            <LiarsDiceDiceViewWrapper
              history={history}
              stateViewing={stateViewing}
              self={self}
            />
            <SettingsMenu
              settings={game.settings}
              updateSettings={game.updateSettings}
              showMenu={game.showMenu}
              setShowMenu={game.setShowMenu}
              stateViewing={stateViewing}
            />
          </>
        }
        centerPanelContent={
          <>
            <TextMeetingLayout
              combineMessagesFromAllMeetings
              socket={game.socket}
              history={history}
              updateHistory={updateHistory}
              players={players}
              stateViewing={stateViewing}
              settings={game.settings}
              filters={game.speechFilters}
              options={game.options}
              setup={game.setup}
              localAudioTrack={game.localAudioTrack}
            />
          </>
        }
        rightPanelContent={
          <>
            {history.currentState == -1 && (
              <OptionsList
                players={players}
                history={history}
                gameType={gameType}
                gameOptions={gameOptions}
                stateViewing={stateViewing}
                activity={game.activity}
              />
            )}
            {history.currentState != -1 && (
              <ThePot
                players={players}
                history={history}
                gameType={gameType}
                stateViewing={stateViewing}
                activity={game.activity}
              />
            )}
            <CommunityCards
              history={history}
              stateViewing={stateViewing}
              self={self}
            />
            <ActionList
              socket={game.socket}
              meetings={meetings}
              players={players}
              self={self}
              history={history}
              stateViewing={stateViewing}
              title="Make A Bid!"
              style={{
                color: history.states?.[stateViewing]?.extraInfo
                  ?.isTheFlyingDutchman
                  ? "#718E77"
                  : undefined,
              }}
            />
            {!isSpectator && <Notes stateViewing={stateViewing} />}
          </>
        }
      />
    </>
  );
}

export function ThePot(props) {
  const history = props.history;
  const stateViewing = props.stateViewing;
  const self = props.self;

  if (stateViewing < 0) return <></>;

  const extraInfo = history.states[stateViewing].extraInfo;

  return (
    <SideMenu
      title="The Pot"
      scrollable
      content={
        <table className="options-table">
          <tbody>
            The Pot:
            {extraInfo.ThePot}
          </tbody>
        </table>
      }
    />
  );
}

function CommunityCards(props) {
  const history = props.history;
  const stateViewing = props.stateViewing;
  const self = props.self;

  if (stateViewing < 0) return <></>;

  const extraInfo = history.states[stateViewing].extraInfo;

  return (
    <SideMenu
      title="Community Cards"
      scrollable
      className="liars-dice-wrapper"
      content={
        <div className="liars-dice-players-container">
          {
        <div className="current-rolls">
          {extraInfo.CommunityCards.map((value, index) => (
            <div
              key={index}
              className={`dice ${`c${value}`}`}
            ></div>
          ))}
        </div>
          }
        </div>
      }
    />
  );
}

function LiarsDiceDiceViewWrapper(props) {
  const history = props.history;
  const stateViewing = props.stateViewing;
  const self = props.self;

  if (stateViewing < 0) return <></>;

  const extraInfo = history.states[stateViewing].extraInfo;

  return (
    <SideMenu
      title="Hand"
      scrollable
      className="liars-dice-wrapper"
      content={
        <div className="liars-dice-players-container">
          {extraInfo.randomizedPlayers.map((player, index) => (
            <LiarsDicePlayerRow
              key={index}
              userId={player.userId}
              playerName={player.playerName}
              CardsInHand={player.CardsInHand}
              Chips={player.Chips}
              Bets={player.Bets}
              isCurrentPlayer={player.playerId === self}
              isTheFlyingDutchman={extraInfo.isTheFlyingDutchman}
              whoseTurnIsIt={extraInfo.whoseTurnIsIt}
            />
          ))}
        </div>
      }
    />
  );
}

function LiarsDicePlayerRow({
  userId,
  playerName,
  CardsInHand,
  Chips,
  Bets,
  isCurrentPlayer,
  isTheFlyingDutchman,
  whoseTurnIsIt,
}) {
  Chips = Chips || 0;
  Bets = Bets || 0;
  const isSamePlayer = whoseTurnIsIt === userId;
  return (
    <div className="liars-dice-player-section">
      <div
        className={`liars-dice-player-name ${
          isCurrentPlayer ? "current-player" : ""
        }`}
        style={
          isTheFlyingDutchman
            ? {
                backgroundColor: isCurrentPlayer ? "#506D56" : "#48654e",
                borderColor: "#3B5841",
                cursor: "pointer",
              }
            : {
                cursor: "pointer",
              }
        }
        onClick={() => window.open(`/user/${userId}`, "_blank")}
      >
        {playerName}
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
          {CardsInHand.map((value, index) => (
            <div
              key={index}
              className={`dice ${
                isCurrentPlayer ? `c${value}` : "card-unknown"
              }`}
            ></div>
          ))}
        </div>
        {Chips > 0 && (
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
                Chips:
              </div>
              <div className="previous-rolls-dice">{Chips}</div>
            </div>
          </>
        )}
        {Bets > 0 && (
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
                Current Bid:
              </div>
              <div className="previous-rolls-dice">{Bets}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
