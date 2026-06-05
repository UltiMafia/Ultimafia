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
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

const POINTS_ICON = require(`images/points.png`);
const PRESTIGE_ICON = require(`images/prestige.png`);

export default function CompetitiveFaq() {
  const isPhoneDevice = useIsPhoneDevice();

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
        All players receive 4 gold hearts per UTC/GMT day while a round is in
        its open phase. The open phase ends when either someone reaches 1,500
        fortune points in the round, or the round&apos;s scheduled open days run
        out—whichever happens first. Gold hearts are consumed when a
        competitive game finishes (they are not spent if you leave early).
        Hearts roll over between open days, but not into the next round.
      </Typography>
      <Typography paragraph>
        When the open phase ends, everyone has 24 hours to spend any remaining
        gold hearts on competitive games. After that grace period, all gold
        hearts reset to 0 and the round moves into review days (no new
        competitive games until the next round).
      </Typography>
      <Typography variant="h3" gutterBottom>
        How are rounds structured?
      </Typography>
      <Typography paragraph>
        A competitive season is divided into multiple rounds. Each round has up
        to eight open days (or fewer if someone hits 1,500 fortune first), then
        a 24-hour grace period to finish hearts, then four review days, followed
        by a one day break before the next round begins. During open days and
        the grace period, players can play competitive games and earn fortune
        points. During review days, players cannot play competitive games, and
        admins may review games. After the review days, the standings are
        confirmed and players are awarded prestige points based on how many
        fortune points they earned compared to other players.
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
        amount of points awarded depends on how often your starting faction
        historically wins on that setup, using all recorded ranked and
        competitive games combined. The less often your faction wins in those
        statistics, the more fortune you gain when you do win. Players need to
        accumulate fortune points to earn prestige at the end of a round.
      </Typography>
      <Typography paragraph>
        Fortune points may also be earned during ranked games, but they will not
        contribute to your competitive standing.
      </Typography>
      <Typography variant="h3" gutterBottom>
        How are payouts calculated?
      </Typography>
      <Typography paragraph>
        Payouts use a fixed scale (K = 120) and empirical win rates from the
        setup’s statistics (all game types combined). In a two-faction game,
        your faction’s payout when you win is proportional to how often the
        opposing faction wins in the historical data. With more than two
        scoring groups, payouts use each group’s own historical win rate.
        Certain independent roles have a maximum fortune award of 120 points per
        win so rare roles do not pay out extreme values.
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
        <TableContainer sx={{ maxWidth: isPhoneDevice ? "80%" : "50%" }}>
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
                <TableCell>20</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2nd</TableCell>
                <TableCell>18</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>3rd</TableCell>
                <TableCell>16</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>4th</TableCell>
                <TableCell>14</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>5th</TableCell>
                <TableCell>12</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>6th</TableCell>
                <TableCell>10</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>7th</TableCell>
                <TableCell>9</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>8th</TableCell>
                <TableCell>8</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>9th</TableCell>
                <TableCell>7</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>10th</TableCell>
                <TableCell>6</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>11th</TableCell>
                <TableCell>3</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>12th</TableCell>
                <TableCell>3</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>13th</TableCell>
                <TableCell>3</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>14th</TableCell>
                <TableCell>3</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>15th</TableCell>
                <TableCell>3</TableCell>
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
        How does the fortune point payout algorithm work?
      </Typography>
      <Typography paragraph>
        The game reads historical win rates for each starting faction (or role
        for independents) from that setup’s stored statistics across unranked,
        ranked, and competitive games. Those rates drive a K = 120 payout: in
        two-way matchups, winners earn roughly K times the opponent’s historical
        win rate; with several factions, each faction’s win payout ties to its
        own historical frequency. If there is not enough data yet, the game falls
        back to a neutral split between the factions in play.
      </Typography>
    </>
  );
}