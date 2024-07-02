import React, { useEffect } from "react";
import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { useTheme } from "@mui/styles";

import { RoleSearch } from "../../components/Roles";

export default function LearnGhost(props) {
  const gameType = "Ghost";
  const theme = useTheme();

  useEffect(() => {
    document.title = "Learn Ghost | UltiMafia";
  }, []);

  return (
    <div style={{ padding: theme.spacing(3) }}>
      <div className="learn">
        <Accordion>
          <AccordionSummary>
          <Typography variant="h4">Learn Ghost</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              The objective of Ghost is to keep the secret word secret. The villagers begin the game knowing the word (chosen by the host), while the ghosts must guess it.
            </Typography>
            <Typography paragraph>
              Each player takes a turn giving a clue related to the word to reveal themselves to other villagers without revealing the word to the ghosts. After each round of clues a person is voted out as the ghost. If they were in fact the ghost, they have a chance to guess the secret word to win. Alternatively, the ghosts may win if they gain a majority.
            </Typography>
            <Typography paragraph>
              The other town role is Fool, who appear to themselves as ordinary villagers but share an alternate secret word, creating confusion among both teams.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Typography variant="h4">Roles</Typography>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}