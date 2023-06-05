import React, { useState, useContext, useEffect } from "react";
import {
  Route,
  Switch,
  Redirect,
  useLocation,
  useHistory,
} from "react-router-dom";

import Join from "./Join";

import HostMafia from "./Host/HostMafia";
import CreateMafiaSetup from "./CreateSetup/CreateMafiaSetup";
import LearnMafia from "./Learn/LearnMafia";

import HostSplitDecision from "./Host/HostSplitDecision";
import CreateSplitDecisionSetup from "./CreateSetup/CreateSplitDecisionSetup";
import LearnSplitDecision from "./Learn/LearnSplitDecision";

import HostResistance from "./Host/HostResistance";
import CreateResistanceSetup from "./CreateSetup/CreateResistanceSetup";
import LearnResistance from "./Learn/LearnResistance";

import HostOneNight from "./Host/HostOneNight";
import CreateOneNightSetup from "./CreateSetup/CreateOneNightSetup";
import LearnOneNight from "./Learn/LearnOneNight";

import HostGhost from "./Host/HostGhost";
import CreateGhostSetup from "./CreateSetup/CreateGhostSetup";
import LearnGhost from "./Learn/LearnGhost";

import { SubNav } from "../../components/Nav";
import { GameTypes } from "../../Constants";
import { UserContext } from "../../Contexts";

import "../../css/play.css";
import ViewAnonymousDecks from "./AnonymousDecks/ViewAnonymousDecks";

export default function Play(props) {
  const defaultGameType = "Mafia";

  const user = useContext(UserContext);
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const inLobby = location.pathname == "/play";
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
      text: "Learn",
      path: `/play/learn`,
    },
  ];

  useEffect(() => {
    localStorage.setItem("gameType", gameType);

    if (!inLobby && !params.get("edit") && params.get("game") != gameType)
      history.push(location.pathname + `?game=${gameType}`);
  }, [location.pathname, gameType]);

  function onFilterGameType(gameType) {
    setGameType(gameType);
  }

  return (
    <>
      <SubNav
        links={links}
        showFilter={!inLobby}
        filterSel={gameType}
        filterOptions={GameTypes}
        onFilter={onFilterGameType}
        filterIcon={<i className="fas fa-gamepad" />}
      />
      <div className="inner-content play">
        <Switch>
          <Route exact path="/play" render={() => <Join />} />
          <Route
            exact
            path="/play/host"
            render={() => {
              switch (gameType) {
                case "Mafia":
                  return <HostMafia />;
                case "Split Decision":
                  return <HostSplitDecision />;
                case "Resistance":
                  return <HostResistance />;
                case "One Night":
                  return <HostOneNight />;
                case "Ghost":
                  return <HostGhost />;
                default:
                  setGameType(defaultGameType);
                  return <></>;
              }
            }}
          />

          <Route
            exact
            path="/play/create"
            render={() => {
              switch (gameType) {
                case "Mafia":
                  return <CreateMafiaSetup />;
                case "Split Decision":
                  return <CreateSplitDecisionSetup />;
                case "Resistance":
                  return <CreateResistanceSetup />;
                case "One Night":
                  return <CreateOneNightSetup />;
                case "Ghost":
                  return <CreateGhostSetup />;
                default:
                  setGameType(defaultGameType);
                  return <></>;
              }
            }}
          />

          <Route
            exact
            path="/play/decks"
            render={() => {
              return <ViewAnonymousDecks />;
            }}
          />

          <Route
            exact
            path="/play/learn"
            render={() => {
              switch (gameType) {
                case "Mafia":
                  return <LearnMafia />;
                case "Split Decision":
                  return <LearnSplitDecision />;
                case "Resistance":
                  return <LearnResistance />;
                case "One Night":
                  return <LearnOneNight />;
                case "Ghost":
                  return <LearnGhost />;
                default:
                  setGameType(defaultGameType);
                  return <></>;
              }
            }}
          />

          <Route render={() => <Redirect to="/play" />} />
        </Switch>
      </div>
    </>
  );
}

export function TopBarLink(props) {
  const active = props.sel.toLowerCase() == props.text.toLowerCase();

  return (
    <div
      className={`top-link ${active ? "active" : ""}`}
      onClick={props.onClick}
    >
      {props.text}
    </div>
  );
}
