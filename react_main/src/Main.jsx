import React, {
  lazy,
  useState,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect,
  Suspense,
} from "react";
import {
  Route,
  Link,
  NavLink,
  Navigate,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import axios from "axios";
import update from "immutability-helper";
import { Icon } from "@iconify/react";

import {
  UserContext,
  SiteInfoContext,
  SiteInfoProvider,
  UserProvider,
} from "./Contexts";
import { AlertList, useErrorAlert } from "./components/Alerts";
import {
  NotificationHolder,
  useOnOutsideClick,
  Time,
} from "./components/Basic";
import { Nav } from "./components/Nav";
import { Welcome } from "./pages/Welcome/Welcome";
import UserNavSection from "./pages/User/UserNavSection";
import { GuestAuthButtons } from "./components/GuestAuthButtons";
import CookieBanner from "./components/CookieBanner";
import Chat from "./pages/Chat/Chat";
import NavDropdown from "./components/NavDropdown";

import "css/main.css";
import { useReducer } from "react";
import { NewLoading } from "./pages/Welcome/NewLoading";

// Navigation icons
import flagblueIcon from "./images/emotes/flagblue.webp";
import messageIcon from "./images/emotes/message.webp";
import medalsilverIcon from "./images/emotes/medalsilver.webp";
import loreIcon from "./images/emotes/lore.webp";
import lawIcon from "./images/emotes/law.webp";
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
import { useColorScheme } from "@mui/material/styles";

import { Announcement } from "./components/alerts/Announcement";
import SiteLogo from "./components/SiteLogo";
import { BadTextContrast } from "./components/alerts/BadTextContrast";
import { useIsPhoneDevice } from "./hooks/useIsPhoneDevice";

import spiderweb from "images/holiday/spiderweb.gif";

function ErrorBox({ error, resetErrorBoundary }) {
  console.log(error);

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
  const [isSiteInfoLoading, setSiteInfoLoading] = useState(true);
  const [showAnnouncementTemporarily, setShowAnnouncementTemporarily] =
    useState(false);

  const isPhoneDevice = useIsPhoneDevice();

  const { mode, systemMode } = useColorScheme();
  useEffect(() => {
    const colorScheme = mode === "system" ? systemMode : mode;
    document.documentElement.classList.remove("dark-mode", "light-mode");
    document.documentElement.classList.add(`${colorScheme}-mode`);
  }, [mode]);

  const loading = isUserLoading || isSiteInfoLoading;

  const style = isPhoneDevice ? { padding: "8px" } : { padding: "24px" };

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
      <div className="main-container" style={style}>
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
        {<Chat SiteNotifs={SiteNotifs} />}
      </div>
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
    <ErrorBoundary
      FallbackComponent={
        errorContent !== undefined ? ErrorFallbackNoMain : ErrorFallback
      }
      onReset={() =>
        (window.location.href =
          window.location.origin + window.location.pathname)
      }
    >
      <UserProvider setUserLoading={setUserLoading}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/*" element={mainContent} />
        </Routes>
      </UserProvider>
    </ErrorBoundary>
  );
}

function Header({ setShowAnnouncementTemporarily }) {
  const user = useContext(UserContext);

  const openAnnouncements = () => {
    setShowAnnouncementTemporarily(true);
  };

  const [smallWidth, setSmallWidth] = useState(window.innerWidth <= 700);

  const handleResize = () => {
    setSmallWidth(window.innerWidth <= 700);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
      {!smallWidth && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 2,
          }}
        >
          <Link to="/play" className="logo-wrapper">
            <SiteLogo />
          </Link>
        </Box>
      )}

      {/* Mobile Header - Icon Navigation Top, Logo Centered Below */}
      {smallWidth && (
        <Stack direction="column" sx={{ width: "100%" }}>
          {/* Top bar with navigation icons and user section */}
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              px: 1,
              py: 1,
              borderBottom: "1px solid var(--scheme-color-border)",
            }}
          >
            {/* Icon-only navigation */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <NavDropdown
                label="Play"
                icon={flagblueIcon}
                iconOnly={true}
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
                icon={messageIcon}
                iconOnly={true}
                items={[
                  { text: "Forums", path: "/community/forums" },
                  { text: "Users", path: "/community/users" },
                  { text: "Moderation", path: "/community/moderation" },
                ]}
              />
              <NavDropdown
                label="Fame"
                icon={medalsilverIcon}
                iconOnly={true}
                items={[
                  { text: "Leaderboard", path: "/fame/leaderboard" },
                  { text: "Contributors", path: "/fame/contributors" },
                  { text: "Donors", path: "/fame/donors" },
                ]}
              />
              <NavDropdown
                label="Learn"
                icon={loreIcon}
                iconOnly={true}
                items={[
                  { text: "Games", path: "/learn/games" },
                  { text: "Terminology", path: "/learn/terminology" },
                  { text: "Achievements", path: "/learn/achievements" },
                ]}
              />
              <NavDropdown
                label="Policy"
                icon={lawIcon}
                iconOnly={true}
                items={[
                  { text: "Rules", path: "/policy/rules" },
                  { text: "Terms of Service", path: "/policy/tos" },
                  { text: "Privacy Policy", path: "/policy/privacy" },
                ]}
              />
            </Stack>
            {/* User section */}
            <div className="user-wrapper">
              {user.loggedIn ? (
                <UserNavSection
                  openAnnouncements={openAnnouncements}
                  user={user}
                  SiteNotifs={SiteNotifs}
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
              py: 1.5,
            }}
          >
            <Link to="/play" className="logo-wrapper">
              <SiteLogo />
            </Link>
          </Box>
        </Stack>
      )}
      {/* Desktop Navigation Bar */}
      {!smallWidth && (
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
                icon={flagblueIcon}
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
                icon={messageIcon}
                items={[
                  { text: "Forums", path: "/community/forums" },
                  { text: "Users", path: "/community/users" },
                  { text: "Moderation", path: "/community/moderation" },
                ]}
              />
              <NavDropdown
                label="Fame"
                icon={medalsilverIcon}
                items={[
                  { text: "Leaderboard", path: "/fame/leaderboard" },
                  { text: "Contributors", path: "/fame/contributors" },
                  { text: "Donors", path: "/fame/donors" },
                ]}
              />
              <NavDropdown
                label="Learn"
                icon={loreIcon}
                items={[
                  { text: "Games", path: "/learn/games" },
                  { text: "Terminology", path: "/learn/terminology" },
                  { text: "Achievements", path: "/learn/achievements" },
                ]}
              />
              <NavDropdown
                label="Policy"
                icon={lawIcon}
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
                    SiteNotifs={SiteNotifs}
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

function SiteNotifs() {
  const [showNotifList, setShowNotifList] = useState(false);
  const [notifInfo, updateNotifInfo] = useNotifInfoReducer();
  const [nextRestart, setNextRestart] = useState();
  const siteInfo = useContext(SiteInfoContext);
  const navigate = useNavigate();

  const bellRef = useRef();
  const notifListRef = useRef();

  useOnOutsideClick([bellRef, notifListRef], () => setShowNotifList(false));

  useEffect(() => {
    getNotifs();
    var notifGetInterval = setInterval(() => getNotifs(), 10 * 1000);
    return () => clearInterval(notifGetInterval);
  }, []);

  useEffect(() => {
    if (showNotifList) viewedNotifs();
  }, [notifInfo.notifs]);

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

  useLayoutEffect(() => {
    if (!showNotifList) return;

    const listRect = notifListRef.current.getBoundingClientRect();
    const listRight = listRect.left + listRect.width;

    if (listRight > window.innerWidth)
      notifListRef.current.style.left = window.innerWidth - listRight + "px";

    notifListRef.current.style.visibility = "visible";
  });

  function getNotifs() {
    axios
      .get("/api/notifs")
      .then((res) => {
        var nextRestart = res.data[0];
        var notifs = res.data.slice(1);

        setNextRestart(nextRestart);

        updateNotifInfo({
          type: "add",
          notifs: notifs,
        });
      })
      .catch(() => {});
  }

  function viewedNotifs() {
    axios
      .post("/api/notifs/viewed")
      .then(() => {
        updateNotifInfo({ type: "viewed" });
      })
      .catch(() => {});
  }

  function onShowNotifsClick() {
    setShowNotifList(!showNotifList);

    if (!showNotifList && notifInfo.unread > 0) viewedNotifs();
  }

  function onNotifClick(e, notif) {
    if (!notif.link) e.preventDefault();
    else if (window.location.pathname === notif.link.split("?")[0])
      navigate.go(0);
  }

  const notifs = notifInfo.notifs.map((notif) => (
    <Link
      className="notif"
      key={notif.id}
      to={notif.link}
      onClick={(e) => onNotifClick(e, notif)}
    >
      {notif.icon && <i className={`fas fa-${notif.icon}`} />}
      <div className="info">
        <div className="time">
          <Time millisec={Date.now() - notif.date} suffix=" ago" />
        </div>
        <div className="content">{notif.content}</div>
      </div>
    </Link>
  ));

  return (
    <div className="notifs-wrapper">
      <NotificationHolder
        lOffset
        notifCount={notifInfo.unread}
        onClick={onShowNotifsClick}
        fwdRef={bellRef}
      >
        <i className="fas fa-bell" />
      </NotificationHolder>
      {showNotifList && (
        <div className="notif-list" ref={notifListRef}>
          {notifs}
          {notifs.length === 0 && "No unread notifications"}
        </div>
      )}
    </div>
  );
}

function useNotifInfoReducer() {
  return useReducer(
    (notifInfo, action) => {
      var newNotifInfo;

      switch (action.type) {
        case "add":
          var existingNotifIds = notifInfo.notifs.map((notif) => notif.id);
          var newNotifs = action.notifs.filter(
            (notif) => existingNotifIds.indexOf(notif.id) === -1
          );

          newNotifInfo = update(notifInfo, {
            notifs: {
              $set: newNotifs.concat(notifInfo.notifs),
            },
            unread: {
              $set: notifInfo.unread + newNotifs.length,
            },
          });

          // if (newNotifs.length > 0 && document.hidden && document.title.indexOf("🔴") == -1)
          //     document.title = document.title + "🔴";
          break;
        case "viewed":
          newNotifInfo = update(notifInfo, {
            unread: {
              $set: 0,
            },
          });
          break;
      }

      return newNotifInfo || notifInfo;
    },
    { notifs: [], unread: 0 }
  );
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
