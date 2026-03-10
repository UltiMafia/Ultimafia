import React, { useEffect } from "react";
import { Typography, Link } from "@mui/material";
import { RoleSearch } from "../../../components/Roles";
export default function LearnConnectFour({ Layout }) {
  const gameType = "Connect Four";

  useEffect(() => {
    document.title = "Learn Connect Four | UltiMafia";
  }, []);

  return (
    <Layout rolesContent={<RoleSearch gameType={gameType} />}>
      <Typography variant="body1" paragraph>
        Based on the board game{" "}
        <Link
          href="https://boardgamegeek.com/boardgame/2719/connect-four"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Connect Four
        </Link>{" "}
        invented by David Bowie.
      </Typography>
      <Typography variant="body1" paragraph>
        Connect Four is a social board game played on a vertical grid. Players take
        turns dropping discs into columns; each disc falls to the lowest open
        space. The first player to get four of their discs in a horizontal or vertical row wins.
      </Typography>
    </Layout>
  );
}
