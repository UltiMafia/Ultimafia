import React, { useEffect, useRef, useState } from "react";
import { Box, Card, Typography } from "@mui/material";
import { getRecentlyPlayedSetups } from "../../../services/gameService";
import Setup from "../../../components/Setup";
import { Lobbies }  from "../../../src/Constants.jsx";
import { getRecentlyPlayedSetupsChart } from "./getRecentlyPlayedSetupsChart";
import { useTheme } from "@mui/styles";

export const RecentlyPlayedSetups = ({ daysInterval = 7 }) => {
  const theme = useTheme();
  const svgRef = useRef();
  const [setups, setSetups] = useState([]);
  const [selectedLobby, setSelectedLobby] = useState('All');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    (async () => {
      const playedSetups = await getRecentlyPlayedSetups({ daysInterval, lobby: selectedLobby });
      setSetups(playedSetups);
    })();
  }, [selectedLobby]);

  useEffect(() => {
    if (setups?.length) {
      const setupsInfo = setups.map((setup) => ({
        value: setup.percentage,
        name: setup.setupDetails.name,
      }));
      getRecentlyPlayedSetupsChart({ svgRef, setupsInfo, theme });
    }
  }, [setups, theme]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (lobby) => {
    setAnchorEl(null);
    if (lobby) {
      setSelectedLobby(lobby);
    }
  };

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
        <Typography color="primary" gutterBottom>
          Most popular setups
        </Typography>
        <Button
          aria-controls={open ? 'lobby-menu' : undefined}
          aria-haspopup="true"
          onClick={handleClick}
          variant="contained"
          sx={{ mb: 2, textTransform: 'none', fontWeight: '800' }}
        >
          Select Lobby: {selectedLobby}
        </Button>
        <Menu
          id="lobby-menu"
          anchorEl={anchorEl}
          keepMounted
          open={open}
          onClose={() => handleClose(null)}
        >
          {Lobbies.map((lobby) => (
            <MenuItem key={lobby} onClick={() => handleClose(lobby)}>
              {lobby}
            </MenuItem>
          ))}
        </Menu>
        {setupRows}
        <Box sx={{ mt: 2 }}>
          <svg ref={svgRef} />
        </Box>
      </Box>
    </Card>
  );
};
