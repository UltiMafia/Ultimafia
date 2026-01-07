import React, { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Typography,
  Link,
  List,
  ListItem,
  ListItemText,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Stack,
} from "@mui/material";

const POINTS_ICON = require(`images/points.png`);
const PRESTIGE_ICON = require(`images/prestige.png`);

export default function CompetitiveFaq() {
  return (
    <>
      <Typography variant="h2" gutterBottom>
        Competitive FAQ
      </Typography>
      <Typography variant="h3" gutterBottom>
        What is competitive?
      </Typography>
      <Typography paragraph>
        Competitive is a tournament-style game mode where players compete in
        matches to earn fortune points and prestige. Players can join
        competitive games using gold hearts, which are limited-use tokens that
        allow entry into these games. Competitive games follow the same rules as
        ranked games, with the added element of being able to win permanent
        trophies at the end of a season.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
        <i
          className="fas fa-heart"
          style={{
            fontSize: "24px",
            color: "var(--gold-heart-color)",
          }}
        />
        <Typography variant="h3">When and how do I get gold hearts?</Typography>
      </Stack>
      <Typography paragraph>
        All players receive 4 gold hearts per day for the first
        <Typography
          sx={{ display: "inline", fontWeight: "bold", fontStyle: "italic" }}
        >
          {" seven "}
        </Typography>
        days of a round. Each day progresses to the next when UTC/GMT midnight
        passes. These gold hearts are consumed upon the completion of a
        competitive game (they are not spent if a player leaves the game). All
        players will eventually receive a total of 28 gold hearts per round.
        Your gold hearts roll over between days in a round, but are reset to 0
        at the start of a new round.
      </Typography>
      <Typography variant="h3" gutterBottom>
        How are rounds structured?
      </Typography>
      <Typography paragraph>
        A competitive season is divided into multiple rounds. Each round
        consists of eight open days and five review days, which are followed by
        a one day break before the next round begins. During open days, players
        can play competitive games and earn fortune points. During review days,
        players cannot play competitive games, and admins may review games.
        After the review days, the standings are confirmed and players are
        awarded prestige points based on how many fortune points they earned
        compared to other players.
      </Typography>
      <Typography paragraph>
        Competitive games may only be played using specific setups - these
        setups are displayed on the competitive page for reference. The
        available setups will change between rounds to keep things fresh.
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          mb: 0.5,
        }}
      >
        <img src={POINTS_ICON} />
        <Typography variant="h3">What are fortune points?</Typography>
      </Stack>
      <Typography paragraph>
        Fortune points are earned when players win a competitive game. The
        amount of points awarded depends on how likely your starting faction was
        to win the game based on its faction elo. The more unlikely your faction
        was to win, the more fortune points you earn. Players will need to
        accumulate fortune points to earn prestige at the end of a round.
      </Typography>
      <Typography paragraph>
        Fortune points may also be earned during ranked games, but they will not
        contribute to your competitive standing.
      </Typography>
      <Typography variant="h3" gutterBottom>
        What is faction elo?
      </Typography>
      <Typography paragraph>
        Faction elo is a hidden rating assigned to each faction that indicates
        how well that faction performs in ranked and competitive games. Players
        belonging to factions with a higher elo will not receive as many fortune
        points for winning as players in factions with a lower elo. Faction elo
        is adjusted after each ranked or competitive game based on the
        performance of each faction in that game.
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          mb: 0.5,
        }}
      >
        <img src={PRESTIGE_ICON} />
        <Typography variant="h3" gutterBottom>
          How many prestige points do I earn if I place in a round?
        </Typography>
      </Stack>
      <Typography paragraph>
        The top 10 players with the most fortune points at the end of a round
        are awarded prestige points according to a table. Ties are resolved by
        treating both players as having achieved the higher ranking position.
        For example, if two players tie for 2nd place, both players receive the
        prestige points for 2nd place.
      </Typography>
      <Stack direction="row" sx={{ justifyContent: "center", mb: 4 }}>
        <TableContainer sx={{ maxWidth: "50%" }}>
          <Table aria-label="prestige table">
            <TableHead>
              <TableRow>
                <TableCell>Ranking</TableCell>
                <TableCell>Prestige Points Awarded</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>1st</TableCell>
                <TableCell>25</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2nd</TableCell>
                <TableCell>18</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>3rd</TableCell>
                <TableCell>15</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>4th</TableCell>
                <TableCell>12</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>5th</TableCell>
                <TableCell>10</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>6th</TableCell>
                <TableCell>8</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>7th</TableCell>
                <TableCell>6</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>8th</TableCell>
                <TableCell>4</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>9th</TableCell>
                <TableCell>2</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>10th</TableCell>
                <TableCell>1</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
      <Typography variant="h3" gutterBottom>
        What happens at the end of a season?
      </Typography>
      <Typography paragraph>
        At the end of a season, the three players with the highest total
        prestige points across all rounds are awarded permanent trophies that
        are displayed on their profiles. The player with the highest prestige
        points receives a gold trophy, the second highest receives a silver
        trophy, and the third highest receives a bronze trophy.
      </Typography>
      <Typography variant="h2" gutterBottom>
        Miscellaneous FAQ
      </Typography>
      <Typography variant="h3" gutterBottom>
        Am I allowed to use multiple accounts in a competitive season?
      </Typography>
      <Typography paragraph>
        For now this is allowed, but the rule may be changed in the future.
      </Typography>
      <Typography variant="h3" gutterBottom>
        How does the faction elo and fortune point payout algorithm work?
      </Typography>
      <Typography paragraph>
        Faction elo is calculated using openskill, which is a ranking system
        similar to Microsoft's Trueskill. Each faction starts with a default elo
        rating, and the ratings are updated after each ranked or competitive
        game depending on how many of the players that started as that faction
        won or lost. Factions are scored from 0% to 100%, where 0% means that no
        players starting as that faction won the game, and 100% means that all
        players starting as that faction won the game.
      </Typography>
      <Typography paragraph>
        Going into a match, openskill predicts the likelihood of each faction
        winning based on their current elo ratings. This likelihood is used to
        determine how many fortune points players belonging to a faction will
        earn if that faction wins the game. The following formula is used:
      </Typography>
      <Typography
        paragraph
        sx={{
          fontFamily: "monospace",
        }}
      >
        Points Earned = 30 / Win Percentage
      </Typography>
      <Typography paragraph>
        Using this formula, a faction with a 50% win rate would earn 60 fortune
        points and a faction with a 10% win rate would earn 300 fortune points.
      </Typography>
    </>
  );
}
