import React from "react";
import "css/play.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useTheme } from "@mui/styles";

import { slangList } from "../../constants/slangList";
import { commandList } from "../../constants/commandList";
//import { AchievementList } from "../../../../data/Achievements";

export default function Terminology(props) {
  const theme = useTheme();

  const commandTableRows = Object.keys(commandList).map((key) => {
    let { input, description } = commandList[key];

    return {
      term: key,
      input,
      description,
    };
  });

  const commandTable = (
    <TableContainer component={Paper}>
      <Table aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Command</TableCell>
            <TableCell>Input</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {commandTableRows.map((row) => (
            <TableRow
              key={row.name}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row" align="center">
                {row.term}
              </TableCell>
              <TableCell align="center">{row.input}</TableCell>
              <TableCell align="center">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

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

  const slangTable = (
    <TableContainer component={Paper}>
      <Table aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Term</TableCell>
            <TableCell>Definition</TableCell>
            <TableCell>Emote</TableCell>
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

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Terminology
      </Typography>
      <Typography variant="body1" paragraph>
        The game features a comprehensive list of terms and chat commands.
        Understanding these commands and terms is crucial for mastering the
        game's mechanics and strategies. To improve the definitions or add new
        ones, we encourage you to get involved through our Discord or Github
        Repo.
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h6">Commands</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Below is a list of chat commands able to be used in games.
          </Typography>
          <Box className="paragraph">{commandTable}</Box>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h6">Slang</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Below is a list of terms that are automatically detected during
            gameplay. Players can choose to toggle the visibility of these terms
            through their profile settings.
          </Typography>
          <Box className="paragraph">{slangTable}</Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
