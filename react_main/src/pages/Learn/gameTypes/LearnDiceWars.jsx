import React, { useEffect } from "react";
import { Typography, Grid, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../../components/Roles";
export default function LearnDiceWars({ Layout }) {
  const gameType = "Dice Wars";
  const theme = useTheme();

  useEffect(() => {
    document.title = "Learn Dice Wars | UltiMafia";
  }, []);

  const mechanics = [
    {
      name: "Attacking",
      text: "Click one of your territories that has 2 or more dice, then click an adjacent enemy territory to attack. Both sides roll all their dice and sum the results. If the attacker's total is higher, they conquer the territory and move their dice in (leaving 1 behind). If the defender's total is equal or higher, the attack fails and the attacker is left with just 1 die.",
    },
    {
      name: "Reinforcements",
      text: "At the end of your turn, you receive bonus dice equal to the size of your largest connected group of territories. These dice are placed randomly across your territories. Keeping your lands connected is the key to growing stronger!",
    },
    {
      name: "Elimination",
      text: "A player who loses all their territories is eliminated from the game. The last player standing wins.",
    },
  ];

  const mechanicsContent = (
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
  );

  return (
    <Layout
      rolesContent={<RoleSearch gameType={gameType} />}
      mechanicsContent={mechanicsContent}
    >
      <Typography variant="body1" paragraph>
        Dice Wars is a turn-based strategy game where players fight to conquer a
        map of territories. Each territory holds a stack of dice. On your turn,
        you can attack neighboring enemy territories by rolling your dice against
        theirs — highest total wins. When you end your turn, you receive
        reinforcement dice based on how many of your territories are connected
        together. The last player with territories on the board wins!
      </Typography>
    </Layout>
  );
}
