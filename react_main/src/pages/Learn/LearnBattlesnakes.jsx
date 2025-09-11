import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { RoleSearch } from "../../components/Roles";

export default function LearnBattlesnakes(props) {
  const gameType = "Battlesnakes";
  const theme = useTheme();

  useEffect(() => {
    document.title = "Learn Battlesnakes | UltiMafia";
  }, []);

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Battlesnakes
      </Typography>
      <Typography variant="body1" paragraph>
        The objective of Battlesnakes is to be the last surviving Snake
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
