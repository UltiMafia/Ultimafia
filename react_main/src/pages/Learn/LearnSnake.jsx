import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/styles";

import { RoleSearch } from "../../components/Roles";
import { SnakeGameType } from "../../Constants";

export default function LearnSnake(props) {
  const gameType = SnakeGameType;
  const theme = useTheme();

  useEffect(() => {
    document.title = "Learn Snake | UltiMafia";
  }, []);

  return (
    <div className="learn">
      <Typography variant="h4" gutterBottom>
        Learn Snake
      </Typography>
      <Typography variant="body1" paragraph>
        The objective of Snake is to be the last survivor
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
