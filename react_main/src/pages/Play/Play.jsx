import React, { useState, useContext, useEffect } from "react";
import {
  Route,
  Switch,
  Redirect,
  useLocation,
  useHistory,
} from "react-router-dom";

import Host from "./Host/Host";
import CreateSetup from "./CreateSetup/CreateSetup";

import { UserContext } from "../../Contexts";

import "../../css/play.css";
import DeckSelector from "./Decks/DeckSelector";
import CreateDecks from "./Decks/CreateDeck";
import { LobbyBrowser } from "./LobbyBrowser/LobbyBrowser";

export default function Play(props) {
  const defaultGameType = "Mafia";

  const user = useContext(UserContext);
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const inLobby = location.pathname === "/play";
  const [gameType, setGameType] = useState(
    params.get("game") || localStorage.getItem("gameType") || defaultGameType
  );

  const links = [
    {
      text: "Play",
      path: "/play",
      exact: true,
    },
    {
      text: "Host",
      path: `/play/host`,
      hide: !user.loggedIn,
    },
    {
      text: "Create Setup",
      path: `/play/create`,
      hide: !user.loggedIn,
    },
    {
      text: "Decks",
      path: `/play/decks`,
      hide: !user.loggedIn,
    },
    {
      text: "Create Deck",
      path: `/play/createDeck`,
      hide: !user.loggedIn,
    },
  ];

  useEffect(() => {
    localStorage.setItem("gameType", gameType);

    if (!inLobby && !params.get("edit") && params.get("game") !== gameType)
      history.push(location.pathname + `?game=${gameType}`);
  }, [location.pathname, gameType]);
  if (user.loaded && !user.loggedIn) return <Redirect to="/" />;

  function onFilterGameType(gameType) {
    setGameType(gameType);
  }

  return (
    <>
      <div className="inner-content play">
        <Switch>
          <Route exact path="/play" render={() => <LobbyBrowser />} />
          <Route exact path="/play/host" render={() => <Host />} />
          <Route exact path="/play/decks" render={() => <DeckSelector />} />
          <Route exact path="/play/create" render={() => <CreateSetup />} />
          <Route exact path="/play/createDeck" render={() => <CreateDecks />} />

          <Route render={() => <Redirect to="/play" />} />
        </Switch>
      </div>
    </>
  );
}

export function BotBarLink(props) {
  const active = props.sel.toLowerCase() === props.text.toLowerCase();

  return (
    <div
      className={`top-link ${active ? "active" : ""}`}
      onClick={props.onClick}
    >
      {props.text}
    </div>
  );
}
