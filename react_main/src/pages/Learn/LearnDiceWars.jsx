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
    document.title = "Learn DiceWars | UltiMafia";
  }, []);

  const gameType = "DiceWars";
  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Jotto
      </Typography>
      <Typography variant="body1" paragraph>
        Jotto is a logic-oriented word game, where players select a secret word
        and attempt to guess their opponent's words.
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
