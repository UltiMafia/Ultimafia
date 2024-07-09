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
import Terminology from "./Terminology";

import { GameTypes } from "../../Constants";

import "../../css/play.css";

import {
  Box, Card, Link, AppBar, Toolbar,
  Tabs,
  Tab,
} from "@mui/material";
import { useTheme } from '@mui/styles';

export default function Learn(props) {
  const defaultGameType = "Mafia";
  const theme = useTheme();

  const links = [
    {
      text: 'Learn',
      path: '/learn',
      exact: true,
    },
    {
      text: 'Terminology',
      path: '/learn/terminology',
      exact: true,
    },
  ];

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [gameType, setGameType] = useState(
    params.get("game") || localStorage.getItem("gameType") || defaultGameType
  );

  const handleTabChange = (event, newValue) => {
    setGameType(newValue);
    localStorage.setItem("gameType", newValue);
  };

  let setupView = location.pathname.startsWith("/learn/setup");

  return (
    <>
    <AppBar position="static">
    <Toolbar>
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.path}
          underline="none"
          color="inherit"
          variant="button"
          sx={{ margin: theme.spacing(1) }}
        >
          {link.text}
        </Link>
      ))}
    </Toolbar>
  </AppBar>
    <Box display="flex">
      <Tabs
        orientation="vertical"
        value={gameType}
        onChange={handleTabChange}
        sx={{ borderRight: 1, borderColor: 'divider', minWidth: 150 }}
      >
        {GameTypes.map((game) => (
          <Tab key={game} label={game} value={game} />
        ))}
      </Tabs>
      <Box maxWidth="1080px" sx={{ padding: theme.spacing(3), flexGrow: 1 }}>
        <Card variant="outlined" sx={{ padding: theme.spacing(3), textAlign: 'justify' }}>
          <Switch>
            <Route exact path="/learn/setup/:setupId" render={() => <Setups />} />
            <Route exact path="/learn/terminology" render={() => <Terminology />} /> 

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
        </Card>
      </Box>
    </Box>
  </>
  );
}
