import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnRatscrew({ Layout }) {
  const gameType = "Ratscrew";

  useEffect(() => {
    document.title = "Learn Ratscrew | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="h6" gutterBottom>
        Goal
      </Typography>
      <Typography variant="body1" paragraph>
        Be the last player with cards.
      </Typography>

      <Typography variant="h6" gutterBottom>
        How a turn works
      </Typography>
      <Typography variant="body1" paragraph>
        On your turn, play the top card from your deck onto the pile. Then it's
        the next player's turn.
      </Typography>

      <Typography variant="h6" gutterBottom>
        Slapping
      </Typography>
      <Typography variant="body1" paragraph>
        You can slap at any time — even when it isn't your turn. A slap is{" "}
        <b>valid</b> when the top card matches:
      </Typography>
      <ul>
        <li>
          <b>Doubles</b> — the card directly under it
        </li>
        <li>
          <b>Sandwich</b> — the card two below it
        </li>
        <li>
          <b>Top &amp; bottom</b> — the bottom card of the pile
        </li>
      </ul>
      <Typography variant="body1" paragraph>
        <b>Valid slap:</b> take the entire pile and play next.
        <br />
        <b>Wrong slap:</b> you burn one card from your hand face-down into the
        middle of the pile (it won't count for any combo).
      </Typography>

      <Typography variant="h6" gutterBottom>
        Optional rules (host-configurable)
      </Typography>
      <ul>
        <li>
          <b>Sum to 10</b> — slap when the top card and the previous card add
          up to 10
        </li>
        <li>
          <b>Marriage</b> — slap when a King and Queen are adjacent
        </li>
      </ul>

      <Typography variant="h6" gutterBottom>
        Face cards (J, Q, K, A)
      </Typography>
      <Typography variant="body1" paragraph>
        Playing a face card challenges the next player to play another face
        card within a set number of attempts:
      </Typography>
      <ul>
        <li>
          <b>Jack</b> — 1 attempt
        </li>
        <li>
          <b>Queen</b> — 2 attempts
        </li>
        <li>
          <b>King</b> — 3 attempts
        </li>
        <li>
          <b>Ace</b> — 4 attempts
        </li>
      </ul>
      <Typography variant="body1" paragraph>
        Hit a face card in time → the challenge passes to the next player with
        a new count. Run out of attempts → the original face-card player takes
        the pile. A valid slap interrupts the challenge at any time.
      </Typography>
    </Layout>
  );
}
