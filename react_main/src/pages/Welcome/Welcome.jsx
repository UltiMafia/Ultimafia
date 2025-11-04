import React, { useContext, useEffect, useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import "css/main.css";
import "./Welcome.css";
import { RegisterDialog } from "./RegisterDialog";
import { LoginDialog } from "./LoginDialog";
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
import SiteLogo from "../../components/SiteLogo";
import { UserContext } from "Contexts";

// localStorage.setItem('firebase:debug', 'true');

if (localStorage.getItem("firebase:debug") !== null) {
  localStorage.removeItem("firebase:debug");
}
if (localStorage.getItem("showChatTab") !== null) {
  localStorage.removeItem("showChatTab");
}

export const Welcome = () => {
  const user = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const isPhoneDevice = useIsPhoneDevice();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const snackbarHook = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.backgroundImage = `none`;
    const auth = getAuth();
    auth.setPersistence(inMemoryPersistence);

    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = await auth.currentUser.getIdToken(true);
        axios
          .post("/api/auth", { idToken })
          .then(() => {
            window.location.reload();
          })
          .catch((err) => {
            console.log(err);

            // Check if this is a site-ban error
            if (err?.response?.status === 403 && err?.response?.data) {
              try {
                const data =
                  typeof err.response.data === "string"
                    ? JSON.parse(err.response.data)
                    : err.response.data;
                if (data.siteBanned) {
                  snackbarHook.popSiteBanned(data.banExpires);
                  setIsLoading(false);
                  return;
                }
              } catch (parseErr) {
                // Not a site-ban error, continue with regular error handling
              }
            }

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
  const proceedAsGuest = () => navigate("/play");

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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
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
          <Button
            variant="text"
            sx={{
              textTransform: "none",
              fontSize: "16px",
              width: "100%",
              color: "text.secondary",
            }}
            onClick={proceedAsGuest}
          >
            Proceed as Guest
          </Button>
        </Box>
      </div>
    </Box>
  );

  if (user && user.loggedIn) {
    return <Navigate to="/play" />;
  }

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
            <SiteLogo />
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
