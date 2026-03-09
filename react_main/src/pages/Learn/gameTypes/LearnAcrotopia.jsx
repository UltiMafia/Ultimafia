import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnAcrotopia({ Layout }) {
  const gameType = "Acrotopia";

  useEffect(() => {
    document.title = "Learn Acrotopia | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="h2" gutterBottom>
        Learn Acrotopia
      </Typography>
      <Typography variant="body1" paragraph>
      Acrotopia is a social word game wherein players are given an acronym and tasked to create a backronym based
        on it! All players then vote for their favorites, with the winners of
        each round getting points. The person with the most points at the end of
        the game is declared the winner!
      </Typography>
    </Layout>
  );
}
