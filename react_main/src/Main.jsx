import React, {
  useState,
  useContext,
  useEffect,
  Suspense,
} from "react";
import { lazyWithRetry, clearChunkReloadFlag } from "./lib/lazyWithRetry";
import { loadGameModule } from "./lib/gameModule";
import {
  Route,
  Link,
  Navigate,
  Routes,
  useLocation,
} from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import axios from "axios";
import { ThemeProvider, CssBaseline, AppBar } from "@mui/material";

import {
  UserContext,
  SiteInfoContext,
  SiteInfoProvider,
  UserProvider,
  InGameContext,
} from "./Contexts";
import { getSiteTheme } from "./constants/themes";
import { AlertList, useErrorAlert } from "./components/Alerts";
import { ConnectionBanner } from "./components/ConnectionBanner";
import UserNavSection from "./pages/User/UserNavSection";
import CookieBanner from "./components/CookieBanner";
import { IOS_BETA_URL } from "./constants/iosBeta";
import LeaveGameDialog from "./components/LeaveGameDialog";
import NavDropdown from "./components/NavDropdown";
import { Loading } from "./components/Loading";
import SiteLayout from "./components/SiteLayout";
import { ProfileSheetProvider } from "./components/ProfileSheet";
import { SheetProvider } from "./components/Sheet";
import ThemeColorMeta from "./components/ThemeColorMeta";
import RetainedSiteRoutes from "./components/RetainedSiteRoutes";
import { DmWindowProvider } from "./components/dms/DmWindowContext";
import FloatingDmWindow from "./components/dms/FloatingDmWindow";
import { StrategyWindowsProvider } from "./components/strategyWindows/StrategyWindowsContext";
import FloatingStrategyWindows from "./components/strategyWindows/FloatingStrategyWindows";
import ViewOverlayBoundary from "./components/ViewOverlayBoundary";
import { AppLocationContext, ViewActivityContext, ViewNavigate } from "./hooks/useViewActivity";
import { useAppViewport } from "./hooks/useAppViewport";
import { useHostedGameSession } from "./hooks/useHostedGameSession";
import { browserReservesBottomSafeArea } from "./utils/platform";
import "css/main.css";
import "css/accessibility.css";
import "css/redesign.css";

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

// Route components must be created once, at module scope. Calling lazy()
// inside Main gave every route a new component type on each Main render, so
// any Main state change (e.g. crossing the md breakpoint on resize/rotation,
// theme change) unmounted and remounted the whole page: its API calls re-ran
// and the game page reconnected its socket.
const Game = lazyWithRetry(loadGameModule);
const Play = lazyWithRetry(() => import("pages/Play/Play"));
const Community = lazyWithRetry(() => import("pages/Community/Community"));
const Fame = lazyWithRetry(() => import("pages/Fame/Fame"));
const Learn = lazyWithRetry(() => import("pages/Learn/Learn"));
const Policy = lazyWithRetry(() => import("pages/Policy/Policy"));
const SiteActivity = lazyWithRetry(() => import("pages/Activity/Activity"));
const User = lazyWithRetry(() => import("pages/User/User"));
const Welcome = lazyWithRetry(() => import("pages/Welcome/Welcome"));
const Banned = lazyWithRetry(() => import("pages/Banned/Banned"));

