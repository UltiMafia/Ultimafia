import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/styles";

import { RoleSearch } from "../../components/Roles";

export default function LearnAcrotopia(props) {
  const gameType = "Acrotopia";
  const theme = useTheme();

  useEffect(() => {
    document.title = "Learn Acrotopia | UltiMafia";
  }, []);

  return (
    <div style={{ padding: theme.spacing(3) }}>
      <div className="learn">
        <Accordion>
          <AccordionSummary>
            <Typography variant="h4">Learn Acrotopia</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              All players are given an acronym and tasked to create a backronym
              based on it! All players then vote for their favorites, with the
              winners of each round getting points. The person with the most
              points at the end of the game is declared the winner!
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary>
            <Typography variant="h4">Roles</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <RoleSearch gameType={gameType} />
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  );
}
