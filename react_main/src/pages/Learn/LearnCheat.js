import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnCheat(props) {
  const gameType = "Cheat";

  useEffect(() => {
    document.title = "Learn Cheat | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h4" gutterBottom>
        Learn Cheat
      </Typography>
      <Typography variant="body1" paragraph>
        In Cheat players will try to get rid of all of the cards in there hand 
        Each round players will be given 
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
