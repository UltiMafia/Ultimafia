import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnJotto(props) {
  useEffect(() => {
    document.title = "Learn Jotto | UltiMafia";
  }, []);

  const gameType = "Jotto";
  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h4" gutterBottom>
        Learn Jotto
      </Typography>
      <Typography variant="body1" paragraph>
        Jotto is a logic-oriented word game, where players select a secret word
        and attempt to guess their opponent's words.
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h4">Roles</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RoleSearch gameType={gameType} />
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
