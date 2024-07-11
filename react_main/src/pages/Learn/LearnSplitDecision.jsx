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

export default function LearnSplitDecision(props) {
  const gameType = "Split Decision";

  useEffect(() => {
    document.title = "Learn Split Decision | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h4" gutterBottom>
        Learn Split Decision
      </Typography>
      <Typography variant="body1" paragraph>
        Based on the card game{" "}
        <Link
          href="https://www.tuesdayknightgames.com/tworoomsandaboom"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          2 Rooms and a Boom
        </Link>{" "}
        by Tuesday Knight Games.
      </Typography>
      <Typography variant="body1" paragraph>
        In Split Decision, all players are randomly split among two rooms, as
        well as split among two teams: Red and Blue. One player is assigned the
        role of President, and another is the Bomber. The game plays over a
        series of rounds, and in each round each room will elect a leader. Those
        leaders will then meet together and choose one or more players (the
        hostages) to swap between the rooms for the next round.
      </Typography>
      <Typography variant="body1" paragraph>
        As the game progresses the rounds will get shorter and the number of
        players swapped between rooms will decrease. It is the goal of the Red
        team for the President and the Bomber to end up in the same room after
        the last round. It is the goal of the Blue team for them to end up in
        different rooms.
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
