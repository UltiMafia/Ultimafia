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
        Jotto is a logic-oriented word game where each player has a secret word
        of the same length. On your turn you guess a word and receive feedback
        on how many letters match your opponent’s word. Use that information to
        narrow down possibilities; the first player to correctly identify the
        opponent’s word wins.
      </Typography>
    </Layout>
  );
}
