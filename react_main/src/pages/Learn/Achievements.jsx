import React from "react";
import "../../css/play.css";
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

import { AchievementList } from "../../../../data/Achievements";

export default function Achievements(props) {
  const theme = useTheme();

  const commandTableRows = Object.keys(AchievementList.Mafia).map((key) => {
    let { description } = AchievementList.Mafia[key];

    return {
      term: key,
      description
    };
  });

  const commandTable = (
    <TableContainer component={Paper}>
      <Table aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Achievement</TableCell>
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



  return (
    <>
      <Typography variant="h4" gutterBottom>
        Achievements
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h6">Commands</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Below is a list of Achievements that can be earned during a game.
          </Typography>
          <Box className="paragraph">{commandTable}</Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
