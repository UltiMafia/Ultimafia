import React, { useEffect } from "react";
import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { useTheme } from "@mui/styles";
import { RoleSearch } from "../../components/Roles";


export default function LearnJotto(props) {
  useEffect(() => {
    document.title = "Learn Jotto | UltiMafia";
  }, []);

  const gameType = "Jotto";
  const theme = useTheme();

  return (
    <div style={{ padding: theme.spacing(3) }}>
      <div className="learn">
        <Accordion>
          <AccordionSummary>
          <Typography variant="h4">Learn Jotto</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Jotto is a logic-oriented word game, where players select a secret word and attempt to guess their opponent's words.
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
