import React, { useContext, useEffect } from "react";

import { RoleSearch } from "../../components/Roles";
import { PanelGrid } from "../../components/Basic";

import "../../css/learn.css";
import { SiteInfoContext } from "../../Contexts";
import { hyphenDelimit } from "../../utils";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { slangList } from "../../constants/slangList";

export default function LearnMafia(props) {
  const gameType = "Mafia";

  const siteInfo = useContext(SiteInfoContext);

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
      text: "Saves a player from being killed one time, not including being condemned.",
    },
    {
      name: "Bomb",
      text: "Can choose to rush a player and explode, killing themselves and their target. Alternatively: when a player is killed while holding a bomb, the player who killed them will also die.",
    },
    {
      name: "Timebomb",
      text: "Players pass the timebomb around during the day. The timebomb will randomly explode between 10 and 30 seconds and kill the person holding the bomb.",
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
      name: "Whiskey",
      text: "Can be used once during the day on a specific player, who will be roleblocked the following night.",
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
      name: "Closed Roles",
      text: "Roles for each alignment are randomly chosen from the pool of roles in the setup.",
    },
    {
      name: "Dawn",
      text: "No actions can be taken the first night.",
    },
    {
      name: "Full Moon",
      text: "When a Werewolf is present in the game, full moons will occur on odd nights.",
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
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Mafia is a game of social deception where an informed minority (the
            Mafia) compete against the uniformed majority (the Village). The
            Mafia choose one player to kill each night, and they win the game if
            they successfully outnumber the non-mafia players at any point.
            Everyone votes to condemn one person during the day, with the
            Village aiming to eliminate all mafia members.
          </div>
          <div className="paragraph">
            In addition to the Village and the Mafia, there are two other
            alignments: Independent and Cult. Independents are not aligned with
            a side and usually have their own unique win condition. Hostiles are
            Independent roles that delay a Village victory until their deaths.
            The Cult meets together and win if they reach the majority just like
            the Mafia, but they do not vote to kill someone each night.
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
