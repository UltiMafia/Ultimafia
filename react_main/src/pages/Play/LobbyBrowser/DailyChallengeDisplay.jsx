import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { Redirect } from "react-router-dom";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { UserContext } from "../../../Contexts";
import { useErrorAlert } from "../../../components/Alerts";
import { useTheme } from "@mui/styles";
import { useIsPhoneDevice } from "../../../hooks/useIsPhoneDevice";
import { DailyChallengeData } from "../../../constants/DailyChallenge";

export const DailyChallenges = () => {
  const theme = useTheme();
  const svgRef = useRef();
  const [setups, setSetups] = useState([]);
  const [redirect, setRedirect] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();

   let dailys = user.dailyChallenges?.map((m) => m.split(":"));
   
  if (!dailys || dailys.length <= 0) {
    return "";
  }

  const dailyRows = dailys.map((quest) => {
   //quest[0]
   let thing = Object.entries(DailyChallengeData).filter((DailyChallenge) => quest[0] == DailyChallenge[1].ID);
  let name = thing[0][0].replace(`ExtraData`,quest[2]);
    let description = thing[0][1].description.replace(`ExtraData`,quest[2]);
    return (
          <div className="setup-row-info">
            <div className="title">{name}-</div>
            <div className="content">{description}</div>
            </div>
    );
  });

  return (
    <Paper>
      <Box sx={{ p: 2 }}>
        <Typography color="primary" gutterBottom>
          Daily Challenges
        </Typography>
        <Stack spacing={1}>
          {dailyRows}
        </Stack>
      </Box>
    </Paper>
  );
};
