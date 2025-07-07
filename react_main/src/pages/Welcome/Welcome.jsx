import React, { useEffect, useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import "css/main.css";
import "./Welcome.css";
import { RegisterDialog } from "./RegisterDialog";
import { LoginDialog } from "./LoginDialog";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "lib/firebaseConfig";
import { Scenario2 } from "./Scenario2";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  inMemoryPersistence,
} from "firebase/auth";
import axios from "axios";
import { useSnackbar } from "hooks/useSnackbar";
import { NewLoading } from "./NewLoading";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import umpride2 from "images/holiday/umpride2.png";
import logobloody from "images/holiday/logobloody.png";
import fadelogohat from "images/fadelogohat.png";

// localStorage.setItem('firebase:debug', 'true');

if (localStorage.getItem("firebase:debug") !== null) {
  localStorage.removeItem("firebase:debug");
}
if (localStorage.getItem("showChatTab") !== null) {
  localStorage.removeItem("showChatTab");
}

export const Welcome = () => {
  const [isLoading, setIsLoading] = useState(true);
  const isPhoneDevice = useIsPhoneDevice();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const snackbarHook = useSnackbar();
  const getLogoSrc = () => {
    const currentMonth = new Date().getMonth();
    // 0 = January
    // 11 = December

    // Pride logo for June
    if (currentMonth === 5) {
      return umpride2;
    }

    // Bloody logo for Halloween
    if (currentMonth === 9) {
      return logobloody;
    }

    // Default logo
    return fadelogohat;
  };

  useEffect(() => {
    document.body.style.backgroundImage = `none`;
    initializeApp(firebaseConfig);
    const auth = getAuth();
    auth.setPersistence(inMemoryPersistence);

    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = await auth.currentUser.getIdToken(true);
        axios
          .post("/auth", { idToken })
          .then(() => {
            window.location.reload();
          })
          .catch((err) => {
            console.log(err);
            snackbarHook.popUnexpectedError();
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });
    return () => {
      document.body.style.backgroundImage = `var(--backgroundImageURL)`;
    };
  }, []);
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
      <style>{"body, html { background: #FFF !important; }"}</style>
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

  if (isLoading) {
    return <NewLoading />;
  }

  return (
    <>
      <Box
        sx={{
          bgcolor: "background.paper",
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
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
              boxSizing: "border-box",
            }}
          >
            <Box
              component="img"
              sx={{
                height: 144,
                width: 247,
                ml: "auto",
                mr: "auto",
              }}
              alt="Site logo"
              src={getLogoSrc()}
            />
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
              Mafia, played by millions, is a captivating party game that forges
              friendships and sharpens cognitive skills.
            </Typography>
            <Box align="center" className="role-icon-scheme-vivid">
              <div
                //Default icon--uncomment this on July 1
                className="role role-icon-vivid-Mafia-Cop small"
                //Pride icon--comment this on July 1
                //className="role role-redmafiac small"
                style={{ display: "inline-block" }}
              />
              <div
                //Default icon--uncomment this on July 1
                className="role role-icon-vivid-Mafia-Doctor small"
                //Pride icon--comment this on July 1
                //className="role role-yellowmafiac small"
                style={{ display: "inline-block" }}
              />
              <div
                //Default icon--uncomment this on July 1
                className="role role-icon-vivid-Mafia-Villager small"
                //Pride icon--comment this on July 1
                //className="role role-greenmafiac small"
                style={{ display: "inline-block" }}
              />
              <div
                //Default icon--uncomment this on July 1
                className="role role-icon-vivid-Mafia-Mafioso small"
                //Pride icon--comment this on July 1
                //className="role role-bluemafiac small"
                style={{ display: "inline-block" }}
              />
              <div
                //Default icon--uncomment this on July 1
                className="role role-icon-vivid-Mafia-Hooker small"
                //Pride icon--comment this on July 1
                //className="role role-purplemafiac small"
                style={{ display: "inline-block" }}
              />
              <div
              //Extra div for Pride; comment on July 1
              //className="role role-pinkmafiac small"
              //style={{ display: "inline-block" }}
              />
            </Box>
            <Box className="demoGame">
              <Scenario2 dialogOpen={registerDialogOpen || loginDialogOpen} />
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
          </Container>
        </Box>
      </Box>
      <RegisterDialog
        open={registerDialogOpen}
        setOpen={setRegisterDialogOpen}
      />
      <LoginDialog open={loginDialogOpen} setOpen={setLoginDialogOpen} />
    </>
  );
};
