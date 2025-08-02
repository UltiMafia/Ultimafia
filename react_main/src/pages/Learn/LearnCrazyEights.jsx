import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnCrazyEights(props) {
  const gameType = "Crazy Eights";

  useEffect(() => {
    document.title = "Learn Crazy Eights | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h4" gutterBottom>
        Learn CrazyEights
      </Typography>
      <Typography variant="body1" paragraph>
        In Crazy Eights, players will try to be the first to get an empty hand.
        Each round, players will be given a hand containing 7 cards.
        At the start of each round, the top card of the draw pile is placed face up and designated the 'current card'.
        Players may discard any card matching either the suit or value of the current card, with a valid discard becoming the new 'current card'.
        If you can not make a valid discard, draw from the draw pile until you can make one.
        All 8s can be played at any time, and give the player who placed the 8 the ability to call for any suit.
        After a suit has been called, the next card must be either from that suit or another 8.
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
