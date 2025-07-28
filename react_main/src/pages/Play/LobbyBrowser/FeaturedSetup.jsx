import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Button, Paper, Stack } from "@mui/material";
import { UserContext } from "Contexts";
import Setup from "components/Setup";
import HostGameDialogue from "components/HostGameDialogue";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

export const FeaturedSetup = ({ lobby, glowingHostButton }) => {
  const [featuredSetup, setFeaturedSetup] = useState(null);
  const [ishostGameDialogueOpen, setIshostGameDialogueOpen] = useState(false);

  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();
  const isButtonGlowing = !ishostGameDialogueOpen && glowingHostButton;

  // Fetch the featured setup for this lobby
  useEffect(() => {
    var featuredCategory = "main";

    if (lobby === "Games") {
      featuredCategory = "minigames";
    }
    else if (user.gamesPlayed && !user.canPlayRanked) {
      featuredCategory = "classic";
    }

    axios
      .get(`/api/setup/featuredSetup?featuredCategory=${featuredCategory}`)
      .then((res) => {
        setFeaturedSetup(res.data);
      });
  }, [lobby]);

  if (!featuredSetup) {
    return "";
  }

  return (
    <>
      <HostGameDialogue open={ishostGameDialogueOpen} setOpen={setIshostGameDialogueOpen} setup={featuredSetup} />
      <Paper>
        <Stack direction="row" spacing={0.5} sx={{ p: 0.5 }}>
          <Button color="primary" sx={{ maxWidth: "30px" }} className={isButtonGlowing ? "glow-slightly" : ""} onClick={() => setIshostGameDialogueOpen(true)}>
            Play Setup
          </Button>
          <Setup setup={featuredSetup} maxRolesCount={6} fixedWidth/>
        </Stack>
      </Paper>
    </>
  );
};
