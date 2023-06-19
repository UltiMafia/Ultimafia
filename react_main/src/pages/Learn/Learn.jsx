import React, { useState, useContext, useEffect } from "react";
import {
  Route,
  Switch,
  Redirect,
  useLocation,
  useHistory,
} from "react-router-dom";

import LearnMafia from "./LearnMafia";
import LearnSplitDecision from "./LearnSplitDecision";
import LearnResistance from "./LearnResistance";
import LearnOneNight from "./LearnOneNight";
import LearnGhost from "./LearnGhost";

import { SubNav } from "../../components/Nav";
import { GameTypes } from "../../Constants";
import { UserContext } from "../../Contexts";

import "../../css/play.css";

export default function Learn(props) {
  const defaultGameType = "Mafia";

  const user = useContext(UserContext);
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const inLobby = location.pathname == "/play";
  const [gameType, setGameType] = useState(
    params.get("game") || localStorage.getItem("gameType") || defaultGameType
  );

  const links = [];
  
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
          <Route
            exact
            path="/learn"
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
