import React, { lazy, useState, useContext, useEffect, Suspense } from "react";
import { Route, Link, Navigate, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import axios from "axios";
import { Icon } from "@iconify/react";
import { ThemeProvider, CssBaseline, createTheme, AppBar, Link as MuiLink, Toolbar } from "@mui/material";

import {
  UserContext,
  SiteInfoContext,
  SiteInfoProvider,
  UserProvider,
} from "./Contexts";
import { getSiteTheme } from "./constants/themes";
import { AlertList, useErrorAlert } from "./components/Alerts";
import { Nav } from "./components/Nav";
import UserNavSection from "./pages/User/UserNavSection";
import CookieBanner from "./components/CookieBanner";
import NavDropdown from "./components/NavDropdown";
import { Loading } from "./components/Loading";
import "css/main.css";

// Navigation icons removed - now using text-only navigation
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  AlertTitle,
} from "@mui/material";

import { Announcement } from "./components/alerts/Announcement";
import SiteLogo from "./components/SiteLogo";
import { useIsPhoneDevice } from "./hooks/useIsPhoneDevice";
import { useSnowstorm } from "./hooks/useSnowstorm";
import { GuestAuthButtons } from "./components/GuestAuthButtons";

import spiderweb from "images/holiday/spiderweb.gif";

// Component to handle snowstorm with user settings
function SnowstormController() {
  const user = useContext(UserContext);
  const disableSnowstorm = user?.settings?.disableSnowstorm || false;
  useSnowstorm(disableSnowstorm);
  return null;
}

