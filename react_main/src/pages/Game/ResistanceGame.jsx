import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  useStateViewingReducer,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  SpeechFilter,
  Notes,
} from "./Game";
import { GameContext } from "../../Contexts";

import { SideMenu } from "./Game";
import "../../css/game.css";

export default function ResistanceGame(props) {
  const game = useContext(GameContext);

  const history = game.history;
  const updateHistory = game.updateHistory;
  const updatePlayers = game.updatePlayers;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;
  const isSpectator = game.isSpectator;

  const playBellRef = useRef(false);

  const gameType = "Resistance";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  const stateEvents = history.states[stateViewing]
    ? history.states[stateViewing].stateEvents
    : [];
  const stateNames = ["Team Selection", "Team Approval", "Mission", "Epilogue"];
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
      if (playBellRef.current) game.playAudio("bell");

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
        dev={game.dev}
        gameName={
          <div className="game-name">
            <span>R</span>esistance
          </div>
        }
        timer={<Timer timers={game.timers} history={history} />}
      />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <PlayerList
              players={players}
              history={history}
              gameType={gameType}
              stateViewing={stateViewing}
              activity={game.activity}
            />
            <SpeechFilter
              filters={game.speechFilters}
              setFilters={game.setSpeechFilters}
              stateViewing={stateViewing}
            />
          </>
        }
        centerPanelContent={
          <>
            <TextMeetingLayout
              socket={game.socket}
              history={history}
              updateHistory={updateHistory}
              players={players}
              stateViewing={stateViewing}
              settings={game.settings}
              filters={game.speechFilters}
              options={game.options}
              agoraClient={game.agoraClient}
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
            <ScoreKeeper
              numMissions={game.setup.numMissions}
              history={history}
              stateViewing={stateViewing}
            />
            <ActionList
              socket={game.socket}
              meetings={meetings}
              players={players}
              self={self}
              history={history}
              stateViewing={stateViewing}
            />
            {!isSpectator && <Notes stateViewing={stateViewing} />}
          </>
        }
      />
    </>
  );
}

function ScoreKeeper(props) {
  const numMissions = props.numMissions;
  const history = props.history;

  const stateViewing = props.stateViewing;

  if (stateViewing < 0) return <></>;

  const missionRecord = history.states[stateViewing].extraInfo;

  return (
    <SideMenu
      title="Game Info"
      scrollable
      content={
        <>
          <MissionInfo numMissions={numMissions} />
          <Score score={missionRecord?.score} />
          <MissionHistory missionHistory={missionRecord?.missionHistory} />
        </>
      }
    />
  );
}

function MissionInfo(props) {
  return (
    <div className="rst">
      <div className="rst-name">Total Missions</div>
      {props.numMissions}
    </div>
  );
}

function Score(props) {
  var score = props.score || { rebels: 0, spies: 0 };

  return (
    <div className="rst-score">
      <ScoreBox team="rebels" scoreValue={score["rebels"] || 0} />
      <ScoreBox team="spies" scoreValue={score["spies"] || 0} />
    </div>
  );
}

function ScoreBox(props) {
  function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return (
    <div className="rst-score-box">
      <div className="rst-score-box-name">
        {capitaliseFirstLetter(props.team)}
      </div>
      <div className={`rst-score-box-value rst-score-box-${props.team || ""}`}>
        {props.scoreValue}
      </div>
    </div>
  );
}

function MissionHistory(props) {
  const missionHistory = props.missionHistory || [];

  const missionHistoryView = missionHistory.map((history, i) => {
    const success = history.numFails === 0 ? "success" : "fail";

    let teamMembers = history.team.join(" ");

    if (history.numFails === -1) {
      return (
        <div className="rst-mh-row">
          <div className={`rst-mh-status rst-mh-${success}`}>X</div>

          <div className="rst-mh-team">rejected</div>
        </div>
      );
    }

    return (
      <div className="rst-mh-row">
        <div className={`rst-mh-status rst-mh-${success}`}>
          {history.numFails}
        </div>

        <div className="rst-mh-team">{teamMembers}</div>
      </div>
    );
  });

  return (
    <div className="rst">
      <div className="rst-name">Mission History</div>
      <div className="rst-mh-all-rows">{missionHistoryView}</div>
    </div>
  );
}
