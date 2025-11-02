import React, { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
  ListItemButton,
} from "@mui/material";

import CreateMafiaSetup from "./CreateMafiaSetup";
import CreateResistanceSetup from "./CreateResistanceSetup";
import CreateJottoSetup from "./CreateJottoSetup";
import CreateAcrotopiaSetup from "./CreateAcrotopiaSetup";
import CreateSecretDictatorSetup from "./CreateSecretDictatorSetup";
import CreateWackyWordsSetup from "./CreateWackyWordsSetup";
import CreateLiarsDiceSetup from "./CreateLiarsDiceSetup";
import CreateTexasHoldEmSetup from "./CreateTexasHoldEmSetup";
import CreateCheatSetup from "./CreateCheatSetup";
import CreateBattlesnakesSetup from "./CreateBattlesnakesSetup";
import CreateDiceWarsSetup from "./CreateDiceWarsSetup";
import CreateConnectFourSetup from "./CreateConnectFourSetup";

import { GameTypes } from "Constants";
import GameIcon from "components/GameIcon";

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

  function CreatePage() {
    switch (gameType) {
      case "Mafia":
        return <CreateMafiaSetup />;
      case "Resistance":
        return <CreateResistanceSetup />;
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
      case "Texas Hold Em":
        return <CreateTexasHoldEmSetup />;
      case "Cheat":
        return <CreateCheatSetup />;
      case "Battlesnakes":
        return <CreateBattlesnakesSetup />;
      case "DiceWars": // Backward compatibility
      case "Dice Wars":
        return <CreateDiceWarsSetup />;
      case "Connect Four":
        return <CreateConnectFourSetup />;
      default:
        setGameType(defaultGameType);
        return null;
    }
  }

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
            <ListItemButton
              key={game}
              selected={gameType === game}
              onClick={() => handleListItemClick(game)}
            >
              <ListItemIcon>
                <GameIcon gameType={game} size={24} />
              </ListItemIcon>
              <ListItemText primary={game} />
            </ListItemButton>
          ))}
        </List>
      </SwipeableDrawer>
      <Box>{CreatePage()}</Box>
    </>
  );
}
