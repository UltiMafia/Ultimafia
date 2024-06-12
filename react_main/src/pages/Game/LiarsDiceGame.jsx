import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  Notes,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";

import "../../css/game.css";
import "../../css/gameLiarsDice.css";

export default function LiarsDiceGame(props) {
  const game = useContext(GameContext);

  const history = game.history;
  const updateHistory = game.updateHistory;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;
  const isSpectator = game.isSpectator;

  const playBellRef = useRef(false);

  const gameType = "Liars Dice";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  const audioFileNames = [];
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
  }, game.socket);

  return (
    <>
      <TopBar
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
        setShowSettingsModal={game.setShowSettingsModal}
        setRehostId={game.setRehostId}
        noLeaveRef={game.noLeaveRef}
        dev={game.dev}
        gameName={
          <div className="game-name">
            <span style={{ color: "#8B0000" }}>Liars Dice</span>
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
              // agoraClient={game.agoraClient}
              localAudioTrack={game.localAudioTrack}
              setActiveVoiceChannel={game.setActiveVoiceChannel}
              muted={game.muted}
              setMuted={game.setMuted}
              deafened={game.deafened}
              setDeafened={game.setDeafened}
            />
          </>
        }
        rightPanelContent={
          <>
            <ActionList
              socket={game.socket}
              meetings={meetings}
              players={players}
              self={self}
              history={history}
              stateViewing={stateViewing}
              title="Make A Bid!"
            />
            {!isSpectator && <Notes stateViewing={stateViewing} />}
          </>
        }
      />
    </>
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
      title="Dice"
      scrollable
      className="liars-dice-wrapper"
      content={
        <div className="liars-dice-players-container">
          {extraInfo.randomizedPlayers.map((player, index) => (
            <LiarsDicePlayerRow
              key={index}
              playerName={player.playerName}
              diceValues={player.rolledDice}
              previousRolls={player.previousRolls}
              isCurrentPlayer={player.playerId === self}
            />
          ))}
        </div>
      }
    />
  );
}

function LiarsDicePlayerRow({
  playerName,
  diceValues,
  previousRolls,
  isCurrentPlayer,
}) {
  previousRolls = previousRolls || [];

  return (
    <div className="liars-dice-player-section">
      <div
        className={`liars-dice-player-name ${
          isCurrentPlayer ? "current-player" : ""
        }`}
      >
        {playerName}
      </div>
      <div className="liars-dice-dice-container">
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
              <div className="previous-rolls-label">Last round:</div>
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
