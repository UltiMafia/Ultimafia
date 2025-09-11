import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnWackyWords(props) {
  const gameType = "Wacky Words";

  useEffect(() => {
    document.title = "Learn Wacky Words | UltiMafia";
  }, []);

  const theme = useTheme();

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Wacky Words
      </Typography>
      <Typography variant="body1" paragraph>
        All players are given a prompt and tasked to answer it! All players then
        vote for their favorites, with the winners of each round getting points.
        The person with the most points at the end of the game is declared the
        winner!
      </Typography>
      <Typography variant="body1" paragraph>
        Reverse Mode: In reverse mode, instead of a prompt leading to an answer,
        the players first come up with answers, then they come up with funny
        prompts that could have been given to get those answers!
      </Typography>
      <Typography variant="body1" paragraph>
        Wacky People: In Wacky People, things get more personal! Players answer
        questions about themselves, then other players also answer the prompt.
        After, players need to try and find the real answer! Players score 2
        points for guessing the correct answer, players score 1 point for
        convincing another person to guess their answer, and the true answerer
        gets 2 points when players guess their answer!
      </Typography>
      <Typography variant="body1" paragraph>
        Acrotopia: In Acrotopia, All players are given an acronym and tasked to
        create a backronym based on it! All players then vote for their
        favorites, with the winners of each round getting points. The person
        with the most points at the end of the game is declared the winner
      </Typography>
      <Typography variant="body1" paragraph>
        Wacky Decisions: In Wacky Decisions, players will try to create would
        you rather questions that split the votes. Each round one player will
        create a would you rather question and other players will answer. Points
        will be given to that player based on how close the players where to a
        50/50 split.
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
