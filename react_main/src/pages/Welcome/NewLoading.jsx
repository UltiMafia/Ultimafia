import React from "react";
import ReactLoading from "react-loading";
import { welcomeTheme } from "./welcomeTheme";
import { Box, ThemeProvider } from "@mui/material";
import "./Welcome.css";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";

export const NewLoading = ({ small }) => {
  const isPhoneDevice = useIsPhoneDevice();

  return (
    <ThemeProvider theme={welcomeTheme}>
      <Box
        sx={{
          bgcolor: "background.paper",
          height: !small ? "100vh" : !isPhoneDevice ? "300px" : "100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ReactLoading type="bars" color={welcomeTheme.palette.primary.main} />
      </Box>
    </ThemeProvider>
  );
};