function ErrorBox({ error, resetErrorBoundary }) {
  const location = useLocation();
  const [errorLocation, setErrorLocation] = useState(location.pathname);

  useEffect(() => {
    console.error(error);
  }, []);

  useEffect(() => {
    if (location.pathname !== errorLocation) {
      resetErrorBoundary();
    }
  }, [location.pathname]);

  return (
    <Paper
      sx={{
        mx: "auto",
        my: "10%",
        p: 1,
        width: "320px",
      }}
    >
      <Stack direction="column" spacing={1}>
        <Typography variant="h3">Error:</Typography>
        <Typography color="red" sx={{ wordBreak: "break-word" }}>
          {error.message}
        </Typography>
        <Button onClick={resetErrorBoundary}>Refresh</Button>
      </Stack>
    </Paper>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  const errorBox = (
    <ErrorBox error={error} resetErrorBoundary={resetErrorBoundary} />
  );
  return <Main errorContent={errorBox} />;
}

function ErrorFallbackNoMain({ error, resetErrorBoundary }) {
  return <ErrorBox error={error} resetErrorBoundary={resetErrorBoundary} />;
}

function Main(props) {
  const errorContent = props.errorContent;

  const [isUserLoading, setUserLoading] = useState(true);
  const [siteTheme, setSiteTheme] = useState(getSiteTheme());
  const [customPrimaryColor, setCustomPrimaryColor] = useState(null);
  const [isSiteInfoLoading, setSiteInfoLoading] = useState(true);
  const [showAnnouncementTemporarily, setShowAnnouncementTemporarily] =
    useState(false);

  useEffect(() => {
    setSiteTheme(getSiteTheme(customPrimaryColor));
  }, [customPrimaryColor]);

  const isPhoneDevice = useIsPhoneDevice();

  const loading = isUserLoading || isSiteInfoLoading;

  const Game = lazy(() => import("pages/Game/Game"));
  const Play = lazy(() => import("pages/Play/Play"));
  const Community = lazy(() => import("pages/Community/Community"));
  const Fame = lazy(() => import("pages/Fame/Fame"));
  const Learn = lazy(() => import("pages/Learn/Learn"));
  const Policy = lazy(() => import("pages/Policy/Policy"));
  const User = lazy(() => import("pages/User/User"));
  const Welcome = lazy(() => import("pages/Welcome/Welcome"));

  const siteContent = (
    <Stack sx={{
      backgroundColor: "background.paper",
      minHeight: "100vh",
    }}>
      <CookieBanner />
      <Header
        setShowAnnouncementTemporarily={setShowAnnouncementTemporarily}
      />
      <Stack direction="row" className="site-wrapper" sx={{
        flex: "1",
        justifyContent: "center",
      }}>
        <Stack direction="column" spacing={1} sx={{
          margin: "0 auto",
          px: isPhoneDevice ? 1 : 3,
          py: 1,
          width: "1080px",
          maxWidth: "100%",
        }}>
          <Announcement
            showAnnouncementTemporarily={showAnnouncementTemporarily}
            setShowAnnouncementTemporarily={setShowAnnouncementTemporarily}
          />
          <div className="inner-container">
            {errorContent ? (
              errorContent
            ) : (
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="welcome" element={<Welcome />} />
                  <Route path="play/*" element={<Play />} />
                  <Route path="community/*" element={<Community />} />
                  <Route path="fame/*" element={<Fame />} />
                  <Route path="learn/*" element={<Learn />} />
                  <Route path="policy/*" element={<Policy />} />
                  <Route path="user/*" element={<User />} />
                  <Route path="*" element={<Navigate to="play" />} />
                </Routes>
              </Suspense>
            )}
          </div>
          <InGameWarning />
          <AlertList />
        </Stack>
      </Stack>
      <Footer />
    </Stack>
  );

  // Site content will display instead of game if content is being overriden by the error boundary
  const gameContent = errorContent ? (
    siteContent
  ) : (
    <Suspense fallback={<Loading />}>
      <Game />
      <AlertList />
    </Suspense>
  );

  const mainContent = (
    <SiteInfoProvider setSiteInfoLoading={setSiteInfoLoading}>
      {loading && <Loading />}
      {!loading && (
        <Routes>
          <Route path="/game/:gameId/*" element={gameContent} />
          <Route path="/*" element={siteContent} />
        </Routes>
      )}
    </SiteInfoProvider>
  );

  return (
    <ThemeProvider theme={siteTheme} noSsr defaultMode="dark">
      <CssBaseline enableColorScheme />
      <Suspense fallback={<Loading />}>
        <ErrorBoundary
          FallbackComponent={
            errorContent !== undefined ? ErrorFallbackNoMain : ErrorFallback
          }
          onReset={() =>
            (window.location.href =
              window.location.origin + window.location.pathname)
          }
        >
          <UserProvider
            setUserLoading={setUserLoading}
            setCustomPrimaryColor={setCustomPrimaryColor}
          >
            <SnowstormController />
            <Routes>
              <Route path="/" element={<Navigate to="/welcome" />} />
              <Route path="/*" element={mainContent} />
            </Routes>
          </UserProvider>
        </ErrorBoundary>
      </Suspense>
    </ThemeProvider>
  );
}

function Header({ setShowAnnouncementTemporarily }) {
  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();
  const location = useLocation();
  const isOnWelcomePage = location.pathname === "/welcome" || location.pathname === "/";

  const openAnnouncements = () => {
    setShowAnnouncementTemporarily(true);
  };

  return (
    <AppBar position="sticky" sx={{
      backgroundColor: "background.paper",
      color: "text.primary",
    }}>
      {new Date().getMonth() === 9 && (
        <img
          src={spiderweb}
          alt="Holiday Spider"
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            zIndex: 1000,
            width: "10%",
            aspectRatio: "1",
            display: isPhoneDevice ? "none" : "block",
          }}
        />
      )}

      {/* Mobile AppBar */}
      {isPhoneDevice && (
        <Stack direction="row" sx={{
          alignItems: "center",
          width: "100%",
          px: 1,
          py: 0.5,
          overflow: "hidden",
        }}>
          {/* Unified mobile menu */}
          <NavDropdown
            isMobileMenu={true}
            groups={[
              {
                label: "Play",
                items: [
                  { text: "Play", path: "/play" },
                  {
                    text: "Host",
                    path: "/play/host",
                    hide: !user.loggedIn,
                  },
                  {
                    text: "Create Setup",
                    path: "/play/create",
                    hide: !user.loggedIn,
                  },
                  {
                    text: "Decks",
                    path: "/play/decks",
                    hide: !user.loggedIn,
                  },
                ],
              },
              {
                label: "Community",
                items: [
                  { text: "Forums", path: "/community/forums" },
                  { text: "Users", path: "/community/users" },
                  { text: "Moderation", path: "/community/moderation" },
                  { text: "Calendar", path: "/community/calendar" },
                  {
                    text: "Reports",
                    path: "/community/reports",
                    hide: !user.perms.seeModPanel,
                  },
                ],
              },
              {
                label: "Fame",
                items: [
                  { text: "Competitive", path: "/fame/competitive" },
                  { text: "Contributors", path: "/fame/contributors" },
                  { text: "Donors", path: "/fame/donors" },
                ],
              },
              {
                label: "Learn",
                items: [
                  { text: "Games", path: "/learn/games" },
                  { text: "Terminology", path: "/learn/terminology" },
                  { text: "Achievements", path: "/learn/achievements" },
                ],
              },
              {
                label: "Policy",
                items: [
                  { text: "Rules", path: "/policy/rules" },
                  { text: "Terms of Service", path: "/policy/tos" },
                  { text: "Privacy Policy", path: "/policy/privacy" },
                ],
              },
            ]}
          />
          <SiteLogo small />
          {/* User section */}
          <div style={{ flex: "1 0" }}>
            {user.loggedIn ? (
              <UserNavSection
                openAnnouncements={openAnnouncements}
                user={user}
                useUnreadNotifications={useUnreadNotifications}
              />
            ) : (
              !isOnWelcomePage && <GuestAuthButtons />
            )}
          </div>
        </Stack>
      )}

      {/* Desktop AppBar */}
      {!isPhoneDevice && (
        <Stack direction="row" spacing={2} sx={{
          alignItems: "center",
          px: 1,
          py: 0.5,
        }}>
          <SiteLogo />
          <Stack direction="row" spacing={2} className="nav" sx={{
            flexGrow: "1",
            alignItems: "center",
            width: "100%",
          }}>
            <NavDropdown
              label="Play"
              items={[
                { text: "Play", path: "/play" },
                { text: "Host", path: "/play/host", hide: !user.loggedIn },
                {
                  text: "Create Setup",
                  path: "/play/create",
                  hide: !user.loggedIn,
                },
                { text: "Decks", path: "/play/decks", hide: !user.loggedIn },
              ]}
            />
            <NavDropdown
              label="Community"
              items={[
                { text: "Forums", path: "/community/forums" },
                { text: "Users", path: "/community/users" },
                { text: "Moderation", path: "/community/moderation" },
                { text: "Calendar", path: "/community/calendar" },
                {
                  text: "Reports",
                  path: "/community/reports",
                  hide: !user.perms.seeModPanel,
                },
              ]}
            />
            <NavDropdown
              label="Fame"
              items={[
                { text: "Competitive", path: "/fame/competitive" },
                { text: "Contributors", path: "/fame/contributors" },
                { text: "Donors", path: "/fame/donors" },
              ]}
            />
            <NavDropdown
              label="Learn"
              items={[
                { text: "Games", path: "/learn/games" },
                { text: "Terminology", path: "/learn/terminology" },
                { text: "Achievements", path: "/learn/achievements" },
              ]}
            />
            <NavDropdown
              label="Policy"
              items={[
                { text: "Rules", path: "/policy/rules" },
                { text: "Terms of Service", path: "/policy/tos" },
                { text: "Privacy Policy", path: "/policy/privacy" },
              ]}
            />
            <Box sx={{
              marginLeft: "auto !important",
            }}>
              {user.loggedIn ? (
                <UserNavSection
                  openAnnouncements={openAnnouncements}
                  user={user}
                  useUnreadNotifications={useUnreadNotifications}
                />
              ) : (
                !isOnWelcomePage && <GuestAuthButtons />
              )}
            </Box>
          </Stack>
        </Stack>
      )}
    </AppBar>
  );
}

