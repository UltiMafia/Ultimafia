import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnCardGames(props) {
  const gameType = "Card Games";

  useEffect(() => {
    document.title = "Learn Card Games | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h4" gutterBottom>
        Learn Card Games
      </Typography>
      <Typography variant="body1" paragraph>
      Texas Hold’em/Poker: In Texas Hold'em all players will be given two cards and chips to bet with.
       Players will place bets as Commuity Cards are revealed.
      The player who creates the best hand using the commuity cards and the 2 cards they were given wins the bets.
      Players who are unable to make the minimum bet at the start of round die.
      </Typography>
      <Typography variant="body1" paragraph>
        Cheat: Coming Soon
      </Typography>
      <Typography variant="body1" paragraph>
      Crazy Eights: Coming Soon
      </Typography>
      <Typography variant="body1" paragraph>
      Ratscrew: Coming Soon
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
