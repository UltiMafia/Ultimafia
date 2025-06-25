import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { Redirect } from "react-router-dom";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { UserContext } from "../../../Contexts";
import { useErrorAlert } from "../../../components/Alerts";
import { getRecentlyPlayedSetups } from "../../../services/gameService";
import { getDefaults } from "../Host/HostDefaults";
import Setup from "../../../components/Setup";
import { getRecentlyPlayedSetupsChart } from "./getRecentlyPlayedSetupsChart";
import { useTheme } from "@mui/styles";
import { useIsPhoneDevice } from "../../../hooks/useIsPhoneDevice";

export const DailyChallenges = () => {
  const theme = useTheme();
  const svgRef = useRef();
  const [setups, setSetups] = useState([]);
  const [redirect, setRedirect] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();

   let dailys = user.DailyChallenges?.map((m) => m.split(","));
   if(dailys){
    dailys = dailys;
   }
   else{
    dailys = [];
   }
  if (!dailys?.length) {
    return "";
  }

  const dailyRows = dailys.map((quest) => {
   //quest[0]
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
    <div className="setup-row-info">
      <div className="title">{quest[0]}</div>
      <div className="content">{quest[1]}</div>
    </div>
      </Box>
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
        <Box sx={{ mt: 2 }}>
          <svg ref={svgRef} />
        </Box>
      </Box>
    </Paper>
  );
};
