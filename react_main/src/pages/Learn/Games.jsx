import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
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

const TAB_IDS = ["roles", "modifiers", "items", "mechanics"];
const TAB_LABELS = { roles: "Roles", modifiers: "Modifiers", items: "Items", mechanics: "Mechanics" };

function LearnTabsLayout({
  children,
  rolesContent,
  modifiersContent = null,
  itemsContent = null,
  mechanicsContent = null,
}) {
  const enabledTabs = useMemo(() => {
    const out = [];
    if (rolesContent != null) out.push("roles");
    if (modifiersContent != null) out.push("modifiers");
    if (itemsContent != null) out.push("items");
    if (mechanicsContent != null) out.push("mechanics");
    return out;
  }, [rolesContent, modifiersContent, itemsContent, mechanicsContent]);

  const [activeTab, setActiveTab] = useState(() => enabledTabs[0] || "roles");

  useEffect(() => {
    if (enabledTabs.length && !enabledTabs.includes(activeTab)) {
      setActiveTab(enabledTabs[0]);
    }
  }, [enabledTabs, activeTab]);

  const value = enabledTabs.includes(activeTab) ? activeTab : enabledTabs[0] || "roles";
  const handleChange = (_, newValue) => {
    if (enabledTabs.includes(newValue)) setActiveTab(newValue);
  };

  return (
    <div className="learn">
      {children}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2, mb: 1 }}>
        <Tabs value={value} onChange={handleChange}>
          {TAB_IDS.map((id) => (
            <Tab
              key={id}
              label={TAB_LABELS[id]}
              value={id}
              disabled={!enabledTabs.includes(id)}
              sx={
                !enabledTabs.includes(id)
                  ? { color: "text.disabled", "&.Mui-disabled": { opacity: 0.6 } }
                  : undefined
              }
            />
          ))}
        </Tabs>
      </Box>
      <Box role="tabpanel" hidden={value !== "roles"} id="learn-tab-roles">
        {value === "roles" && rolesContent}
      </Box>
      <Box role="tabpanel" hidden={value !== "modifiers"} id="learn-tab-modifiers">
        {value === "modifiers" && modifiersContent}
      </Box>
      <Box role="tabpanel" hidden={value !== "items"} id="learn-tab-items">
        {value === "items" && itemsContent}
      </Box>
      <Box role="tabpanel" hidden={value !== "mechanics"} id="learn-tab-mechanics">
        {value === "mechanics" && mechanicsContent}
      </Box>
    </div>
  );
}

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
        return <LearnMafia Layout={LearnTabsLayout} />;
      case "Resistance":
        return <LearnResistance Layout={LearnTabsLayout} />;
      case "Jotto":
        return <LearnJotto Layout={LearnTabsLayout} />;
      case "Acrotopia":
        return <LearnAcrotopia Layout={LearnTabsLayout} />;
      case "Secret Dictator":
        return <LearnSecretDictator Layout={LearnTabsLayout} />;
      case "Wacky Words":
        return <LearnWackyWords Layout={LearnTabsLayout} />;
      case "Liars Dice":
        return <LearnLiarsDice Layout={LearnTabsLayout} />;
      case "Texas Hold Em":
        return <LearnTexasHoldEm Layout={LearnTabsLayout} />;
      case "Cheat":
        return <LearnCheat Layout={LearnTabsLayout} />;
      case "Ratscrew":
        return <LearnRatscrew Layout={LearnTabsLayout} />;
      case "Battlesnakes":
        return <LearnBattlesnakes Layout={LearnTabsLayout} />;
      case "Dice Wars":
        return <LearnDiceWars Layout={LearnTabsLayout} />;
      case "Connect Four":
        return <LearnConnectFour Layout={LearnTabsLayout} />;
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
