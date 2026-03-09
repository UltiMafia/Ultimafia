import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnJotto({ Layout }) {
  const gameType = "Jotto";

  useEffect(() => {
    document.title = "Learn Jotto | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="body1" paragraph>
        Jotto is a logic-oriented word game, where players select a secret word
        and attempt to guess their opponent's words.
      </Typography>
    </Layout>
  );
}
