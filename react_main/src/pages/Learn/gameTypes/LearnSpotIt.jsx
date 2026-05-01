import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";

export default function LearnSpotIt({ Layout }) {
  const gameType = "Spot It";

  useEffect(() => {
    document.title = "Learn Spot It | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="body1" paragraph>
        Spot It is a fast-paced visual matching game. Every player is dealt a
        card filled with symbols, and a center card is placed for all to see.
        Each card shares exactly one matching symbol with the center card. Be
        the first to spot the matching symbol between your card and the center
        card and click it to claim the point. The player with the most points
        when the deck runs out wins!
      </Typography>
    </Layout>
  );
}
