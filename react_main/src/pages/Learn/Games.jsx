import React, { useState, useMemo, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  Link,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from "@mui/material";

import {
  RoleSearch,
  ModifierSearch,
  GameSettingSearch,
} from "components/Roles";
import { AchievementSearch } from "components/Achievements";
import { SiteInfoContext } from "Contexts";
import { hyphenDelimit } from "utils";

import { ActiveGameTypes, DisabledGameTypes } from "Constants";
import GameIcon from "components/GameIcon";

import {
  getLearnGameDescription,
} from "../../../../data/descriptions.js";

const TAB_IDS = ["roles", "modifiers", "items", "mechanics", "achievements"];
const TAB_LABELS = {
  roles: "Roles",
  modifiers: "Modifiers",
  items: "Items",
  mechanics: "Mechanics",
  achievements: "Achievements",
};

const WACKY_WORDS_MECHANICS = [
  {
    name: "Reverse Mode",
    text: "Instead of a prompt leading to an answer, the players first come up with answers, then they come up with funny prompts that could have been given to get those answers!",
  },
  {
    name: "Wacky People",
    text: "Things get more personal! Players answer questions about themselves, then other players also answer the prompt. After, players need to try and find the real answer! Players score 2 points for guessing the correct answer, players score 1 point for convincing another person to guess their answer, and the true answerer gets 2 points when players guess their answer!",
  },
  {
    name: "Acrotopia",
    text: "All players are given an acronym and tasked to create a backronym based on it! All players then vote for their favorites, with the winners of each round getting points. The person with the most points at the end of the game is declared the winner.",
  },
  {
    name: "Wacky Decisions",
    text: "Players will try to create would you rather questions that split the votes. Each round one player will create a would you rather question and other players will answer. Points will be given to that player based on how close the players were to a 50/50 split.",
  },
];

function LearnGameDescription({ blocks }) {
  if (!blocks || !Array.isArray(blocks)) return null;
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <Typography key={i} variant="h6" gutterBottom component="div">
              {block.content}
            </Typography>
          );
        }
        if (block.type === "paragraph") {
          if (block.parts?.length) {
            return (
              <Typography key={i} variant="body1" paragraph component="div">
                {block.parts.map((part, j) =>
                  part.type === "link" ? (
                    <Link
                      key={j}
                      href={part.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      {part.content}
                    </Link>
                  ) : (
                    <React.Fragment key={j}>{part.content}</React.Fragment>
                  )
                )}
              </Typography>
            );
          }
          return (
            <Typography key={i} variant="body1" paragraph>
              {block.content}
            </Typography>
          );
        }
        if (block.type === "list") {
          return (
            <List
              key={i}
              dense
              disablePadding
              sx={{
                listStyleType: "disc",
                pl: 2,
                mb: 2,
                "& .MuiListItem-root": { display: "list-item" },
              }}
            >
              {block.items.map((item, j) => (
                <ListItem key={j} disablePadding sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ variant: "body1" }}
                  />
                </ListItem>
              ))}
            </List>
          );
        }
        return null;
      })}
    </>
  );
}

