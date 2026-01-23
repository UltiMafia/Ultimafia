import React, { useContext, useEffect, useState } from "react";
import { Box, Button, Container, Stack, Typography, Paper, Grid2 } from "@mui/material";
import { Navigate } from "react-router-dom";
import "css/main.css";
import { Auth } from "../../components/Auth";
import IconGallery from "../../components/IconGallery";
import bannerImage from "../../images/welcome_page/banner.png";
import welcomeImage1 from "../../images/welcome_page/welcome-page_1.png";
import welcomeImage2 from "../../images/welcome_page/welcome-page_2.png";
import welcomeImage3 from "../../images/welcome_page/welcome-page_3.png";
import welcomeImage4 from "../../images/welcome_page/welcome-page_4.png";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  inMemoryPersistence,
} from "firebase/auth";
import axios from "axios";
import { useSnackbar } from "hooks/useSnackbar";
import { Loading } from "../../components/Loading";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
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
  const snackbarHook = useSnackbar();

  useEffect(() => {
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
                if (data.deleted) {
                  snackbarHook.popUserDeleted();
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
  }, []);

  const paddingX = isPhoneDevice ? 1 : 4;

  if (user && user.loggedIn) {
    return <Navigate to="/play" />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Container
        maxWidth="md"
        sx={{
          paddingLeft: paddingX,
          paddingRight: paddingX,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          pt: isPhoneDevice ? 2 : 3,
          pb: isPhoneDevice ? 4 : 8,
        }}
      >
        <Typography
          variant={isPhoneDevice ? "body1" : "h4"}
          align="center"
          color="text.secondary"
          paragraph
          sx={{ mb: 3 }}
        >
          The classic social deduction game, <span style={{ color: "primary.main" }}>online.</span>
        </Typography>
        <Grid2 container rowSpacing={1} columnSpacing={1}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                height: isPhoneDevice ? "400px" : "500px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Auth defaultTab={0} />
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: isPhoneDevice ? "200px" : "300px",
              }}
            >
              <Box
                component="img"
                src={bannerImage}
                alt="Info on Mafia as a game AND our site"
                sx={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  mb: 2,
                }}
              />
              <Typography variant="body1" color="text.secondary" paragraph>
                UltiMafia is a community-built rendition of the classic social deduction game Mafia. Mafia, played by millions, is a captivating party game that forges friendships and sharpens cognitive skills. Join casual and competitive matches and build fully-customizable setups tailored to your needs.
              </Typography>
              <Box>
                <IconGallery />
              </Box>
            </Paper>
          </Grid2>
        </Grid2>

        <Grid2 container rowSpacing={1.5} columnSpacing={1.5} sx={{ mt: 4 }}>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Box
                component="img"
                src={welcomeImage1}
                alt="Welcome feature 1"
                sx={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  mb: 1.5,
                }}
              />
              <Typography variant="body2" color="text.secondary" paragraph sx={{ flex: 1 }}>
                Experience Mafia in live-chat format. No need for bots or referees. Real-time and responsive actions facilitated by the game itself.
              </Typography>
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Box
                component="img"
                src={welcomeImage2}
                alt="Welcome feature 2"
                sx={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  mb: 1.5,
                }}
              />
              <Typography variant="body2" color="text.secondary" paragraph sx={{ flex: 1 }}>
                Over 400 roles combined with countless modifiers and items allowing you to tailor your setups to any playstyle.
              </Typography>
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Box
                component="img"
                src={welcomeImage3}
                alt="Welcome feature 3"
                sx={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  mb: 1.5,
                }}
              />
              <Typography variant="body2" color="text.secondary" paragraph sx={{ flex: 1 }}>
                Compete and hone your skills of deception and deduction in seasonal play. Join the community in off-season events as well.
              </Typography>
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Box
                component="img"
                src={welcomeImage4}
                alt="Welcome feature 4"
                sx={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  mb: 1.5,
                }}
              />
              <Typography variant="body2" color="text.secondary" paragraph sx={{ flex: 1 }}>
                Take a break from Mafia and play all manner of card, dice, and word games.
              </Typography>
            </Paper>
          </Grid2>
        </Grid2>
      </Container>
    </>
  );
};

export default Welcome;
