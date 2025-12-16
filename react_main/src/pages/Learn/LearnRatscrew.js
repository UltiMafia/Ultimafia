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
  const gameType = "Ratscrew";

  useEffect(() => {
    document.title = "Learn Ratscrew | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Cheat
      </Typography>
      <Typography variant="body1" paragraph>
        In Ratscrew players will try to gather of the cards cards. Each round players will blindly
        play a card into the stack. Any player may slap the card if the played card is the same as the last card.
        If a slap is made incorrectly other players may challenge the slap. If a slap is correctly challenged
        the slappers gives the challenger a card. If incorrectly challenged the slapper takes a card from 
        the challenger. When a successful slap is made the slapper gains the stack.
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
