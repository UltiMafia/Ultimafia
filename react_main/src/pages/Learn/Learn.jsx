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
  Box,
  Card,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useTheme } from '@mui/styles';
import { slangList } from "../../constants/slangList";

export default function Learn(props) {
  const defaultGameType = "Mafia";
  const theme = useTheme();

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

    const slangTable = (
      <TableContainer component={Paper}>
        <Table aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>
                Term
              </TableCell>
              <TableCell>
                Definition
              </TableCell>
              <TableCell>
                Emote
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
      <Box sx={{ padding: theme.spacing(3) }}>
      <Card variant="outlined" sx={{ padding: theme.spacing(3), textAlign: 'justify' }}>
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
        <Accordion>
          <AccordionSummary>
            <Typography variant="h6">Terminology</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              The game features a comprehensive list of terms that are automatically detected during gameplay. Understanding these terms is crucial for mastering the game's mechanics and strategies.
              To improve the definitions or contribute to the emoji pool, we encourage you to get involved through our Discord or Github Repo.
              Your contributions are invaluable in keeping the terminology current and engaging.
              Players can choose to toggle the visibility of these terms through their profile settings.
            </Typography>
            <Box className="paragraph">{slangTable}</Box>
          </AccordionDetails>
        </Accordion>
      </Card>
      </Box>
    </>
  );
}
