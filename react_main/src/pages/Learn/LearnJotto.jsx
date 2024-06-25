import React, { useEffect } from "react";
import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { useTheme } from "@mui/styles";

export default function LearnJotto(props) {
  useEffect(() => {
    document.title = "Learn Jotto | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div style={{ padding: theme.spacing(3) }}>
      <div className="learn">
        <Accordion>
          <AccordionSummary expandIcon={"V"}>
          <Typography variant="h4">Learn Jotto</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Jotto is a logic-oriented word game, where players select a secret word and attempt to guess their opponent's words.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  );
}
