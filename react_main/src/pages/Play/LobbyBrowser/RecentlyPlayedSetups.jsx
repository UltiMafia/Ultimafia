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
import { useTheme } from "@mui/material/styles";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import LobbySidebarPanel from "./LobbySidebarPanel";

export const RecentlyPlayedSetups = ({ lobby }) => {
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
    <LobbySidebarPanel title="Most Popular Setups">
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
