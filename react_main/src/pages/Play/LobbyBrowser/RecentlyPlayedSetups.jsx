import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { Redirect } from "react-router-dom";
import { Box, Card, IconButton, Typography } from "@mui/material";
import { UserContext } from "../../../Contexts";
import { useErrorAlert } from "../../../components/Alerts";
import { getRecentlyPlayedSetups } from "../../../services/gameService";
import getDefaults from "../Host/HostDefaults";
import Setup from "../../../components/Setup";
import { getRecentlyPlayedSetupsChart } from "./getRecentlyPlayedSetupsChart";
import { useTheme } from "@mui/styles";
import { useIsPhoneDevice } from "../../../hooks/useIsPhoneDevice";

export const RecentlyPlayedSetups = ({ daysInterval = 7 }) => {
  const theme = useTheme();
  const svgRef = useRef();
  const [setups, setSetups] = useState([]);
  const [redirect, setRedirect] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    (async () => {
      const playedSetups = await getRecentlyPlayedSetups({ daysInterval });
      setSetups(playedSetups);
    })();
  }, []);

  useEffect(() => {
    if (setups?.length) {
      const setupsInfo = setups.map((setup) => ({
        value: setup.percentage,
        name: setup.setupDetails.name,
      }));
      getRecentlyPlayedSetupsChart({ svgRef, setupsInfo, theme });
    }
  }, [setups, theme]);

  if (!setups?.length) {
    return "";
  }

  const setupRows = setups.map((setup) => {
    const onRehostClick = () => {
      let lobby = localStorage.getItem("lobby") || "All";
      let gameType = setup.setupDetails.gameType;

      const defaults = getDefaults(gameType);

      if (lobby === "All") lobby = "Main";
      if (gameType !== "Mafia" && lobby === "Main") {
        lobby = "Games";
      }

      axios
        .post("/game/host", {
          gameType: gameType,
          setup: setup.setupDetails.id,
          lobby: lobby,
          ranked: setup.setupDetails.ranked,
          ...defaults,
        })
        .then((res) => setRedirect(`/game/${res.data}`))
        .catch(errorAlert);
    };

    if (redirect) return <Redirect to={redirect} />;

    const showRedoButton = isPhoneDevice ? user.loggedIn : true;

    return (
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
        {showRedoButton && (
          <Box style={{ mx: 1, width: "32px", textAlign: "center" }}>
            {user.loggedIn && (
              <IconButton color="primary" onClick={onRehostClick}>
                <i className="rehost fas fa-redo" title="Rehost" />
              </IconButton>
            )}
          </Box>
        )}
      </Box>
    );
  });

  return (
    <Card variant="outlined">
      <Box sx={{ p: 2 }}>
        <Typography color="primary" gutterBottom>
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
