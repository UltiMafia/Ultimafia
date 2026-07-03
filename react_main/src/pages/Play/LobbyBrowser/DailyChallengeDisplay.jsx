import React, { useEffect, useRef, useState, useContext } from "react";
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { UserContext } from "Contexts";
import { DailyChallengeData } from "constants/DailyChallenge";
import { RoleCount } from "components/Roles";

import umcoin from "images/umcoin.png";
import LobbySidebarPanel from "./LobbySidebarPanel";

export const DailyChallenges = () => {
  const user = useContext(UserContext);

  let dailys = user.dailyChallenges?.map((m) => m.split(":"));

  if (!dailys || dailys.length <= 0) {
    return "";
  }

  const dailyRows = dailys.map((quest) => {
    const thing = Object.entries(DailyChallengeData).find(
      ([, data]) => quest[0] == data.ID
    );
    if (!thing) return null;

    const [, challengeData] = thing;
    const name = thing[0].replace(`ExtraData`, quest[2]);
    const description = challengeData.description.replace(
      `ExtraData`,
      quest[2]
    );
    const reward = challengeData.reward;
    const isRole = challengeData.extraData == "Role Name";

    return (
      <Box
        key={quest.join(":")}
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
        {dailyRows.filter(Boolean)}
      </Stack>
    </LobbySidebarPanel>
  );
};
