import React, { useState, useEffect } from "react";
import {
  Route,
  Switch,
  Redirect,
  useLocation,
} from "react-router-dom";

import LearnMafia from "./LearnMafia";
import LearnSplitDecision from "./LearnSplitDecision";
import LearnResistance from "./LearnResistance";
import LearnOneNight from "./LearnOneNight";
import LearnGhost from "./LearnGhost";

import { SubNav } from "../../components/Nav";
import { GameTypes } from "../../Constants";

import "../../css/play.css";

export default function Learn(props) {
  const defaultGameType = "Mafia";

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [gameType, setGameType] = useState(
    params.get("game") || localStorage.getItem("gameType") || defaultGameType
  );

  useEffect(() => {
    localStorage.setItem("gameType", gameType);

  }, [location.pathname, gameType]);

  function onFilterGameType(gameType) {
    setGameType(gameType);
  }

  return (
    <>
      <SubNav
        links={[]}
        showFilter
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