function LearnTabsLayout({
  children,
  rolesContent,
  modifiersContent = null,
  itemsContent = null,
  mechanicsContent = null,
  achievementsContent = null,
}) {
  const enabledTabs = useMemo(() => {
    const out = [];
    if (rolesContent != null) out.push("roles");
    if (modifiersContent != null) out.push("modifiers");
    if (itemsContent != null) out.push("items");
    if (mechanicsContent != null) out.push("mechanics");
    if (achievementsContent != null) out.push("achievements");
    return out;
  }, [rolesContent, modifiersContent, itemsContent, mechanicsContent, achievementsContent]);

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
      <Box sx={{ mt: 2, mb: 1 }}>
        <Tabs value={value} onChange={handleChange}>
          {TAB_IDS.map((id) => (
            <Tab
              key={id}
              label={TAB_LABELS[id]}
              value={id}
              disabled={!enabledTabs.includes(id)}
              sx={
                !enabledTabs.includes(id)
                  ? {
                      color: "text.disabled",
                      "&.Mui-disabled": { opacity: 0.6 },
                    }
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
      <Box
        role="tabpanel"
        hidden={value !== "achievements"}
        id="learn-tab-achievements"
      >
        {value === "achievements" && achievementsContent}
      </Box>
    </div>
  );
}

function useDocumentTitle(gameType) {
  useEffect(() => {
    document.title = `Learn ${gameType} | UltiMafia`;
  }, [gameType]);
}

function MafiaLearn({ Layout }) {
  const gameType = "Mafia";
  useDocumentTitle(gameType);
  const siteInfo = useContext(SiteInfoContext);

  const items = useMemo(() => {
    const gameItems = siteInfo.items?.[gameType] || [];
    return gameItems.map((entry) => {
      const iconName = entry.icon || entry.name;
      const iconClass = `icon item item-${gameType}-${hyphenDelimit(iconName)}`;
      return {
        name: entry.name,
        text: entry.description,
        icon: <div className={iconClass} />,
      };
    });
  }, [siteInfo.items, gameType]);

  const itemsTable = (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((entry, index) => (
            <TableRow key={index}>
              <TableCell>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", textAlign: "left" }}
                >
                  {entry.icon}
                  <Typography>{entry.name}</Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{entry.text}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const description = getLearnGameDescription(gameType);

  return (
    <Layout
      rolesContent={<RoleSearch gameType={gameType} />}
      modifiersContent={<ModifierSearch gameType={gameType} />}
      itemsContent={itemsTable}
      mechanicsContent={<GameSettingSearch gameType={gameType} curMods={{}} />}
      achievementsContent={
        <Box sx={{ pt: 2 }}>
          <AchievementSearch />
        </Box>
      }
    >
      <LearnGameDescription blocks={description} />
    </Layout>
  );
}

function WackyWordsMechanicsTable() {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Mode</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {WACKY_WORDS_MECHANICS.map((row, index) => (
            <TableRow key={index}>
              <TableCell component="th" scope="row">
                <Typography fontWeight="medium">{row.name}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{row.text}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function SimpleRoleLearn({
  Layout,
  gameType,
  extras = {},
}) {
  useDocumentTitle(gameType);
  const description = getLearnGameDescription(gameType);

  return (
    <Layout
      rolesContent={<RoleSearch gameType={gameType} />}
      modifiersContent={extras.modifiersContent}
      itemsContent={extras.itemsContent}
      mechanicsContent={extras.mechanicsContent}
      achievementsContent={extras.achievementsContent}
    >
      <LearnGameDescription blocks={description} />
    </Layout>
  );
}

function LearnGameBody({ gameType, Layout }) {
  switch (gameType) {
    case "Mafia":
      return <MafiaLearn Layout={Layout} />;
    case "Wacky Words":
      return (
        <SimpleRoleLearn
          Layout={Layout}
          gameType={gameType}
          extras={{ mechanicsContent: <WackyWordsMechanicsTable /> }}
        />
      );
    case "Resistance":
    case "Jotto":
    case "Acrotopia":
    case "Secret Dictator":
    case "Liars Dice":
    case "Texas Hold Em":
    case "Cheat":
    case "Spot It":
    case "Ratscrew":
    case "Battlesnakes":
    case "Dice Wars":
    case "Connect Four":
      return <SimpleRoleLearn Layout={Layout} gameType={gameType} />;
    default:
      return null;
  }
}

export default function Games() {
  const defaultGameType = "Mafia";
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestedGameType =
    params.get("game") || localStorage.getItem("gameType") || defaultGameType;
  const [gameType, setGameType] = useState(
    DisabledGameTypes.includes(requestedGameType)
      ? defaultGameType
      : requestedGameType
  );

  const handleGameChange = (event) => {
    const newValue = event.target.value;
    setGameType(newValue);
    localStorage.setItem("gameType", newValue);
  };

  useEffect(() => {
    if (!ActiveGameTypes.includes(gameType)) {
      setGameType(defaultGameType);
      localStorage.setItem("gameType", defaultGameType);
    }
  }, [gameType, defaultGameType]);

  const resolvedGameType = ActiveGameTypes.includes(gameType)
    ? gameType
    : defaultGameType;

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="h2" component="span" gutterBottom={false}>
          Learn
        </Typography>
        <FormControl variant="standard" size="small" sx={{ minWidth: 180 }}>
          <Select
            value={resolvedGameType}
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
            {ActiveGameTypes.map((game) => (
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
      <Box>
        <LearnGameBody
          gameType={resolvedGameType}
          Layout={LearnTabsLayout}
        />
      </Box>
    </>
  );
}
