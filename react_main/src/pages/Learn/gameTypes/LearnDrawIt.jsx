import React, { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
} from "@mui/material";
import { RoleSearch } from "../../../components/Roles";

const phases = [
  {
    name: "Pick (5s)",
    text: "The drawer chooses one of two words from the chosen deck. If they don't pick in time, the first option is auto-selected.",
  },
  {
    name: "Draw (30–180s, default 80s)",
    text: "The drawer draws their word on a shared canvas while everyone else types guesses in the common chat. The state ends early once everyone has guessed correctly.",
  },
  {
    name: "Reveal (5s)",
    text: "The word is revealed and points are tallied for the turn before the next drawer is up.",
  },
];

const scoring = [
  {
    name: "Guessers",
    text: "10 / 8 / 6 / 4 / 2 / 1 points by guess order. Sixth and beyond all earn 1 point.",
  },
  {
    name: "Drawer",
    text: "Earns the rounded average of all their guessers' scores this turn — clarity beats difficulty. Zero guessers means zero points.",
  },
  {
    name: "Winner",
    text: "Highest total score across all rounds wins. Ties become co-winners.",
  },
];

export default function LearnDrawIt({ Layout }) {
  const gameType = "Draw It";

  useEffect(() => {
    document.title = "Learn Draw It | UltiMafia";
  }, []);

  const mechanicsContent = (
    <>
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        Turn phases
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Phase</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {phases.map((row, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  <Typography fontWeight="medium">{row.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.text}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        Scoring
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Who</TableCell>
              <TableCell>Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scoring.map((row, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  <Typography fontWeight="medium">{row.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.text}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        Once you've guessed
      </Typography>
      <Typography variant="body2" paragraph>
        Once you guess the word, your subsequent messages stay in the main
        chat but are only visible to the drawer and other correct guessers —
        so you can chat freely without spoiling the answer for the players
        still guessing.
      </Typography>

      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        Word decks
      </Typography>
      <Typography variant="body2" paragraph>
        Six default decks ship with the game (Items, Fruits &amp; Veggies,
        Vehicles, Animals, Body &amp; Faces, Sports &amp; Games). You can build
        your own decks of 20–500 single-word nouns from the{" "}
        <Link component={RouterLink} to="/play/wordDecks">
          Word Decks page
        </Link>
        .
      </Typography>
    </>
  );

  return (
    <Layout
      rolesContent={<RoleSearch gameType={gameType} />}
      mechanicsContent={mechanicsContent}
    >
      <Typography variant="body1" paragraph>
        Draw It is a turn-based draw-and-guess minigame for 3–12 players. Each
        turn, one player picks a word from the chosen deck and draws it on a
        shared canvas while everyone else types guesses in chat. Speed-tier
        scoring rewards quick guessers, and the drawer earns the average of
        their guessers' scores — so the clearer you draw, the better.
      </Typography>
    </Layout>
  );
}
