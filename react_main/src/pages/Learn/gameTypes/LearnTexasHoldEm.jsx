import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnTexasHoldEm({ Layout }) {
  const gameType = "Texas Hold Em";

  useEffect(() => {
    document.title = "Learn Texas Hold Em | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="body1" paragraph>
        Texas Hold'em/Poker: In Texas Hold'em all players will be given two
        cards and chips to bet with. Players will place bets as Commuity Cards
        are revealed. The player who creates the best hand using the commuity
        cards and the 2 cards they were given wins the bets. Players who are
        unable to make the minimum bet at the start of round die.
      </Typography>
    </Layout>
  );
}
