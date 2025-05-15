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

import CreateMafiaSetup from "./CreateMafiaSetup";
import CreateResistanceSetup from "./CreateResistanceSetup";
import CreateGhostSetup from "./CreateGhostSetup";
import CreateJottoSetup from "./CreateJottoSetup";
import CreateAcrotopiaSetup from "./CreateAcrotopiaSetup";
import CreateSecretDictatorSetup from "./CreateSecretDictatorSetup";
import CreateWackyWordsSetup from "./CreateWackyWordsSetup";
import CreateLiarsDiceSetup from "./CreateLiarsDiceSetup";
import CreateCardGamesSetup from "./CreateCardGamesSetup";
import CreateBattlesnakesSetup from "./CreateBattlesnakesSetup";

import { GameTypes } from "../../../Constants";

const gamesIcons = {
  Mafia: "/images/game_icons/Mafia.png",
  Resistance: "/images/game_icons/Resistance.png",
  Ghost: "/images/game_icons/Ghost.png",
  Jotto: "/images/game_icons/Jotto.png",
  Acrotopia: "/images/game_icons/Acrotopia.png",
  "Secret Dictator": "/images/game_icons/SecretDictator.png",
  "Wacky Words": "/images/game_icons/WackyWords.png",
  "Liars Dice": "/images/game_icons/LiarsDice.png",
  "Card Games": "/images/game_icons/CardGames.png",
  Battlesnakes: "/images/game_icons/Battlesnakes.png",
};

export default function CreateSetup(props) {
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
        <img src={gamesIcons[gameType]} alt={gameType} width="30" height="30" />
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
                <img src={gamesIcons[game]} alt={game} width="24" height="24" />
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
            path="/play/create"
            render={() => {
              switch (gameType) {
                case "Mafia":
                  return <CreateMafiaSetup />;
                case "Resistance":
                  return <CreateResistanceSetup />;
                case "Ghost":
                  return <CreateGhostSetup />;
                case "Jotto":
                  return <CreateJottoSetup />;
                case "Acrotopia":
                  return <CreateAcrotopiaSetup />;
                case "Secret Dictator":
                  return <CreateSecretDictatorSetup />;
                case "Wacky Words":
                  return <CreateWackyWordsSetup />;
                case "Liars Dice":
                  return <CreateLiarsDiceSetup />;
                case "Card Games":
                  return <CreateCardGamesSetup />;
                case "Battlesnakes":
                  return <CreateBattlesnakesSetup />;
                default:
                  setGameType(defaultGameType);
                  return null;
              }
            }}
          />
          <Route render={() => <Redirect to="/play" />} />
        </Switch>
      </Box>
    </>
  );
}
