import React, { useEffect } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { RoleSearch } from "../../../components/Roles";

const mechanics = [
  {
    name: "Reverse Mode",
    text: "Instead of a prompt leading to an answer, the players first come up with answers, then they come up with funny prompts that could have been given to get those answers!",
  },
  {
    name: "Wacky People",
    text: "Things get more personal! Players answer questions about themselves, then other players also answer the prompt. After, players need to try and find the real answer! Players score 2 points for guessing the correct answer, players score 1 point for convincing another person to guess their answer, and the true answerer gets 2 points when players guess their answer!",
  },
  {
    name: "Acrotopia",
    text: "All players are given an acronym and tasked to create a backronym based on it! All players then vote for their favorites, with the winners of each round getting points. The person with the most points at the end of the game is declared the winner.",
  },
  {
    name: "Wacky Decisions",
    text: "Players will try to create would you rather questions that split the votes. Each round one player will create a would you rather question and other players will answer. Points will be given to that player based on how close the players were to a 50/50 split.",
  },
];

export default function LearnWackyWords({ Layout }) {
  const gameType = "Wacky Words";

  useEffect(() => {
    document.title = "Learn Wacky Words | UltiMafia";
  }, []);

  const mechanicsContent = (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Mode</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mechanics.map((row, index) => (
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
  );

  return (
    <Layout
      rolesContent={<RoleSearch gameType={gameType} />}
      mechanicsContent={mechanicsContent}
    >
      <Typography variant="body1" paragraph>
        Wacky Words is a social word game wherein all players are given a prompt and tasked to answer it! All players then
        vote for their favorites, with the winners of each round getting points.
        The person with the most points at the end of the game is declared the
        winner!
      </Typography>
    </Layout>
  );
}
