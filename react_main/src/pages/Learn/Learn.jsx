import React, { useState, useEffect } from "react";
import { Route, Switch, Redirect, useLocation } from "react-router-dom";

import LearnMafia from "./LearnMafia";
import LearnSplitDecision from "./LearnSplitDecision";
import LearnResistance from "./LearnResistance";
import LearnOneNight from "./LearnOneNight";
import LearnGhost from "./LearnGhost";
import LearnJotto from "./LearnJotto";
import LearnAcrotopia from "./LearnAcrotopia";
import LearnSecretDictator from "./LearnSecretDictator";
import LearnWackyWords from "./LearnWackyWords";
import LearnLiarsDice from "./LearnLiarsDice";

import Setups from "./Setup/SetupPage";

import { SubNav } from "../../components/Nav";
import { GameTypes } from "../../Constants";

import "../../css/play.css";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { slangList } from "../../constants/slangList";

export default function Learn(props) {
  const defaultGameType = "Mafia";

  const slangTableRows = Object.keys(slangList).map((key) => {
    let { definition, emoji } = slangList[key];
    if (Array.isArray(emoji)) {
      emoji = emoji.join(", ");
    }

    return {
      term: key,
      definition,
      emoji,
    };
  });

    // TODO [MUI]: modify the theme rather than using 'sx', for consistency (across all components)
    const slangTable = (
      <TableContainer component={Paper}>
        <Table aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Term
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Explanation
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                'Additions'
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slangTableRows.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row" align="center">
                  {row.term}
                </TableCell>
                <TableCell align="center">{row.definition}</TableCell>
                <TableCell align="center">{row.emoji}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );

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
  return (
    <>
      <SubNav
        links={[]}
        showFilter={!setupView}
        filterSel={gameType}
        filterOptions={GameTypes}
        onFilter={onFilterGameType}
        filterIcon={<i className="fas fa-gamepad" />}
      />
      <div className="inner-content play">
        <Switch>
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
                case "Secret Dictator":
                  return <LearnSecretDictator />;
                case "Wacky Words":
                  return <LearnWackyWords />;
                case "Liars Dice":
                  return <LearnLiarsDice />;
                default:
                  setGameType(defaultGameType);
                  return <></>;
              }
            }}
          />

          <Route render={() => <Redirect to="/play" />} />
        </Switch>
        <div className="heading">Terminology (mafia slang)</div>
        <div className="paragraph">
          Below lies the full list of terms automatically detected by the game.
          <br />
          <br />
          If you would like to improve one of the explanations (or even the
          emoji pool) or add a new term,{" "}
          <strong>
            please consider contributing through our Feedback form / Discord /
            Github Repo
          </strong>{" "}
          / etc.
          <br />
          <br />
          It's up to us to keep it fresh and relevant.
        </div>
        <div className="paragraph">{slangTable}</div>
      </div>
    </>
  );
}
