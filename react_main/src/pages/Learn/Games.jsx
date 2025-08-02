import React, { useState } from "react";
import { Route, Switch, Redirect, useLocation } from "react-router-dom";
import {
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Box,
  Paper,
  useTheme,
} from "@mui/material";

import LearnMafia from "./LearnMafia";
import LearnResistance from "./LearnResistance";
import LearnGhost from "./LearnGhost";
import LearnJotto from "./LearnJotto";
import LearnAcrotopia from "./LearnAcrotopia";
import LearnSecretDictator from "./LearnSecretDictator";
import LearnWackyWords from "./LearnWackyWords";
import LearnLiarsDice from "./LearnLiarsDice";
import LearnTexasHoldEm from "./LearnTexasHoldEm";
import LearnCheat from "./LearnCheat";
import LearnCrazyEights from "./LearnCrazyEights";

import { GameTypes } from "Constants";
import LearnBattlesnakes from "./LearnBattlesnakes";
import GameIcon from "components/GameIcon";

export default function Games(props) {
  const theme = useTheme();
  const defaultGameType = "Mafia";
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [gameType, setGameType] = useState(
    params.get("game") || localStorage.getItem("gameType") || defaultGameType
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleListItemClick = (newValue) => {
    setGameType(newValue);
    localStorage.setItem("gameType", newValue);
    setDrawerOpen(false);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={toggleDrawer(true)}
        sx={{
          position: "fixed",
          top: "50%",
          left: 0,
          zIndex: 1201,
          visibility: drawerOpen ? "hidden" : "visible",
          backgroundColor: theme.palette.secondary.main,
          padding: "8px",
          borderRadius: "50%",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
        }}
      >
        <GameIcon gameType={gameType} size={30} />
      </IconButton>
      <Paper
        onClick={toggleDrawer(true)}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: "10px",
          backgroundColor: "transparent",
          zIndex: 1200,
          cursor: "pointer",
        }}
      />
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
        }}
      >
        <List>
          {GameTypes.map((game) => (
            <ListItem
              button
              key={game}
              selected={gameType === game}
              onClick={() => handleListItemClick(game)}
            >
              <ListItemIcon>
                <GameIcon gameType={game} size={24} />
              </ListItemIcon>
              <ListItemText primary={game} />
            </ListItem>
          ))}
        </List>
      </SwipeableDrawer>
      <Box>
        <Switch>
          <Route
            exact
            path="/learn/games"
            render={() => {
              switch (gameType) {
                case "Mafia":
                  return <LearnMafia />;
                case "Resistance":
                  return <LearnResistance />;
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
                case "Texas Hold Em":
                  return <LearnTexasHoldEm />;
                case "Cheat":
                  return <LearnCheat />;
                case "Crazy Eights":
                  return <LearnCrazyEights />;
                case "Battlesnakes":
                  return <LearnBattlesnakes />;
                default:
                  setGameType(defaultGameType);
                  return <></>;
              }
            }}
          />
          <Route render={() => <Redirect to="/play" />} />
        </Switch>
      </Box>
    </>
  );
}
