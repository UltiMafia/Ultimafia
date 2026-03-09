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
        Battlesnakes is a competitive game where each player controls a snake on a
        shared grid. Snakes move each turn and grow by eating food; they are
        eliminated if they hit a wall, another snake, or their own body. The last
        snake left alive wins.
      </Typography>
    </Layout>
  );
}
