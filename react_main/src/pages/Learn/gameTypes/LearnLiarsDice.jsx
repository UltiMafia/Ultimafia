import React, { useEffect } from "react";
import { Typography, Grid, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RoleSearch } from "../../../components/Roles";
export default function LearnLiarsDice({ Layout }) {
  const gameType = "Liars Dice";
  const theme = useTheme();

  useEffect(() => {
    document.title = "Learn Liars Dice | UltiMafia";
  }, []);

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
        Liar's Dice is a social dice game. Each player has dice only they can see. On your turn you bid how many of
        a chosen face exist across all players’ dice; the next player may raise
        the bid or call the previous bid a lie. If a call is wrong, the caller
        loses a die; if it is right, the bidder loses one. Players who run out
        of dice are eliminated, and the last player left wins.
      </Typography>
    </Layout>
  );
}
