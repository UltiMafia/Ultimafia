import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnDiceWars(props) {
  useEffect(() => {
    document.title = "Learn Dice Wars | UltiMafia";
  }, []);

  const gameType = "Dice Wars";
  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Dice Wars
      </Typography>
      <Typography variant="body1" paragraph>
        Dice Wars is a turn-based strategy game where players compete to conquer territories on a map using dice.
        Each player starts with a set number of territories and dice, and the objective is to eliminate all other players by attacking their territories and defending your own.
        The game uses dice rolls to determine the outcomes of attacks, adding an element of chance to the strategic gameplay.
        The last player to control all territories wins.
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Roles</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RoleSearch gameType={gameType} />
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
