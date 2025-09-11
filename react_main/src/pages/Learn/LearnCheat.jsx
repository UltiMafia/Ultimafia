import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnCheat(props) {
  const gameType = "Cheat";

  useEffect(() => {
    document.title = "Learn Cheat | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Cheat
      </Typography>
      <Typography variant="body1" paragraph>
        In Cheat players will try to get to 0 cards. Each round players will be
        given a Card type to play. They may play that card type or lie and play
        a diffrent card type. After they play their cards other players may call
        them out for lying. Players who called out for lying or incorrectly call
        out for lying must add all played cards to their hand.
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
