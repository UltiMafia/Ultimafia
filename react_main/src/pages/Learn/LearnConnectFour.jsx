import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Link,
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnConnectFour(props) {
  const gameType = "Connect Four";

  useEffect(() => {
    document.title = "Learn Connect Four | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h4" gutterBottom>
        Learn Connect Four
      </Typography>
      <Typography variant="body1" paragraph>
        Based on the board game{" "}
        <Link
          href="https://boardgamegeek.com/boardgame/2719/connect-four"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Connect Four
        </Link>{" "}
        originally published by Milton Bradley.
      </Typography>
      <Typography variant="body1" paragraph>
        In Connect Four, players are competing to the be the first to reach four in a row.
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
