import React, { useContext, useEffect, useMemo } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
import { useTheme } from "@mui/material/styles";

import { RoleSearch, ModifierSearch } from "../../components/Roles";
import { SiteInfoContext } from "../../Contexts";
import { hyphenDelimit } from "../../utils";

export default function LearnMafia(props) {
  const gameType = "Mafia";
  const theme = useTheme();
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

  const modifiers = siteInfo.modifiers["Mafia"]
    .filter((e) => !e.hidden)
    .map((e) => ({
      name: e.name,
      text: e.description,
      icon: (
        <div
          className={`icon modifier modifier-Mafia-${hyphenDelimit(e.name)}`}
        />
      ),
    }));

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
                <Stack direction="row" spacing={1} sx={{
                  alignItems: "center",
                  textAlign: "left",
                }}>
                  {entry.icon}
                  <Typography>
                    {entry.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {entry.text}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Mafia
      </Typography>
      <Typography variant="body1" paragraph>
        Mafia is a chat-based social deception game, based on the party game
        Mafia by Dimitry Davidoff. In this version, the Town is under attack by
        the nefarious Mafia, and it is their job to find and condemn the Mafia
        members to death before the Mafia can kill enough Town members to take
        control. If the Town manages to find and eliminate all members of the
        Mafia, they win. However, if the Mafia kills enough Town members to make
        up at least 50% of the remaining players, Mafia wins.
      </Typography>
      <Typography variant="body1" paragraph>
        The game operates on day/night cycles. At night, the Mafia meet in
        secret to discuss their plans & to pick a target to kill. During the
        day, the Town reconvenes - with the Mafia hiding amongst them - and
        discusses the events of the night. Members of the Town must use their
        wits to examine each player's behavior and determine if there is
        anything amiss, while members of the Mafia must try their hardest to
        blend in and throw the Town off of their trail. When the discussion
        period is over, all players in the game will vote to decide who they
        believe is a member of the Mafia, ending the day.
      </Typography>
      <Typography variant="body1" paragraph>
        Each player is given a random role at the start of the game; players can
        hover over the role icon on the left-hand side of the screen in order to
        examine its alignment. Some roles also come with special abilities that
        can be used to aid their team, or that provide them unique conditions
        for winning. Be sure to read the description carefully!
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Roles</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RoleSearch gameType={gameType} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Modifiers</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ModifierSearch gameType={gameType} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Items</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderTable(items)}</AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Mechanics</Typography>
        </AccordionSummary>
        <AccordionDetails>{renderTable(mechanics)}</AccordionDetails>
      </Accordion>
    </div>
  );
}
