import React, { useContext, useEffect } from "react";
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { RoleSearch, ModifierSearch } from "../../components/Roles";
import { SiteInfoContext } from "../../Contexts";
import { hyphenDelimit } from "../../utils";

export default function LearnMafia(props) {
  const gameType = "Mafia";
  const theme = useTheme();
  const siteInfo = useContext(SiteInfoContext);

  const items = [
    {
      name: "Gun",
      text: "Can be shot once during the day to kill a specific player.",
      icon: <div className="icon item item-Mafia-Gun" />,
    },
    {
      name: "Rifle",
      text: "Can be shot once during the day to kill a specific player. If target shares alignment with shooter, shooter will die too. If target is of an opposing alignment, shooter gains another rifle. Otherwise, nothing happens.",
      icon: <div className="icon item item-Mafia-Rifle" />,
    },
    {
      name: "Armor",
      text: "Saves a player from being killed one time, not including being condemned.",
      icon: <div className="icon item item-Mafia-Armor" />,
    },
    {
      name: "Shield",
      text: "Can be used at night to redirect kills targeting the holder on to a random player of the same alignment, if possible.",
      icon: <div className="icon item item-Mafia-Armor" />,
    },
    {
      name: "Bomb",
      text: "When a player is killed while holding a bomb, the player who killed them will also die.",
      icon: <div className="icon item item-Mafia-Bomb" />,
    },
    {
      name: "Timebomb",
      text: "Players pass the timebomb around during the day. The timebomb will randomly explode between 10 and 30 seconds and kill the person holding the bomb.",
      icon: <div className="icon item item-Mafia-Timebomb" />,
    },
    {
      name: "Crystal Ball",
      text: "The holder of the crystal can choose a person each night and if they die, their target's role will be revealed.",
      icon: <div className="icon item item-Mafia-Crystal" />,
    },
    {
      name: "Knife",
      text: "Can be used once during the day to stab a specific player, who will bleed out and die the following night.",
      icon: <div className="icon item item-Mafia-Knife" />,
    },
    {
      name: "Whiskey",
      text: "Can be used once during the day on a specific player, who will be roleblocked the following night.",
      icon: <div className="icon item item-Mafia-Whiskey" />,
    },
    {
      name: "Key",
      text: "Can be used once during the night to make the player untargetable. All actions on the player are cancelled",
      icon: <div className="icon item item-Mafia-Key" />,
    },
    {
      name: "Bread",
      text: "Given out by the baker. Counts as 1 ration for each phase in a famine.",
      icon: <div className="icon item item-Mafia-Bread" />,
    },
    {
      name: "Yuzu Orange",
      text: "Given out by the Capybara to invite players to relax at the hot springs. Counts as 1 ration for each phase in a famine.",
      icon: <div className="icon item item-Mafia-Yuzu-Orange" />,
    },
    {
      name: "Suit",
      text: "Given by the tailor, a suit determines what role a user will appear as once dead.",
      icon: <div className="icon item item-Mafia-Suit" />,
    },
    {
      name: "Match",
      text: "Used by the arsonist to ignite everyone doused with gasoline.",
      icon: <div className="icon item item-Mafia-Match" />,
    },
    {
      name: "Candle",
      text: "Allows the holder to see all their visitors at night.",
      icon: <div className="icon item item-Mafia-Candle" />,
    },
    {
      name: "Falcon",
      text: "Can be used to track another player during the night.",
      icon: <div className="icon item item-Mafia-Falcon" />,
    },
    {
      name: "Tract",
      text: "Saves a player from being converted one time.",
      icon: <div className="icon item item-Mafia-Tract" />,
    },
    {
      name: "Syringe",
      text: "Can be shot once during the day to resurrect a specific player.",
      icon: <div className="icon item item-Mafia-Syringe" />,
    },
    {
      name: "Envelope",
      text: "Can be used at night to send an anonymous letter to another player.",
      icon: <div className="icon item item-Mafia-Envelope" />,
    },
  ];

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
                {entry.icon} {entry.name}
              </TableCell>
              <TableCell>{entry.text}</TableCell>
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
