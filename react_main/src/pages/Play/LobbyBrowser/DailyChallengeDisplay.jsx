import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { UserContext } from "Contexts";
import { DailyChallengeData } from "constants/DailyChallenge";
import { RoleCount } from "components/Roles";

import umcoin from "images/umcoin.png";
import LobbySidebarPanel from "./LobbySidebarPanel";

export const DailyChallenges = () => {
  const user = useContext(UserContext);
  const [labFeatured, setLabFeatured] = useState(null);

  let dailys = user.dailyChallenges?.map((m) => m.split(":"));

  const hasLabChallenge = dailys?.some((quest) => {
    const meta = Object.values(DailyChallengeData).find(
      (d) => d.ID === quest[0]
    );
    return meta?.internal?.includes("PlayLabSetup");
  });

  useEffect(() => {
    if (!hasLabChallenge) {
      setLabFeatured(null);
      return;
    }
    axios
      .get("/api/lab/featured-today")
      .then((res) => setLabFeatured(res.data.setup))
      .catch(() => setLabFeatured(null));
  }, [hasLabChallenge]);

  if (!dailys || dailys.length <= 0) {
    return "";
  }

  const dailyRows = dailys.map((quest) => {
    //quest[0]
    let thing = Object.entries(DailyChallengeData).filter(
      (DailyChallenge) => quest[0] == DailyChallenge[1].ID
    );
    const isLabSetup = thing[0][1].internal?.includes("PlayLabSetup");
    const labSetupName =
      isLabSetup && labFeatured && labFeatured._id === quest[2]
        ? labFeatured.name
        : null;
    const displayValue = isLabSetup ? labSetupName || "a featured Lab setup" : quest[2];
    let name = thing[0][0].replace(`ExtraData`, displayValue);
    let description = thing[0][1].description.replace(`ExtraData`, displayValue);
    let reward = thing[0][1].reward;
    let isRole = thing[0][1].extraData == "Role Name";

    return (
      <Box
        sx={{
          pt: 0.5,
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
          }}
        >
          <Typography fontWeight="bold">{name}</Typography>
          {isRole && (
            <Box
              sx={{
                ml: 0.5,
              }}
            >
              <RoleCount
                key={0}
                scheme="vivid"
                role={quest[2]}
                gameType={"Mafia"}
              />
            </Box>
          )}
          <Typography
            sx={{
              ml: "auto",
            }}
          >
            {reward}
          </Typography>
          <img
            className="um-coin"
            src={umcoin}
            alt="Coin Icon"
            style={{
              width: "20px",
              height: "20px",
              marginLeft: "4px",
            }}
          />
        </Stack>
        <Typography> {description}</Typography>
      </Box>
    );
  });

  return (
    <LobbySidebarPanel title="Daily Challenges">
      <Stack
        spacing={1}
        divider={<Divider orientation="horizontal" flexItem />}
      >
        {dailyRows}
      </Stack>
    </LobbySidebarPanel>
  );
};
