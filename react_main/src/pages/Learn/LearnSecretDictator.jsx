import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Link,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnSecretDictator(props) {
  const gameType = "Secret Dictator";

  useEffect(() => {
    document.title = "Learn Secret Dictator | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Secret Dictator
      </Typography>
      <Typography variant="body1" paragraph>
        Based on the card game{" "}
        <Link
          href="https://secrethitler.com"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Secret Hitler
        </Link>{" "}
        by Goat, Wolf, & Cabbage.
      </Typography>
      <Typography variant="body1" paragraph>
        In Secret Dictator, players are politicians attempting to hold a fragile
        Liberal government together and stem the rising tide of Fascism. Watch
        out though—there are secret Fascists among you, and one player is Secret
        Dictator.
      </Typography>
      <Typography variant="body1" paragraph>
        At the beginning of the game, each player is secretly assigned to one of
        three roles: Liberal, Fascist, or the Dictator. The Liberals have a
        majority, but they don’t know for sure who anyone is; Fascists must
        resort to secrecy and sabotage to accomplish their goals. The Dictator
        plays for the Fascist team, and the Fascists know the Dictator’s
        identity from the outset, but most of the time, the Dictator doesn’t
        know the Fascists and must work to figure them out.
      </Typography>
      <Typography variant="body1" paragraph>
        The Liberals win by enacting five Liberal Policies or killing the
        Dictator. The Fascists win by enacting six Fascist Policies, or if the
        Dictator is elected Chancellor after three Fascist Policies have been
        enacted.
      </Typography>
      <Typography variant="body1" paragraph>
        Whenever a Fascist Policy is enacted, the government becomes more
        powerful, and the President is granted a single-use power which must be
        used before the next round can begin. It doesn’t matter what team the
        President is on; in fact, even Liberal players might be tempted to enact
        a Fascist Policy to gain new powers.
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
