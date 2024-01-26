import React from "react";
import ReactLoading from "react-loading";
import { welcomeTheme } from "./welcomeTheme";
import { Box, ThemeProvider } from "@mui/material";
import "./Welcome.css";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";

export const NewLoading = ({ small, extraSmall }) => {
  const isPhoneDevice = useIsPhoneDevice();

  const extraSmallWidth = 24; // 16
  const extraSmallHeight = 32; // 8

  let height;
  if (extraSmall) {
    height = `${extraSmallWidth}px`;
  } else if (small) {
    if (isPhoneDevice) height = "100px";
    else height = "300px";
  } else height = "100vh";

  return (
    <ThemeProvider theme={welcomeTheme}>
      <Box
        sx={{
          bgcolor: "background.paper",
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ReactLoading
          type="bars"
          color={welcomeTheme.palette.primary.main}
          width={extraSmall ? extraSmallWidth : undefined}
          height={extraSmall ? extraSmallHeight : undefined}
        />
      </Box>
    </ThemeProvider>
  );
};
