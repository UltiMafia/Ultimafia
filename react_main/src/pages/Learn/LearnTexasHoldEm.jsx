import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnTexasHoldEm(props) {
  const gameType = "Texas Hold Em";

  useEffect(() => {
    document.title = "Learn Texas Hold Em | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Texas Hold Em
      </Typography>
      <Typography variant="body1" paragraph>
        Texas Hold’em/Poker: In Texas Hold'em all players will be given two
        cards and chips to bet with. Players will place bets as Commuity Cards
        are revealed. The player who creates the best hand using the commuity
        cards and the 2 cards they were given wins the bets. Players who are
        unable to make the minimum bet at the start of round die.
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
