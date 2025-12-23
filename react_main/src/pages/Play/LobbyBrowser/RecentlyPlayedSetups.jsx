import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";

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
import { useTheme } from "@mui/material/styles";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import LobbySidebarPanel from "./LobbySidebarPanel";

export const RecentlyPlayedSetups = ({ lobby }) => {
  const [title, setTitle] = useState([]);
  const [setups, setSetups] = useState([]);
  const [selSetup, setSelSetup] = useState(null);
  const [ishostGameDialogueOpen, setIshostGameDialogueOpen] = useState(false);

  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    if (lobby !== "Competitive") {
      getRecentlyPlayedSetups({ lobby }).then((playedSetups) => {
        setSetups(playedSetups);
        setTitle("Most Popular Setups");
      });
    } else {
      axios.get(`/api/competitive/roundInfo`).then((response) => {
        const roundInfo = response.data;
        if (roundInfo.round) {
          const allowedSetups = roundInfo.allowedSetups.map((allowedSetup) => {
            return { setupDetails: allowedSetup };
          });
          setSetups(allowedSetups);
          setTitle(`Competitive Round ${roundInfo.round.number} Setups`);
        }
      });
    }
  }, [lobby]);

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
        <Setup setup={setup.setupDetails} />
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
    <LobbySidebarPanel title={title}>
      {selSetup && (
        <HostGameDialogue
          open={ishostGameDialogueOpen}
          setOpen={setIshostGameDialogueOpen}
          setup={selSetup}
        />
      )}
      <Stack spacing={1}>{setupRows}</Stack>
    </LobbySidebarPanel>
  );
};
