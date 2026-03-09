import React, { useContext, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from "@mui/material";

import { RoleSearch, ModifierSearch } from "../../../components/Roles";
import { AchievementSearch } from "../../../components/Achievements";
import { SiteInfoContext } from "../../../Contexts";
import { hyphenDelimit } from "../../../utils";
export default function LearnMafia({ Layout }) {
  const gameType = "Mafia";
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

  const mechanics = [
    {
      name: "Whispers",
      text: "Allow players to privately contact another player in the town meeting. If the whisper leaks then everyone will see it.",
    },
    {
      name: "Last Wills",
      text: "Allow players to write a message that will be revealed when they die.",
    },
    {
      name: "Must Act",
      text: "Players cannot select 'no one' for their actions, not including the village meeting.",
    },
    {
      name: "Must Condemn",
      text: "Players cannot condemn 'no one' during the village meeting.",
    },
    {
      name: "No Reveal",
      text: "The roles of dead players are not revealed.",
    },
    {
      name: "Alignment-Only Reveal",
      text: "Only the alignments of dead players are revealed.",
    },
    {
      name: "Closed Roles",
      text: "Roles for each alignment are randomly chosen from the pool of roles in the setup.",
    },
    {
      name: "Dawn",
      text: "No actions can be taken the first night.",
    },
    {
      name: "Famine",
      text: "While active, each player consumes one item of food each day/night. Anyone who doesn't have food to consume dies.",
    },
    {
      name: "Delirium",
      text: "An effect that makes players get false information and have non-information abilities disabled.",
    },
  ];

  useEffect(() => {
    document.title = "Learn Mafia | UltiMafia";
  }, []);

  const renderTable = (data) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((entry, index) => (
            <TableRow key={index}>
              <TableCell>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    textAlign: "left",
                  }}
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

  return (
    <Layout
      rolesContent={<RoleSearch gameType={gameType} />}
      modifiersContent={<ModifierSearch gameType={gameType} />}
      itemsContent={renderTable(items)}
      mechanicsContent={renderTable(mechanics)}
      achievementsContent={
        <Box sx={{ pt: 2 }}>
          <AchievementSearch />
        </Box>
      }
    >
      <Typography variant="body1" paragraph>
        Mafia is a chat-based social deduction game created by Dimitry Davidoff. The Town includes both hidden Mafia and Village-aligned players. The Village wins
        by eliminating all Mafia; the Mafia wins by making up at least half of
        the living players.
      </Typography>
      <Typography variant="body1" paragraph>
        Play alternates between night and day. At night the Mafia secretly
        choose a player to kill. By day the Town meets to discuss and then vote
        on who to eliminate; the Village must find the Mafia while the Mafia try
        to blend in. Each player has a role with an alignment and possibly
        special abilities—check your role’s description to see how you can help
        your side.
      </Typography>
    </Layout>
  );
}
