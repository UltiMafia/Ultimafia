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
import { useTheme } from '@mui/styles';

import { slangList } from "../../constants/slangList";

export default function Terminology(props) {
    const theme = useTheme();

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
            <TableCell>
              Term
            </TableCell>
            <TableCell>
              Definition
            </TableCell>
            <TableCell>
              Emote
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

return (
    <>
  <Accordion>
  <AccordionSummary>
    <Typography variant="h6">Terminology</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Typography paragraph>
      The game features a comprehensive list of terms that are automatically detected during gameplay. Understanding these terms is crucial for mastering the game's mechanics and strategies.
      To improve the definitions or contribute to the emoji pool, we encourage you to get involved through our Discord or Github Repo.
      Your contributions are invaluable in keeping the terminology current and engaging.
      Players can choose to toggle the visibility of these terms through their profile settings.
    </Typography>
    <Box className="paragraph">{slangTable}</Box>
  </AccordionDetails>
</Accordion>
</>
);
}