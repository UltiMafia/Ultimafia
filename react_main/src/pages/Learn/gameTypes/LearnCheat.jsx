import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnCheat({ Layout }) {
  const gameType = "Cheat";

  useEffect(() => {
    document.title = "Learn Cheat | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="body1" paragraph>
      Cheat is a social card game wherein players will try to get to 0 cards. Each round players will be
        given a card type to play. They may play that card type or lie and play
        a diffrent card type. After they play their cards other players may call
        them out for lying. Players who called out for lying or incorrectly call
        out for lying must add all played cards to their hand.
      </Typography>
    </Layout>
  );
}
