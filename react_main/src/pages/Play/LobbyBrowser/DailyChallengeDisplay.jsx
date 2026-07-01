import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { UserContext } from "Contexts";
import { DailyChallengeData } from "constants/DailyChallenge";
import { RoleCount } from "components/Roles";
import Setup from "components/Setup";
import LobbySidebarPanel from "./LobbySidebarPanel";

function DailyChallengeRow({ quest, challengeData, challengeName }) {
  const extraData = quest[2];
  const isRole = challengeData.extraData === "Role Name";
  const isFeatured = challengeData.extraData === "Featured Setup";
  const [featuredSetup, setFeaturedSetup] = useState(null);

  useEffect(() => {
    if (!isFeatured || !extraData) {
      return;
    }

    let cancelled = false;
    axios.get(`/api/setup/${extraData}`).then((res) => {
      if (!cancelled) {
        setFeaturedSetup(res.data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isFeatured, extraData]);

  const displayExtraData = isFeatured
    ? featuredSetup?.name || extraData
    : extraData;
  const name = challengeName.replace("ExtraData", displayExtraData);
  const description = challengeData.description.replace(
    "ExtraData",
    displayExtraData
  );
  const reward = challengeData.reward;

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
              scheme="vivid"
              role={extraData}
              gameType="Mafia"
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
        <i
          className="fas fa-heart"
          style={{ color: "#e23b3b", marginLeft: "4px", fontSize: "16px" }}
        />
      </Stack>
      <Typography>{description}</Typography>
      {isFeatured && featuredSetup && (
        <Box sx={{ mt: 0.5 }}>
          <Setup setup={featuredSetup} />
        </Box>
      )}
    </Box>
  );
}

export const DailyChallenges = () => {
  const user = useContext(UserContext);

  const dailys = user.dailyChallenges?.map((m) => m.split(":"));

  if (!dailys || dailys.length <= 0) {
    return "";
  }

  const dailyRows = dailys.map((quest) => {
    const thing = Object.entries(DailyChallengeData).find(
      ([, data]) => quest[0] == data.ID
    );
    if (!thing) return null;

    const [challengeName, challengeData] = thing;

    return (
      <DailyChallengeRow
        key={quest.join(":")}
        quest={quest}
        challengeData={challengeData}
        challengeName={challengeName}
      />
    );
  });

  return (
    <LobbySidebarPanel title="Daily Challenges">
      <Stack
        spacing={1}
        divider={<Divider orientation="horizontal" flexItem />}
      >
        {dailyRows.filter(Boolean)}
      </Stack>
    </LobbySidebarPanel>
  );
};