function InGameWarning() {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  function onGameLeave() {
    axios
      .post("/api/game/leave")
      .then(() => {
        user.setInGame(null);
      })
      .catch(errorAlert);
  }

  return (
    <Snackbar open={user.inGame !== null}>
      <Alert
        severity="warning"
        variant="outlined"
        sx={{
          width: "100%",
          backgroundColor: "background.paper",
        }}
        slotProps={{
          message: {
            sx: {
              flex: "1",
            },
          },
        }}
      >
        <AlertTitle>You are in a game in progress.</AlertTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button href={`/game/${user.inGame}`} size="small" sx={{ flex: "1" }}>
            Return
          </Button>
          <Button onClick={() => onGameLeave()} size="small" sx={{ flex: "1" }}>
            Leave
          </Button>
        </Stack>
      </Alert>
    </Snackbar>
  );
}

// Custom hook to get unread notification count
function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextRestart, setNextRestart] = useState();
  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    getNotifs();
    var notifGetInterval = setInterval(() => getNotifs(), 10 * 1000);
    return () => clearInterval(notifGetInterval);
  }, []);

  useEffect(() => {
    if (nextRestart && nextRestart > Date.now()) {
      var restartMinutes = Math.ceil((nextRestart - Date.now()) / 1000 / 60);
      siteInfo.showAlert(
        `The server will be restarting in ${restartMinutes} minutes.`,
        "basic",
        true
      );
    }
  }, [nextRestart]);

  function getNotifs() {
    axios
      .get("/api/notifs")
      .then((res) => {
        var nextRestart = res.data[0];
        var notifs = res.data.slice(1);

        setNextRestart(nextRestart);
        setUnreadCount(notifs.length);
      })
      .catch(() => {});
  }

  return unreadCount;
}

