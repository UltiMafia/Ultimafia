import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnRatscrew({ Layout }) {
  const gameType = "Ratscrew";

  useEffect(() => {
    document.title = "Learn Ratscrew | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="body1" paragraph>
      Ratscrew is a social card game wherein players will try to gather cards. Each round
        players will blindly play a card into the stack. Any player may slap the
        card if the played card is the same as the last card. If a slap is made
        incorrectly other players may challenge the slap. If a slap is correctly
        challenged the slappers gives the challenger a card. If incorrectly
        challenged the slapper takes a card from the challenger. When a
        successful slap is made the slapper gains the stack.
      </Typography>
    </Layout>
  );
}
