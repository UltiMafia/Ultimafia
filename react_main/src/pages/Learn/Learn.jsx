import React, { useState, useEffect } from "react";
import { Route, Switch, Redirect, useLocation } from "react-router-dom";

import LearnMafia from "./LearnMafia";
import LearnSplitDecision from "./LearnSplitDecision";
import LearnResistance from "./LearnResistance";
import LearnOneNight from "./LearnOneNight";
import LearnGhost from "./LearnGhost";
import LearnJotto from "./LearnJotto";
import LearnAcrotopia from "./LearnAcrotopia";
import LearnSecretHitler from "./LearnSecretHitler";

import Setups from "./Setup/SetupPage";

import { Emotes } from "../../components/Emotes";

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

  let setupView = location.pathname.startsWith("/learn/setup");

  const links = [
    {
      text: "Emotes",
      path: `/learn/emotes`,
    },
  ];
  
  return (
    <>
      <SubNav
        links={links}
        showFilter={!setupView}
        filterSel={gameType}
        filterOptions={GameTypes}
        onFilter={onFilterGameType}
        filterIcon={<i className="fas fa-gamepad" />}
      />
      <div className="inner-content play">
        <Switch>
          <Route path="/learn/emotes" render={() => <Emotes />} />
          <Route exact path="/learn/setup/:setupId" render={() => <Setups />} />

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
                case "Jotto":
                  return <LearnJotto />;
                case "Acrotopia":
                  return <LearnAcrotopia />;
                case "Secret Hitler":
                  return <LearnSecretHitler />;
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
