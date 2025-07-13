import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";

import { useErrorAlert } from "../../components/Alerts";
import { SubNav } from "../../components/Nav";
import { NameWithAvatar } from "../User/User";
import Setup from "../../components/Setup";
import { RoleCount } from "../../components/Roles";
import { Time } from "../../components/Basic";
import { capitalize } from "../../utils";

import "../../css/gameReview.css";

export default function Review() {
  const [game, setGame] = useState();
  const [stateList, setStateList] = useState([]);
  const [gameState, setGameState] = useState(0);
  const errorAlert = useErrorAlert();
  const { gameId } = useParams();
  const history = useHistory();

  useEffect(() => {
    axios
      .get(`/game/${gameId}/review`)
      .then((res) => {
        res.data.history = JSON.parse(res.data.history);
        setGame(res.data);
        setStateList(Object.keys(res.data.history));
      })
      .catch((e) => {
        errorAlert(e);
        history.push("/play");
      });
  }, []);

  function onArrowClick(dir) {
    if (dir == "left" && gameState > 0) setGameState(gameState - 1);
    else if (dir == "right" && gameState < stateList.length - 1)
      setGameState(gameState + 1);
  }

  function formatGameState(gameState) {
    var gameState = stateList[gameState];

    if (gameState) {
      gameState = gameState.split("-");

      if (gameState[0] == "pregame") gameState = "Pregame";
      else if (gameState[0] == "post") gameState = "Postgame";
      else {
        gameState[0] = capitalize(gameState[0]);
        gameState = gameState.join(" ");
      }

      return gameState;
    }
  }

  const players =
    game &&
    game.players.map((player, i) => {
      return (
        <div className="row" key={player.id}>
          <RoleCount role={game.roles[i]} gameType={game.type} />
          <NameWithAvatar
            id={player.id}
            name={game.names[i]}
            avatar={player.avatar}
          />
        </div>
      );
    });

  const details = [];

  if (game) {
    if (game.ranked)
      details.push(
        <div className="row" key={0}>
          Ranked <div className="dim">No</div>
        </div>
      );
    else
      details.push(
        <div className="row" key={0}>
          Ranked <div className="dim">No</div>
        </div>
      );
    if (game.competitive)
      details.push(
        <div className="row" key={0}>
          Competitive <div className="dim">No</div>
        </div>
      );
    else
      details.push(
        <div className="row" key={0}>
          Competitive <div className="dim">No</div>
        </div>
      );

    let date = new Date(game.startTime);
    details.push(
      <div className="row" key={1}>
        Day Started <div className="dim">{date.toDateString()}</div>
      </div>
    );
    details.push(
      <div className="row" key={2}>
        Time Started <div className="dim">{date.toLocaleTimeString()}</div>
      </div>
    );

    details.push(
      <div className="row" key={3}>
        Duration{" "}
        <div className="dim">
          {<Time millisec={game.endTime - game.startTime} />}
        </div>
      </div>
    );

    details.push(
      <div className="row" key={4}>
        Day Length{" "}
        <div className="dim">
          {<Time millisec={game.stateLengths["Day"]} />}
        </div>
      </div>
    );
    details.push(
      <div className="row" key={5}>
        Night Length{" "}
        <div className="dim">
          {<Time millisec={game.stateLengths["Night"]} />}
        </div>
      </div>
    );
  }

  var gameContent = [];

  if (game && stateList.length > gameState) {
    gameContent = game.history[stateList[gameState]].map((item, i) => {
      var colorClass = "";

      if (item.indexOf("%r%") == 0) {
        colorClass = "review-server";
        item = item.replace("%r%", "");
      }

      return (
        <div className={`row ${colorClass}`} key={i}>
          {item}
        </div>
      );
    });
  }

  return (
    <>
      <SubNav
        links={[{ text: `Game ${gameId}`, path: `/game/${gameId}/review` }]}
      />
      <div className="inner-content game-review">
        <div className="column">
          <div className="box-panel players">
            <div className="heading">Players</div>
            <div className="content">{players}</div>
          </div>
        </div>
        <div className="column">
          <div className="box-panel">
            <div className="heading">Setup</div>
            <div className="content">
              {game && <Setup setup={game.setup} />}
            </div>
          </div>
          <div className="box-panel">
            <div className="heading">Details</div>
            <div className="content">{details}</div>
          </div>
        </div>
        <div className="box-panel review">
          <div className="heading">Review</div>
          <div className="content">
            <div className="game-state">
              {gameState != 0 && (
                <i
                  className="fas fa-caret-left arrow"
                  onClick={() => onArrowClick("left")}
                />
              )}
              <div className="state-name">{formatGameState(gameState)}</div>
              {gameState < stateList.length - 1 && (
                <i
                  className="fas fa-caret-right arrow"
                  onClick={() => onArrowClick("right")}
                />
              )}
            </div>
            <div className="game-content">{gameContent}</div>
          </div>
        </div>
      </div>
    </>
  );
}
