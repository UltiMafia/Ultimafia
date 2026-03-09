import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnBattlesnakes({ Layout }) {
  const gameType = "Battlesnakes";

  useEffect(() => {
    document.title = "Learn Battlesnakes | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="body1" paragraph>
        The objective of Battlesnakes is to be the last surviving Snake
      </Typography>
    </Layout>
  );
}
