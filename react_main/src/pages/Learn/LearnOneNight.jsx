import React, { useEffect } from "react";
import { Accordion, AccordionSummary, AccordionDetails, Typography, Link } from "@mui/material";
import { useTheme } from "@mui/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnOneNight(props) {
  const gameType = "One Night";

  useEffect(() => {
    document.title = "Learn One Night | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div style={{ padding: theme.spacing(3) }}>
      <div className="learn">
        <Accordion>
          <AccordionSummary expandIcon={"V"}>
            <Typography variant="h4">Learn One Night</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Based on{" "}
              <Link
                href="https://beziergames.com/collections/one-night-ultimate-werewolf"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                One Night Ultimate Werewolf
              </Link>{" "}
              by Bezier Games.
            </Typography>
            <Typography paragraph>
              One Night is a game of logical deduction similar to Mafia, but with only one Night and one Day phase.
            </Typography>
            <Typography paragraph>
              The Village side must kill one of the Werewolves to win, and Werewolves must kill one of the village. The
              Village also loses if there are no Werewolves present but they kill a Village member. The one night is
              typically eventful; the role you are given at the beginning of the night may not be the card you end up
              with. Actions will all take place at once at the end of the night. The order of events is given by times
              in the role descriptions.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Typography variant="h5" style={{ marginTop: theme.spacing(3) }}>
          Roles
        </Typography>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
