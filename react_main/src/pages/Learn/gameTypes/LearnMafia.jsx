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

import { RoleSearch, ModifierSearch, GameSettingSearch } from "../../../components/Roles";
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
      mechanicsContent={<GameSettingSearch gameType={gameType} curMods={{}} />}
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