function Footer() {
  const isPhoneDevice = useIsPhoneDevice();
  let year = new Date().getYear() + 1900;

  return (
    <AppBar position="static" sx={{
      backgroundColor: "background.paper",
      color: "text.primary",
    }}>
      <Stack direction="column" spacing={2} sx={{
        p: 2,
        alignItems: "center",
        textAlign: "center",
        "& a": {
          textDecoration: "none",
        },
      }}>
        <Stack direction="row" spacing={2} sx={{
          fontSize: "xx-large",
        }}>
          <MuiLink
            href="https://github.com/UltiMafia/Ultimafia"
            rel="noopener noreferrer nofollow"
            sx={{ display: "flex", }}
          >
            <i className="fab fa-github" />
          </MuiLink>
          <MuiLink
            href="https://www.patreon.com/"
            rel="noopener noreferrer nofollow"
            sx={{ display: "flex", }}
          >
            <i className="fab fa-patreon" />
          </MuiLink>
          <MuiLink
            href="https://ko-fi.com/ultimafia"
            rel="noopener noreferrer nofollow"
            sx={{ display: "flex", }}
          >
            <Icon icon="simple-icons:kofi" />
          </MuiLink>
          <MuiLink
            href="https://discord.gg/C5WMFpYRHQ"
            target="blank"
            rel="noopener noreferrer nofollow"
            sx={{ display: "flex", }}
          >
            <Icon
              icon="simple-icons:discord"
              style={{ color: "#5865F2" }}
            />
          </MuiLink>
        </Stack>
        <Stack direction={isPhoneDevice ? "column" : "row"} spacing={isPhoneDevice ? 0.5 : 2} sx={{
        }}>
          <Typography variant="body2">
            © {year} UltiMafia
          </Typography>
          <MuiLink
            variant="body2"
            href="https://github.com/r3ndd/BeyondMafia-Integration"
            rel="noopener noreferrer nofollow"
          >
            {"Built on code provided by rend"}
          </MuiLink>
          <MuiLink
            variant="body2"
            target="_blank"
            href="https://www.youtube.com/@fredthemontymole"
            rel="noopener noreferrer nofollow"
          >
            <i className="fab fa-youtube"></i> Featuring music by FredTheMole
          </MuiLink>
          <MuiLink
            variant="body2"
            target="_blank"
            href="https://ultimafia.com/user/2oDrE3Ueq"
          >
            Additional music by Jumpy
          </MuiLink>
        </Stack>
      </Stack>
    </AppBar>
  );
}

export default Main;
