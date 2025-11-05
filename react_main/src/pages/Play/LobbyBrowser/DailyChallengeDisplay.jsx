import React, { useEffect, useRef, useState, useContext } from "react";
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { UserContext } from "Contexts";
import { DailyChallengeData } from "constants/DailyChallenge";
import { RoleCount } from "components/Roles";

import umcoin from "images/umcoin.png";

export const DailyChallenges = () => {
  const user = useContext(UserContext);

  let dailys = user.dailyChallenges?.map((m) => m.split(":"));

  if (!dailys || dailys.length <= 0) {
    return "";
  }

  const dailyRows = dailys.map((quest) => {
    //quest[0]
    let thing = Object.entries(DailyChallengeData).filter(
      (DailyChallenge) => quest[0] == DailyChallenge[1].ID
    );
    let name = thing[0][0].replace(`ExtraData`, quest[2]);
    let description = thing[0][1].description.replace(`ExtraData`, quest[2]);
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
    <Paper>
      <Box sx={{ p: 2 }}>
        <Typography color="primary" gutterBottom>
          Daily Challenges - No Vegs
        </Typography>
        <Divider orientation="horizontal" flexItem />
        <Stack
          spacing={1}
          divider={<Divider orientation="horizontal" flexItem />}
        >
          {dailyRows}
        </Stack>
      </Box>
    </Paper>
  );
};
