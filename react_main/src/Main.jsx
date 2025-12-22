import React, { lazy, useState, useContext, useEffect, Suspense } from "react";
import { Route, Link, Navigate, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import axios from "axios";
import { Icon } from "@iconify/react";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

import {
  UserContext,
  SiteInfoContext,
  SiteInfoProvider,
  UserProvider,
} from "./Contexts";
import { getSiteTheme } from "./constants/themes";
import { AlertList, useErrorAlert } from "./components/Alerts";
import { Nav } from "./components/Nav";
import { Welcome } from "./pages/Welcome/Welcome";
import UserNavSection from "./pages/User/UserNavSection";
import { GuestAuthButtons } from "./components/GuestAuthButtons";
import CookieBanner from "./components/CookieBanner";
import NavDropdown from "./components/NavDropdown";

import "css/main.css";
import { NewLoading } from "./pages/Welcome/NewLoading";

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

  const siteContent = (
    <Box
      className="site-wrapper"
      sx={{
        backgroundColor: "background.paper",
      }}
    >
      <CookieBanner />
      <Stack
        direction="column"
        spacing={1}
        sx={{
          flexWrap: "nowrap",
          px: isPhoneDevice ? 1 : 3,
          width: "1080px",
          maxWidth: "100%",
        }}
      >
        <Header
          setShowAnnouncementTemporarily={setShowAnnouncementTemporarily}
        />
        <Announcement
          showAnnouncementTemporarily={showAnnouncementTemporarily}
          setShowAnnouncementTemporarily={setShowAnnouncementTemporarily}
        />
        <div className="inner-container">
          {errorContent ? (
            errorContent
          ) : (
            <Suspense fallback={<NewLoading />}>
              <Routes>
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
        <Footer />
        <AlertList />
      </Stack>
    </Box>
  );

  // Site content will display instead of game if content is being overriden by the error boundary
  const gameContent = errorContent ? (
    siteContent
  ) : (
    <Suspense fallback={<NewLoading />}>
      <Game />
      <AlertList />
    </Suspense>
  );

  const mainContent = (
    <SiteInfoProvider setSiteInfoLoading={setSiteInfoLoading}>
      {loading && <NewLoading />}
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
      <Suspense fallback={<NewLoading />}>
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
              <Route path="/" element={<Welcome />} />
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

  const openAnnouncements = () => {
    setShowAnnouncementTemporarily(true);
  };

  return (
    <div className="header">
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
            display: window.innerWidth <= 768 ? "none" : "block",
          }}
        />
      )}

      {/* Desktop Logo - Top Center */}
      {!isPhoneDevice && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 2,
          }}
        >
          <Link to="/play">
            <SiteLogo />
          </Link>
        </Box>
      )}

      {/* Mobile Header - Icon Navigation Top, Logo Centered Below */}
      {isPhoneDevice && (
        <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
          {/* Top bar with navigation menu and user section */}
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              px: 0.5,
              py: 0.5,
              borderBottom: "1px solid var(--scheme-color-border)",
              overflow: "hidden",
            }}
          >
            {/* Unified mobile menu */}
            <Box sx={{ flexShrink: 0 }}>
              <NavDropdown
                label="Menu"
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
                      { text: "Leaderboard", path: "/fame/leaderboard" },
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
            </Box>
            {/* User section */}
            <div className="user-wrapper" style={{ flexShrink: 0 }}>
              {user.loggedIn ? (
                <UserNavSection
                  openAnnouncements={openAnnouncements}
                  user={user}
                  useUnreadNotifications={useUnreadNotifications}
                />
              ) : (
                <GuestAuthButtons />
              )}
            </div>
          </Stack>
          {/* Centered logo */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 1,
            }}
          >
            <Link to="/play">
              <SiteLogo />
            </Link>
          </Box>
        </Stack>
      )}
      {/* Desktop Navigation Bar */}
      {!isPhoneDevice && (
        <Box
          sx={{
            backgroundColor: "var(--scheme-color-background)",
            borderTop: "1px solid var(--scheme-color-border)",
            borderBottom: "1px solid var(--scheme-color-border)",
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Box
            sx={{
              maxWidth: "1080px",
              width: "100%",
            }}
          >
            <Nav>
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
                  { text: "Leaderboard", path: "/fame/leaderboard" },
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
              <div className="user-wrapper">
                {user.loggedIn ? (
                  <UserNavSection
                    openAnnouncements={openAnnouncements}
                    user={user}
                    useUnreadNotifications={useUnreadNotifications}
                  />
                ) : (
                  <GuestAuthButtons />
                )}
              </div>
            </Nav>
          </Box>
        </Box>
      )}
    </div>
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
  let year = new Date().getYear() + 1900;

  return (
    <div className="footer">
      <div className="footer-inner">
        <div
          style={{
            fontSize: "xx-large",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "8px",
          }}
        >
          <a
            href="https://github.com/UltiMafia/Ultimafia"
            style={{ display: "flex", opacity: 0.5 }}
            rel="noopener noreferrer nofollow"
          >
            <i className="fab fa-github" />
          </a>
          <a
            href="https://www.patreon.com/"
            style={{ display: "flex", opacity: 0.5 }}
            rel="noopener noreferrer nofollow"
          >
            <i className="fab fa-patreon" />
          </a>
          <a
            href="https://ko-fi.com/ultimafia"
            style={{ display: "flex", opacity: 0.5 }}
            rel="noopener noreferrer nofollow"
          >
            <Icon icon="simple-icons:kofi" />
          </a>
          <a
            href="https://discord.gg/C5WMFpYRHQ"
            target="blank"
            rel="noopener noreferrer nofollow"
          >
            <Icon
              icon="simple-icons:discord"
              style={{ color: "#5865F2", display: "flex", opacity: 1 }}
            />
          </a>
        </div>
        <div className="footer-inner" style={{ opacity: 0.5 }}>
          <span>
            Built on code provided by
            <a
              href="https://github.com/r3ndd/BeyondMafia-Integration"
              rel="noopener noreferrer nofollow"
            >
              rend
            </a>
          </span>
          <span>
            <a
              target="_blank"
              href="https://www.youtube.com/@fredthemontymole"
              rel="noopener noreferrer nofollow"
            >
              <i className="fab fa-youtube"></i> Featuring music by FredTheMole
            </a>
          </span>
          <span>
            <a target="_blank" href="https://ultimafia.com/user/2oDrE3Ueq">
              Additional music by Jumpy
            </a>
          </span>
          <div>© {year} UltiMafia</div>
        </div>
      </div>
    </div>
  );
}

export default Main;
