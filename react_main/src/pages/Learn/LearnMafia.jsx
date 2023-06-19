import React, { useEffect } from "react";

import "../../css/learn.css";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { slangList } from "../../json/slangList";
import { RoleSearch } from "../../components/Roles";
import { PanelGrid } from "../../components/Basic";

export default function LearnMafia(props) {
  const gameType = "Mafia";

  const slangTableRows = Object.keys(slangList).map((key) => {
    let { definition, emoji } = slangList[key];
    if (Array.isArray(emoji)) {
      emoji = emoji.join(", ");
    }

    return {
      term: key,
      definition,
      emoji,
    };
  });

  // TODO [MUI]: modify the theme rather than using 'sx', for consistency (across all components)
  const slangTable = (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              Term
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              Explanation
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              'Additions'
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {slangTableRows.map((row) => (
            <TableRow
              key={row.name}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row" align="center">
                {row.term}
              </TableCell>
              <TableCell align="center">{row.definition}</TableCell>
              <TableCell align="center">{row.emoji}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  var items = [
    {
      name: "Gun",
      text: "Can be shot once during the day to kill a specific player.",
    },
    {
      name: "Armor",
      text: "Saves a player from being killed one time, not including being executed.",
    },
    {
      name: "Bomb",
      text: "When a player is killed while holding a bomb, the player who killed them will also die.",
    },
    {
      name: "Bomb (Ticking)",
      text: "If the bomb is ticking, it will randomly explode between 10 and 30 seconds and kill the person holding the bomb.",
    },
    {
      name: "Crystal",
      text: "The holder of the crystal can choose a person each night and if they die, their target's role will be revealed.",
    },
    {
      name: "Knife",
      text: "Can be used once during the day to stab a specific player, who will bleed out and die the following night.",
    },
    {
      name: "Snowball",
      text: "Can be used once during the day to freeze a specific player, who will be roleblocked the following night.",
    },
    {
      name: "Key",
      text: "Can be used once during the night to make the player untargetable. All actions on the player are cancelled",
    },
    {
      name: "Bread",
      text: "Given out by the baker. Counts as 1 ration for each phase in a famine.",
    },
    {
      name: "Yuzu Orange",
      text: "Given out by the Capybara to invite players to relax at the hot springs. Counts as 1 ration for each phase in a famine.",
    },
    {
      name: "Suit",
      text: "Given by the tailor, a suit determines what role a user will appear as once dead.",
    },
    {
      name: "Gasoline",
      text: "Used by the arsonist to douse their victims in preparation for their ignition.",
    },
    {
      name: "Match",
      text: "Used by the arsonist to ignite everyone doused with gasoline.",
    },
    {
      name: "Candle",
      text: "Allows the holder to see all their visitors at night.",
    },
  ];

  var mechanics = [
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
      text: "Players cannot select 'no one' for their actions.",
    },
    {
      name: "No Reveal",
      text: "The roles of dead players are not revealed.",
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
      name: "Full Moon",
      text: "When a Lycan or Werewolf is present in the game, full moons will occur on odd nights.",
    },
    {
      name: "Eclipse",
      text: "Occurs during the day due to certain roles, making all votes and speech anonymous.",
    },
    {
      name: "Famine",
      text: "While active, each player consumes one item of food each day/night. Anyone who doesn't have food to consume dies.",
    },
  ];

  var modifiers = [
    {
      name: "Armed",
      text: "Starts with a gun.",
      icon: <div className="icon modifier modifier-Mafia-Armed" />,
    },
    {
      name: "Explosive",
      text: "Starts with a bomb.",
      icon: <div className="icon modifier modifier-Mafia-Explosive" />,
    },
    {
      name: "Armored",
      text: "Starts with armor.",
      icon: <div className="icon modifier modifier-Mafia-Armored" />,
    },
    {
      name: "Exposed",
      text: "Starts revealed to everyone.",
      icon: <div className="icon modifier modifier-Mafia-Exposed" />,
    },
    {
      name: "Chameleon",
      text: "Appears as a Villager to investigative roles.",
      icon: <div className="icon modifier modifier-Mafia-Chameleon" />,
    },
    {
      name: "Humble",
      text: "Appears as Villager to self with no modifier.",
      icon: <div className="icon modifier modifier-Mafia-Humble" />,
    },
    {
      name: "Scatterbrained",
      text: "Appears as Visitor (if Village-aligned) or Trespasser (if Mafia-aligned) to self with no modifier.",
      icon: <div className="icon modifier modifier-Mafia-Scatterbrained" />,
    },
    {
      name: "Lone",
      text: "Does not attend the Mafia or Cult meeting.",
      icon: <div className="icon modifier modifier-Mafia-Lone" />,
    },
    {
      name: "Solitary",
      text: "Does not attend the Cop or Templar meetings.",
      icon: <div className="icon modifier modifier-Mafia-Solitary" />,
    },
    {
      name: "Delayed",
      text: "Cannot attend secondary meetings for the first day and night.",
      icon: <div className="icon modifier modifier-Mafia-Delayed" />,
    },
    {
      name: "Even",
      text: "Can only attend secondary meetings on even days and nights.",
      icon: <div className="icon modifier modifier-Mafia-Even" />,
    },
    {
      name: "Odd",
      text: "Can only attend secondary meetings on odd days and nights.",
      icon: <div className="icon modifier modifier-Mafia-Odd" />,
    },
    {
      name: "One Shot",
      text: "Can only perform actions once.",
      icon: <div className="icon modifier modifier-Mafia-One-Shot" />,
    },
    {
      name: "Bloodthirsty",
      text: "Needs to kill other players to stay alive.",
      icon: <div className="icon modifier modifier-Mafia-Bloodthirsty" />,
    },
    {
      name: "Loud",
      text: "All reports recieved are announced to everyone, with the player's role revealed.",
      icon: <div className="icon modifier modifier-Mafia-Loud" />,
    },
    {
      name: "Astral",
      text: "All actions done by this player do not appear as visits.",
      icon: <div className="icon modifier modifier-Mafia-Astral" />,
    },
    {
      name: "Unblockable",
      text: "All actions done by this player cannot be roleblocked or controlled.",
      icon: <div className="icon modifier modifier-Mafia-Unblockable" />,
    },
    {
      name: "Unwavering",
      text: "Cannot be converted to another role.",
      icon: <div className="icon modifier modifier-Mafia-Unwavering" />,
    },
    {
      name: "Frustrated",
      text: "Cannot be executed by majority vote. A non-zero minority vote will kill the target.",
      icon: <div className="icon modifier modifier-Mafia-Frustrated" />,
    },
    {
      name: "Loudmouthed",
      text: "If visited, cries out the identity of players who visited them during the night.",
      icon: <div className="icon modifier modifier-Mafia-Loudmouthed" />,
    },
    {
      name: "Traitorous",
      text: "If killed by the Mafia, will turn into a Traitor instead.",
      icon: <div className="icon modifier modifier-Mafia-Traitorous" />,
    },
  ];

  useEffect(() => {
    document.title = "Learn Mafia | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Mafia is a game of social deception where an informed minority (the
            Mafia) compete against the uniformed majority (the Village). The
            Mafia choose one player to kill each night, and they win the game if
            they successfully outnumber the non-mafia players at any point.
            Everyone votes to execute one person during the day, with the
            Village aiming to eliminate all mafia members.
          </div>
          <div className="paragraph">
            In addition to the Village and the Mafia, there are two other
            alignments: Independent and Cult. Independents are not aligned with
            a side and usually have their own unique win condition. The Cult
            meets together and win if they reach the majority just like the
            Mafia, but they do not vote to kill someone each night.
          </div>
          <div className="paragraph">
            At the beginning of a game, each player is given a role. This role
            may grant the player special abilities, usually in the form of
            actions they can take to aid their side. A list of all roles and
            their abilities can be found below.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
        <div className="heading">Items</div>
        <PanelGrid panels={items} />
        <div className="heading">Mechanics</div>
        <PanelGrid panels={mechanics} />
        <div className="heading">Modifiers</div>
        <PanelGrid panels={modifiers} />
        <div className="heading">Terminology (mafia slang)</div>
        <div className="paragraph">
          Below lies the full list of terms automatically detected by the game.
          <br />
          <br />
          If you would like to improve one of the explanations (or even the
          emoji pool) or add a new term,{" "}
          <strong>
            please consider contributing through our Feedback form / Discord /
            Github Repo (when it's visible)
          </strong>{" "}
          / etc.
          <br />
          <br />
          It's up to us to keep it fresh and relevant.
        </div>
        <div className="paragraph">{slangTable}</div>
      </div>
    </div>
  );
}
