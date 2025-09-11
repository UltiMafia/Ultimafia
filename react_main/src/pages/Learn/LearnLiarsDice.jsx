import React, { useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../components/Roles";

export default function LearnLiarsDice(props) {
  const gameType = "Liars Dice";

  useEffect(() => {
    document.title = "Learn Liars Dice | UltiMafia";
  }, []);

  const theme = useTheme();

  const mechanics = [
    {
      name: "Spot On",
      text: "Players will receive a new option to call 'Spot On' during their turn. This means that the previous player guessed the exact amount of the chosen dice. If called correctly, everyone except the caller will lose a dice. If called wrongly, only the caller will lose a dice. Spot on cannot be used on the first turn of each round.",
    },
    {
      name: "Wild Ones",
      text: "Ones will count towards any dice amount.",
    },
    {
      name: "Starting Dice",
      text: "Players will start with amount of dice specified here. Default is 5.",
    },
  ];

  return (
    <div className="learn">
      <Typography variant="h2" gutterBottom>
        Learn Liars Dice
      </Typography>
      <Typography variant="body1" paragraph>
        Each player starts with 5 dice unless customized, and can only see faces
        of their own dice. Taking turns, players guess how many of a chosen face
        are present in all players' dice combined.
      </Typography>
      <Typography variant="body1" paragraph>
        If a player thinks the player before them is wrong, they can call a lie.
        In this case, if there are fewer dice showing that face than guessed,
        the previous player loses a die. If there are more or an equal number of
        dice showing that face, the player who called a lie loses a die.
      </Typography>
      <Typography variant="body1" paragraph>
        When a player runs out of dice, they are eliminated. The last player
        remaining is the winner.
      </Typography>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h3">Roles</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RoleSearch gameType={gameType} />
        </AccordionDetails>
      </Accordion>
      <Accordion style={{ marginTop: theme.spacing(3) }}>
        <AccordionSummary>
          <Typography>Mechanics</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {mechanics.map((mechanic, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper style={{ padding: theme.spacing(2), height: "100%" }}>
                  <Typography variant="h4">{mechanic.name}</Typography>
                  <Typography>{mechanic.text}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