// The game session is rendered outside the route table, so the route table must
// not treat a game URL as an unknown site path and redirect away from it.
function Main(props) {
  const errorContent = props.errorContent;

  const [isUserLoading, setUserLoading] = useState(true);
  const [siteTheme, setSiteTheme] = useState(() => getSiteTheme());
  const [isSiteInfoLoading, setSiteInfoLoading] = useState(true);
  const [showAnnouncementTemporarily, setShowAnnouncementTemporarily] =
    useState(false);

  const location = useLocation();
  // Size the phone shell and game session to the visual viewport.
  useAppViewport();

  // Who owns the bottom safe area: Firefox on Android already keeps the layout
  // viewport clear of it, while iOS browsers and Chrome on Android hand the
  // strip to the page, so the bottom bar has to fill it there. css/main.css
  // reads this.
  useEffect(() => {
    const root = document.documentElement;
    if (browserReservesBottomSafeArea()) root.removeAttribute("data-bottom-inset");
    else root.setAttribute("data-bottom-inset", "page");
    return () => root.removeAttribute("data-bottom-inset");
  }, []);
  const { inGame, hostedGameId, hostedGameSearch, leaveGameSession } = useHostedGameSession();
  useEffect(() => {
    if (hostedGameId) void loadGameModule().catch(() => {});
  }, [hostedGameId]);
  // A lobby Join/Spectate click carries the requested role in navigation
  // state. The mounted Game applies it over its existing socket.
  const membershipRequest = location.state?.requestedMembership
    ? {
        membership: location.state.requestedMembership,
        key: location.key,
      }
    : null;

  useEffect(() => {
    const root = document.documentElement;
    if (inGame) root.setAttribute("data-game-view", "active");
    else root.removeAttribute("data-game-view");
    return () => root.removeAttribute("data-game-view");
  }, [inGame]);

  const loading = isUserLoading || isSiteInfoLoading;

  useEffect(() => {
    clearChunkReloadFlag();
  }, []);

  const siteContent = (
    <SiteLayout
      hidden={inGame}
      beforeHeader={<CookieBanner />}
      header={<Header setShowAnnouncementTemporarily={setShowAnnouncementTemporarily} />}
      footer={<Footer />}
    >
          <Announcement
            showAnnouncementTemporarily={showAnnouncementTemporarily}
            setShowAnnouncementTemporarily={setShowAnnouncementTemporarily}
          />
          <main className="inner-container" id="main-content" tabIndex={-1}>
            {errorContent ? (
              errorContent
            ) : (
              <Suspense fallback={<Loading small />}>
                <RetainedSiteRoutes active={!inGame}>
                  <Route path="welcome" element={<Welcome />} />
                  <Route path="play/*" element={<Play />} />
                  <Route path="community/*" element={<Community />} />
                  <Route path="fame/*" element={<Fame />} />
                  <Route path="learn/*" element={<Learn />} />
                  <Route path="policy/*" element={<Policy />} />
                  <Route path="activity/*" element={<SiteActivity />} />

                  <Route path="user/*" element={<User />} />
                  <Route path="*" element={<ViewNavigate to="play" />} />
                </RetainedSiteRoutes>
              </Suspense>
            )}
          </main>
          {/* Only while the user is elsewhere: while a game has the screen the
              warning is pointless, and the Snackbar portals to <body>, where
              the hidden shell does not reach it. */}
          {!inGame && <InGameWarning />}
    </SiteLayout>
  );

  // The game session is rendered outside the route table so that navigating
  // between site pages does not unmount it. It is hidden, not unmounted, while
  // the user is elsewhere, and is torn down only when the game leaves.
  const gameSession =
    hostedGameId && !errorContent ? (
      <div
        className="game-session"
        style={{ display: inGame ? undefined : "none" }}
      >
        <Game
          key={hostedGameId}
          gameId={hostedGameId}
          joinSearch={hostedGameSearch}
          active={inGame}
          membershipRequest={membershipRequest}
          onLeave={leaveGameSession}
        />
      </div>
    ) : null;

  const mainContent = (
    <SiteInfoProvider setSiteInfoLoading={setSiteInfoLoading}>
      {loading && <Loading />}
      {!loading && (
        <AppLocationContext.Provider value={location}>
        {/* Guide windows are hosted here rather than inside the game page, so a
            popped-out guide stays on screen while the user plays and while
            they browse setups. */}
        <StrategyWindowsProvider>
        <SheetProvider>
          <ProfileSheetProvider>
            <ThemeColorMeta />
            <DmWindowProvider>
            <InGameContext.Provider value={inGame}>
              <ViewOverlayBoundary active={!inGame}>
                  {siteContent}
              </ViewOverlayBoundary>
            </InGameContext.Provider>
            {/* Floating DMs follow the user across site pages and are
                unmounted on game pages (their state is kept). */}
            {!inGame && !errorContent && <FloatingDmWindow />}
            </DmWindowProvider>
            <ViewActivityContext.Provider value={inGame}>
              {gameSession}
            </ViewActivityContext.Provider>
            <AlertList />
            <ConnectionBanner />
            <FloatingStrategyWindows />
          </ProfileSheetProvider>
        </SheetProvider>
        </StrategyWindowsProvider>
        </AppLocationContext.Provider>
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
            setSiteTheme={setSiteTheme}
          >
            <SnowstormController />
            <Routes>
              <Route path="/" element={<Navigate to="/welcome" />} />
              {/* Full page, outside the site shell: a site-banned user can
                  see why and appeal, and nothing else. */}
              <Route path="/banned" element={<Banned />} />
              <Route path="/*" element={mainContent} />
            </Routes>
          </UserProvider>
        </ErrorBoundary>
      </Suspense>
    </ThemeProvider>
  );
}

export function Header({ setShowAnnouncementTemporarily }) {
  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();
  const location = useLocation();
  const isOnWelcomePage = location.pathname === "/welcome" || location.pathname === "/";

  const openAnnouncements = () => {
    setShowAnnouncementTemporarily(true);
  };

  return (
    <AppBar position="sticky" className="site-header" sx={{
      backgroundColor: "background.paper",
      color: "text.primary",
    }}>
      <a className="skip-link" href="#main-content">Skip to content</a>

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
                  { text: "Tutorial", path: "/play/tutorial" },
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
                    text: "Character Decks",
                    path: "/play/decks",
                    hide: !user.loggedIn,
                  },
                  {
                    text: "Word Decks",
                    path: "/play/wordDecks",
                    hide: !user.loggedIn,
                  },
                ],
              },
              {
                label: "Community",
                items: [
                  { text: "Forums", path: "/community/forums" },
                  { text: "Players", path: "/community/users" },
                  { text: "Families", path: "/community/families" },
                  { text: "Feedback", path: "/community/feedback" },
                ],
              },
              {
                label: "Fame",
                items: [
                  { text: "Hall of Fame", path: "/fame/hall-of-fame" },
                  { text: "Competitive", path: "/fame/competitive" },
                  { text: "Stock Market", path: "/fame/stocks" },
                  { text: "Contributors", path: "/fame/contributors" },
                  { text: "Donors", path: "/fame/donors" },
                ],
              },
              {
                label: "Learn",
                items: [
                  { text: "Roles and games", path: "/learn/games" },
                  { text: "Glossary", path: "/learn/glossary" },
                  ...(IOS_BETA_URL ? [{ text: "iOS app (beta)", href: IOS_BETA_URL }] : []),
                ],
              },
              {
                label: "Policy",
                items: [
                  { text: "Rules", path: "/policy/rules" },
                  { text: "Moderation", path: "/policy/moderation" },
                  { text: "Invoices", path: "/policy/invoices", hide: !(user.groups || []).some((g) => g && g.name === "Owner") },
                ],
              },
              {
                label: "Activity",
                items: [
                  { text: "Metrics", path: "/activity/metrics" },
                  { text: "Live Feed", path: "/activity/livefeed" },
                ],
              },
            ]}
          />
          <SiteLogo small flexible />
          {/* User section */}
          <div style={{ flex: "1 0" }}>
            {/* Signed-out auth lives in the phone bottom navigation; the header
                Login/Register buttons overflowed the bar. */}
            {user.loggedIn && (
              <UserNavSection
                openAnnouncements={openAnnouncements}
                user={user}
                useUnreadNotifications={useUnreadNotifications}
              />
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
  const isPhoneDevice = useIsPhoneDevice();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  useEffect(() => {
    setLeaveDialogOpen(false);
  }, [user.inGame]);

  function onGameLeave() {
    setLeaveDialogOpen(false);
    axios
      .post("/api/game/leave")
      .then(() => {
        user.setInGame(null);
      })
      .catch(errorAlert);
  }

  const warning = (
    <Alert
      severity="warning"
      variant="outlined"
      sx={{
        width: "100%",
        backgroundColor: "background.paper",
        alignItems: "center",
        py: 0.5,
      }}
      slotProps={{
        message: {
          sx: {
            flex: "1",
          },
        },
      }}
    >
      <AlertTitle sx={{ mb: 0.5, fontSize: "0.9rem" }}>
        You are in a game in progress.
      </AlertTitle>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          component={Link}
          to={`/game/${user.inGame}`}
          size="small"
          sx={{ flex: "1" }}
        >
          Return
        </Button>
        <Button onClick={() => setLeaveDialogOpen(true)} size="small" sx={{ flex: "1" }}>
          Leave
        </Button>
      </Stack>
    </Alert>
  );

  return (
    <>
      {isPhoneDevice ? (
        // In the page flow, so it takes its own space at the end of the
        // scrolling column and never covers the last row.
        user.inGame !== null && (
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              mt: "auto !important",
              zIndex: "snackbar",
            }}
          >
            {warning}
          </Box>
        )
      ) : (
        <Snackbar
          open={user.inGame !== null}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          sx={{ maxWidth: "calc(100vw - 16px)" }}
        >
          {warning}
        </Snackbar>
      )}
      <LeaveGameDialog
        open={leaveDialogOpen && user.inGame !== null}
        onClose={() => setLeaveDialogOpen(false)}
        onConfirm={onGameLeave}
        warningMessage="Leaving while your participation is still required may result in a penalty."
      />
    </>
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
    if (siteInfo.notifsBumpToken) getNotifs();
  }, [siteInfo.notifsBumpToken]);

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
      .get("/api/notifs/unreadCount")
      .then((res) => {
        setNextRestart(res.data.nextRestart);
        setUnreadCount(res.data.count);
      })
      .catch(() => {});
  }

  return unreadCount;
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-links">
        <span>© {new Date().getFullYear()} UltiMafia</span>
        <nav aria-label="Footer links">
          <a href="https://github.com/UltiMafia/Ultimafia" target="_blank" rel="noopener noreferrer nofollow">GitHub</a>
          <a href="https://discord.gg/C5WMFpYRHQ" target="_blank" rel="noopener noreferrer nofollow">Discord</a>
          <a href="https://ko-fi.com/ultimafia" target="_blank" rel="noopener noreferrer nofollow">Support</a>
          {IOS_BETA_URL && <a href={IOS_BETA_URL} target="_blank" rel="noopener noreferrer">iOS app</a>}
        </nav>
      </div>
      <p>By accessing this website, you agree to our <Link to="/policy/tos">Terms of Service</Link> and <Link to="/policy/privacy">Privacy Policy</Link>.</p>
      <p className="site-footer-credits">
        <a href="https://github.com/r3ndd/BeyondMafia-Integration" target="_blank" rel="noopener noreferrer nofollow">Built on code provided by rend</a>
        <a href="https://www.youtube.com/@fredthemontymole" target="_blank" rel="noopener noreferrer nofollow">Featuring music by FredTheMole</a>
        <Link to="/user/2oDrE3Ueq">Additional music by Jumpy</Link>
        <a href="https://pixeliconlibrary.com/" target="_blank" rel="noopener noreferrer">Icons by HackerNoon (CC BY 4.0)</a>
      </p>
    </footer>
  );
}

export default Main;
