import React, { useEffect, useRef, useState } from "react";
import { Box, Card, Typography } from "@mui/material";
import { getRecentlyPlayedSetups } from "../../../services/gameService";
import Setup from "../../../components/Setup";
import { getRecentlyPlayedSetupsChart } from "./getRecentlyPlayedSetupsChart";
import { useTheme } from "@mui/styles";

export const RecentlyPlayedSetups = ({ daysInterval = 7 }) => {
  const theme = useTheme();
  const svgRef = useRef();
  const [setups, setSetups] = useState([]);

  useEffect(() => {
    (async () => {
      const playedSetups = await getRecentlyPlayedSetups({ daysInterval });
      setSetups(playedSetups);

      const totalCount = playedSetups.reduce(
        (acc, setup) => acc + setup.count,
        0
      );
      const setupsInfo = playedSetups.map((setup) => ({
        count: setup.count / totalCount,
        name: setup.setupDetails.name,
      }));
      getRecentlyPlayedSetupsChart({ svgRef, setupsInfo, theme });
    })();
  }, []);

  if (!setups?.length) {
    return "";
  }

  const setupRows = setups.map((setup) => (
    <Box
      key={`recently-played-${setup._id}`}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Setup setup={setup.setupDetails} />
      <Typography variant="body2">{setup.setupDetails.name}</Typography>
    </Box>
  ));

  return (
    <Card variant="outlined">
      <Box sx={{ p: 2 }}>
        <Typography color="secondary" gutterBottom>
          Most popular setups
        </Typography>
        {setupRows}
        <Box sx={{ mt: 2 }}>
          <svg ref={svgRef} />
        </Box>
      </Box>
    </Card>
  );
};
