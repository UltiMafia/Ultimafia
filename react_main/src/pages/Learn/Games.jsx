import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

import LearnMafia from "./gameTypes/LearnMafia";
import LearnResistance from "./gameTypes/LearnResistance";
import LearnJotto from "./gameTypes/LearnJotto";
import LearnAcrotopia from "./gameTypes/LearnAcrotopia";
import LearnSecretDictator from "./gameTypes/LearnSecretDictator";
import LearnWackyWords from "./gameTypes/LearnWackyWords";
import LearnLiarsDice from "./gameTypes/LearnLiarsDice";
import LearnTexasHoldEm from "./gameTypes/LearnTexasHoldEm";
import LearnCheat from "./gameTypes/LearnCheat";
import LearnRatscrew from "./gameTypes/LearnRatscrew";
import LearnBattlesnakes from "./gameTypes/LearnBattlesnakes";
import LearnDiceWars from "./gameTypes/LearnDiceWars";
import LearnConnectFour from "./gameTypes/LearnConnectFour";

import { GameTypes } from "Constants";
import GameIcon from "components/GameIcon";

export default function Games(props) {
  const defaultGameType = "Mafia";
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [gameType, setGameType] = useState(
    params.get("game") || localStorage.getItem("gameType") || defaultGameType
  );

  const handleGameChange = (event) => {
    const newValue = event.target.value;
    setGameType(newValue);
    localStorage.setItem("gameType", newValue);
  };

  function LearnPage() {
    switch (gameType) {
      case "Mafia":
        return <LearnMafia />;
      case "Resistance":
        return <LearnResistance />;
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
      case "Ratscrew":
        return <LearnRatscrew />;
      case "Battlesnakes":
        return <LearnBattlesnakes />;
      case "Dice Wars":
        return <LearnDiceWars />;
      case "Connect Four":
        return <LearnConnectFour />;
      default:
        setGameType(defaultGameType);
        return <></>;
    }
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="h2" component="span" gutterBottom={false}>
          Learn
        </Typography>
        <FormControl variant="standard" size="small" sx={{ minWidth: 180 }}>
          <Select
            value={gameType}
            onChange={handleGameChange}
            displayEmpty
            sx={{
              typography: "h2",
              "& .MuiSelect-select": { py: 0.5 },
            }}
            renderValue={(value) => (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <GameIcon gameType={value} size={28} />
                {value}
              </Box>
            )}
          >
            {GameTypes.map((game) => (
              <MenuItem key={game} value={game}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <GameIcon gameType={game} size={24} />
                  {game}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box>{LearnPage()}</Box>
    </>
  );
}
