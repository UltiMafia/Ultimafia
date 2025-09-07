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

export default function LearnResistance(props) {
  const gameType = "Resistance";

  useEffect(() => {
    document.title = "Learn Resistance | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h4" gutterBottom>
        Learn Resistance
      </Typography>
      <Typography variant="body1" paragraph>
        Based on the card game{" "}
        <Link
          href="https://www.boardgamegeek.com/boardgame/41114/resistance"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          The Resistance
        </Link>{" "}
        by Don Eskridge.
      </Typography>
      <Typography variant="body1" paragraph>
        In Resistance, a group of rebels is trying to overthrow the government
        by completing a series of missions. However, the government has caught
        word of the plan and has recruited spies to infiltrate the resistance
        and sabotage the missions.
      </Typography>
      <Typography variant="body1" paragraph>
        At the beginning of each mission a player is selected as the leader and
        must recruit several group members to the team. All players vote on the
        selected team and if the majority approve then the mission will proceed.
        Otherwise, a new leader is chosen to make a new team. If several leaders
        are unable to form a team then that mission automatically fails.
      </Typography>
      <Typography variant="body1" paragraph>
        During a mission the members of the teams who are spies can choose to
        either make the mission succeed or fail. If at least one team member
        opts for it to fail then the entire mission will fail, otherwise it will
        succeed. The game continues until a certain number of missions succeed
        or fail, with the Resistance and the Spies winning respectively.
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
