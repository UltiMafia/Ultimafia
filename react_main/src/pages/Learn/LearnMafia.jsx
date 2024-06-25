import React, { useContext, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/styles";

import { RoleSearch } from "../../components/Roles";
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

  return (
    <div style={{ padding: theme.spacing(3) }}>
      <div className="learn">
        <Typography variant="h4">Synopsis</Typography>
        <Accordion>
          <AccordionSummary expandIcon={"V"}>
            <Typography>Synopsis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Mafia is a game of social deception where an informed minority (the Mafia) compete against the uniformed majority (the Village). The Mafia choose one player to kill each night, and they win the game if they successfully outnumber the non-mafia players at any point. Everyone votes to condemn one person during the day, with the Village aiming to eliminate all mafia members.
            </Typography>
            <Typography paragraph>
              In addition to the Village and the Mafia, there are two other alignments: Independent and Cult. Independents are not aligned with a side and usually have their own unique win condition. The Cult meets together and win if they reach the majority just like the Mafia, but they do not vote to kill someone each night.
            </Typography>
            <Typography paragraph>
              At the beginning of a game, each player is given a role. This role may grant the player special abilities, usually in the form of actions they can take to aid their side. A list of all roles and their abilities can be found below.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Typography variant="h4">Roles</Typography>
        <RoleSearch gameType={gameType} />
        <Accordion>
          <AccordionSummary expandIcon={"V"}>
            <Typography>Items</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {items.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Typography variant="h6">{item.icon} {item.name}</Typography>
                  <Typography>{item.text}</Typography>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={"V"}>
            <Typography>Mechanics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {mechanics.map((mechanic, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Typography variant="h6">{mechanic.name}</Typography>
                  <Typography>{mechanic.text}</Typography>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={"V"}>
            <Typography>Modifiers</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {modifiers.map((modifier, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Typography variant="h6">{modifier.icon} {modifier.name}</Typography>
                  <Typography>{modifier.text}</Typography>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  );
}
