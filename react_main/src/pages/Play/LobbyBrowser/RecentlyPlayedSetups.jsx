import React, { useEffect, useRef, useState, useContext } from "react";

import {
  Box,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import { getRecentlyPlayedSetups } from "services/gameService";
import HostGameDialogue from "components/HostGameDialogue";
import Setup from "components/Setup";
import { getRecentlyPlayedSetupsChart } from "./getRecentlyPlayedSetupsChart";
import { useTheme } from "@mui/styles";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

export const RecentlyPlayedSetups = ({ lobby }) => {
  const theme = useTheme();
  const svgRef = useRef();
  const [setups, setSetups] = useState([]);
  const [selSetup, setSelSetup] = useState(null);
  const [ishostGameDialogueOpen, setIshostGameDialogueOpen] = useState(false);

  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    (async () => {
      const playedSetups = await getRecentlyPlayedSetups({ lobby });
      setSetups(playedSetups);
    })();
  }, [lobby]);

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

  function onSelectSetup(setup) {
    setSelSetup(setup);
    setIshostGameDialogueOpen(true);
  }

  const setupRows = setups.map((setup) => {
    const showRedoButton = isPhoneDevice ? user.loggedIn : true;

    return (
      <Box
        key={setup.setupDetails.id}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Setup setup={setup.setupDetails} maxRolesCount={6} fixedWidth />
        {showRedoButton && (
          <Box style={{ mx: 1, width: "32px", textAlign: "center" }}>
            {user.loggedIn && (
              <IconButton
                color="primary"
                onClick={() => onSelectSetup(setup.setupDetails)}
              >
                <i className="rehost fas fa-redo" title="Rehost" />
              </IconButton>
            )}
          </Box>
        )}
      </Box>
    );
  });

  return (
    <Paper>
      {selSetup && (
        <HostGameDialogue
          open={ishostGameDialogueOpen}
          setOpen={setIshostGameDialogueOpen}
          setup={selSetup}
        />
      )}
      <Box sx={{ p: 2 }}>
        <Typography color="primary" gutterBottom>
          Most popular setups
        </Typography>
        <Divider orientation="horizontal" flexItem sx={{ mb: 1 }} />
        <Stack spacing={1}>{setupRows}</Stack>
        <Box sx={{ mt: 2 }}>
          <svg ref={svgRef} />
        </Box>
      </Box>
    </Paper>
  );
};
