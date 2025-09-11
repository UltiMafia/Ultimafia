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
import { useTheme } from "@mui/material/styles";

//import { AchievementList } from "../../../../data/Achievements";
import { AchievementData } from "../../constants/Achievements";

export default function Achievements(props) {
  const theme = useTheme();

  const commandTableRows = Object.keys(AchievementData.Mafia).map((key) => {
    let { reward, description } = AchievementData.Mafia[key];

    return {
      term: key,
      reward,
      description,
    };
  });

  const commandTable = (
    <TableContainer component={Paper}>
      <Table aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Achievement</TableCell>
            <TableCell>Coin Reward</TableCell>
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
              <TableCell align="center">{row.reward}</TableCell>
              <TableCell align="center">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Typography variant="h2" gutterBottom>
        Achievements
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h3"> List of Achievements</Typography>
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
