import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  createTheme,
  ThemeProvider,
  Typography,
  useMediaQuery,
} from "@mui/material";
import "../../css/main.css";
import "./Welcome.css";
import { RegisterDialog } from "./RegisterDialog";
import { LoginDialog } from "./LoginDialog";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../../lib/firebaseConfig";
import { Scenario2 } from "./Scenario2";

const welcomeTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#B80C09",
    },
  },
  typography: {
    fontFamily: ["RobotoSlab"].join(","),
  },
});
export const Welcome = () => {
  const isPhoneDevice = useMediaQuery("(max-width:700px)");
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  initializeApp(firebaseConfig);
  const openLoginDialog = () => setLoginDialogOpen(true);
  const openRegisterDialog = () => setRegisterDialogOpen(true);

  const paddingX = isPhoneDevice ? 1 : 4;
  const CTAbuttons = (
    <Box
      textAlign="center"
      sx={{
        display: "flex",
        justifyContent: "center",
        mb: 1,
      }}
    >
      <div style={{ width: "250px" }}>
        {/*<Button*/}
        {/*  variant="contained"*/}
        {/*  sx={{*/}
        {/*    textTransform: "none",*/}
        {/*    fontSize: "24px",*/}
        {/*    width: "100%",*/}
        {/*    ...(isPhoneDevice ? { flex: 0 } : {}),*/}
        {/*  }}*/}
        {/*>*/}
        {/*  I want to play!*/}
        {/*</Button>*/}
        <Box sx={{ mt: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              sx={{
                textTransform: "none",
                fontSize: "16px",
                minWidth: "120px",
                ...(isPhoneDevice ? { flex: 0 } : {}),
              }}
              onClick={openLoginDialog}
            >
              Login
            </Button>

            <Button
              // variant="outlined"
              variant="contained"
              sx={{
                textTransform: "none",
                fontSize: "16px",
                minWidth: "120px",
                ...(isPhoneDevice ? { flex: 0 /*width: "100%"*/ } : {}),
              }}
              onClick={openRegisterDialog}
            >
              Register
            </Button>
          </div>
        </Box>
      </div>
    </Box>
  );

  return (
    <>
      <ThemeProvider theme={welcomeTheme}>
        <Box
          sx={{
            bgcolor: "background.paper",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              bgcolor: "background.paper",
              pt: isPhoneDevice ? 4 : 8,
              pb: isPhoneDevice ? 0 : 2,
              display: "flex",
              flex: 1,
            }}
          >
            <Container
              maxWidth="md"
              sx={{
                paddingLeft: paddingX,
                paddingRight: paddingX,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                variant={isPhoneDevice ? "h3" : "h1"}
                align="center"
                color="text.primary"
                gutterBottom
              >
                Ultimate Mafia
              </Typography>
              <Typography
                variant={isPhoneDevice ? "body1" : "h4"}
                align="center"
                color="text.secondary"
                paragraph
              >
                The classic social deduction game, online.
              </Typography>
              <Typography
                variant={isPhoneDevice ? "body2" : "body1"}
                align="center"
                color="text.secondary"
                paragraph
                sx={{ pt: 0 }}
              >
                Mafia, played by millions, is a captivating party game that
                forges friendships and sharpens cognitive skills.
              </Typography>
              <Box align="center" className="role-icon-scheme-vivid">
                <div
                  className="role role-Mafia-Cop small"
                  style={{ display: "inline-block" }}
                />
                <div
                  className="role role-Mafia-Gunsmith small"
                  style={{ display: "inline-block" }}
                />
                <div
                  className="role role-Mafia-Villager small"
                  style={{ display: "inline-block" }}
                />
                <div
                  className="role role-Mafia-Hooker small"
                  style={{ display: "inline-block" }}
                />
                <div
                  className="role role-Mafia-Mafioso small"
                  style={{ display: "inline-block" }}
                />
              </Box>
              <Box className="demoGame">
                <Scenario2 />
              </Box>
            </Container>
          </Box>

          <Box
            sx={{
              bgcolor: "background.paper",
              p: 6,
              pb: isPhoneDevice ? 2 : 6,
              pt: 0,
              flex: 0,
            }}
          >
            {CTAbuttons}
          </Box>
        </Box>
        <RegisterDialog
          open={registerDialogOpen}
          setOpen={setRegisterDialogOpen}
        />
        <LoginDialog open={loginDialogOpen} setOpen={setLoginDialogOpen} />
      </ThemeProvider>
    </>
  );
};
