import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnDiceWars({ Layout }) {
  const gameType = "Dice Wars";

  useEffect(() => {
    document.title = "Learn Dice Wars | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="body1" paragraph>
        Dice Wars is a turn-based strategy game where players compete to conquer
        territories on a map using dice. Each player starts with a set number of
        territories and dice, and the objective is to eliminate all other
        players by attacking their territories and defending your own. The game
        uses dice rolls to determine the outcomes of attacks, adding an element
        of chance to the strategic gameplay. The last player to control all
        territories wins.
      </Typography>
    </Layout>
  );
}
