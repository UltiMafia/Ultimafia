import React, {
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
  Redirect,
  Switch,
  useHistory,
  useLocation,
} from "react-router-dom";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import axios from "axios";
import update from "immutability-helper";
import { Icon } from "@iconify/react";

import {
  UserContext,
  SiteInfoContext,
  PopoverContext,
  useSiteInfo,
} from "./Contexts";
import { AlertList, useErrorAlert } from "./components/Alerts";
import {
  NotificationHolder,
  useOnOutsideClick,
  Time,
} from "./components/Basic";
import { Nav } from "./components/Nav";
import { Welcome } from "./pages/Welcome/Welcome";
import Game from "./pages/Game/Game";
import Play from "./pages/Play/Play";
import Community from "./pages/Community/Community";
import Fame from "./pages/Fame/Fame";
import Learn from "./pages/Learn/Learn";
import Policy from "./pages/Policy/Policy";
import User, { Avatar, useUser } from "./pages/User/User";
import UserNotifications from "./pages/User/UserNotifications";
import Popover, { usePopover } from "./components/Popover";
import CookieBanner from "./components/CookieBanner";
import Chat from "./pages/Chat/Chat";

import "css/main.css";
import { useReducer } from "react";
import { setCaptchaVisible } from "./utils";
import { NewLoading } from "./pages/Welcome/NewLoading";
import {
  Box,
  Stack,
  ThemeProvider,
  CssBaseline,
  Paper,
  Typography,
  Button,
  useMediaQuery,
} from "@mui/material";
import {
  darkTheme,
  lightTheme,
  darkThemeHigherContrast,
} from "./constants/themes";
import { Announcement } from "./components/alerts/Announcement";
import { BadTextContrast } from "./components/alerts/BadTextContrast";
import { useIsPhoneDevice } from "./hooks/useIsPhoneDevice";

import umpride2 from "images/holiday/umpride2.png";
import logobloody from "images/holiday/logobloody.png";
import fadelogohat from "images/fadelogohat.png";

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
        <Typography variant="h5">Error:</Typography>
        <Typography color="red" sx={{ wordBreak: "break-word" }}>
          {error.message}
        </Typography>
        <Button onClick={resetErrorBoundary}>Refresh</Button>
      </Stack>
    </Paper>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  const errorBox = <ErrorBox error={error} resetErrorBoundary={resetErrorBoundary}/>;
  return <Main errorContent={errorBox}/>;
}

function ErrorFallbackNoMain({ error, resetErrorBoundary }) {
  return <ErrorBox error={error} resetErrorBoundary={resetErrorBoundary}/>;
}

function Main(props) {
  const errorContent = props.errorContent;

  var cacheVal = window.localStorage.getItem("cacheVal");
  const [isLoading, setLoading] = useState(true);
  const [showAnnouncementTemporarily, setShowAnnouncementTemporarily] =
    useState(false);

  if (!cacheVal) {
    cacheVal = Date.now();
    window.localStorage.setItem("cacheVal", cacheVal);
  }

  const openAnnouncements = () => {
    setShowAnnouncementTemporarily(true);
  };

  const isPhoneDevice = useIsPhoneDevice();

  const user = useUser();
  const siteInfo = useSiteInfo({
    alerts: [],
    cacheVal,
  });
  const popover = usePopover(siteInfo);
  const errorAlert = useErrorAlert(siteInfo);
  const location = useLocation();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  function onGameLeave(index) {
    axios
      .post("/api/game/leave")
      .then(() => {
        siteInfo.hideAlert(index);
      })
      .catch(errorAlert);
  }

  const preferredTheme = prefersDarkMode ? "dark" : "light";
  const [theme, setTheme] = useState(prefersDarkMode ? darkTheme : lightTheme);

  useEffect(() => {
    const colorScheme = user?.settings?.siteColorScheme || preferredTheme;
    document.documentElement.classList.remove("dark-mode", "light-mode");
    document.documentElement.classList.add(`${colorScheme}-mode`);

    setTheme(colorScheme === "dark" ? darkTheme : lightTheme);
  }, [user?.settings?.siteColorScheme]);
  /*
  var roleIconScheme = user.settings?.roleIconScheme
    ? user.settings.roleIconScheme
    : "vivid";
  var roleSkins = user.settings?.roleSkins ? user.settings.roleSkins : [];

  let toClear = ["role-icon-scheme-noir", "role-icon-scheme-vivid"];
  for (let scheme of toClear) {
    if (document.documentElement.classList.contains(scheme)) {
      document.documentElement.classList.remove(scheme);
    }
  }
  
  if(roleSkins.length > 0){
    let hasDone = false;
    for(let skin of roleSkins){
      if(document.documentElement.classList.contains(`role-Mafia-${skin.split(":")[0]}`)){
        document.documentElement.classList.add(`role-icon-scheme-${skin.split(":")[1]}`);
        hasDone = true;
      }
    }
    if(hasDone == false){
      document.documentElement.classList.add(`role-icon-scheme-${roleIconScheme}`);
    }
  }
  else{
 document.documentElement.classList.add(`role-icon-scheme-${roleIconScheme}`);
  }
  */

  useEffect(() => {
    async function getInfo() {
      try {
        var res = await axios.get("/api/user/info");

        if (res.data.id) {
          setCaptchaVisible(false);

          axios.defaults.headers.common["x-csrf"] = res.data.csrf;
          axios.post("/api/user/online");

          res.data.loggedIn = true;
          res.data.loaded = true;
          res.data.rank = Number(res.data.rank);
          user.set(res.data);

          var referrer = window.localStorage.getItem("referrer");

          if (referrer) {
            axios.post("/api/user/referred", { referrer });
            window.localStorage.removeItem("referrer");
          }
        } else {
          user.clear();
          setCaptchaVisible(true);
        }

        if (res.data.nameChanged === false) {
          siteInfo.showAlert(
            () => (
              <div>
                New account created, you can change your username once in your{" "}
                <Link to={`/user/settings`}>settings</Link>.
              </div>
            ),
            "basic",
            true
          );
        }

        if (
          res.data.inGame &&
          !window.location.href.includes(`/game/${res.data.inGame}`)
        ) {
          siteInfo.showAlert(
            (index) => (
              <div>
                Return to game{" "}
                <Link to={`/game/${res.data.inGame}`}>{res.data.inGame}</Link>{" "}
                or <a onClick={() => onGameLeave(index)}>leave</a>.
              </div>
            ),
            "basic",
            true
          );
        }

        res = await axios.get("/api/roles/all");
        siteInfo.update("roles", res.data);

        res = await axios.get("/api/roles/raw");
        siteInfo.update("rolesRaw", res.data);

        res = await axios.get("/api/roles/modifiers");
        siteInfo.update("modifiers", res.data);
      } catch (e) {
        errorAlert(e);
      } finally {
        setLoading(false);
      }
    }

    getInfo();

    var onlineInterval = setInterval(() => {
      axios.post("/api/user/online");
    }, 1000 * 30);

    return () => {
      clearInterval(onlineInterval);
    };
  }, []);

  const isWelcomePage = location.pathname === "/";
  if (user.loggedIn && isWelcomePage) {
    return <Redirect to="/play" />;
  }

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <NewLoading />
      </ThemeProvider>
    );
  }

  const style = isPhoneDevice ? { padding: "8px" } : { padding: "24px" };

  const siteContent = (
    <Box className="site-wrapper" sx={{
      backgroundColor: "background.paper"
    }}>
      <div className="main-container" style={style}>
        <Header
          setShowAnnouncementTemporarily={
            setShowAnnouncementTemporarily
          }
        />
        <Announcement
          showAnnouncementTemporarily={
            showAnnouncementTemporarily
          }
          setShowAnnouncementTemporarily={
            setShowAnnouncementTemporarily
          }
        />
        <BadTextContrast
          colorType="username"
          color={user?.settings?.warnNameColor}
        />
        <BadTextContrast
          colorType="text"
          color={user?.settings?.warnTextColor}
        />
        <div className="inner-container">
          {errorContent ? errorContent : (
            <Switch>
              <Route path="/play" render={() => <Play />} />
              <Route path="/community" render={() => <Community />}/>
              <Route path="/fame" render={() => <Fame />} />
              <Route path="/learn" render={() => <Learn />} />
              <Route path="/policy" render={() => <Policy />} />
              <Route path="/user" render={() => <User />} />
            </Switch>
          )}
        </div>
        <Footer />
        <AlertList />
        {<Chat SiteNotifs={SiteNotifs} />}
      </div>
    </Box>
  );

  const mainContent = (
    <UserContext.Provider value={user}>
      <SiteInfoContext.Provider value={siteInfo}>
        <PopoverContext.Provider value={popover}>
          <CookieBanner />
          <CssBaseline />
          <Switch>
            <Route path="/game">
              {/* Site content will display instead of game if content is being overriden by the error boundary*/}
              {errorContent ? siteContent : (
                <>
                  <Game />
                  <AlertList />
                </>
              )}
            </Route>
            <Route path="/">
              {siteContent}
            </Route>
          </Switch>
          <Popover />
        </PopoverContext.Provider>
      </SiteInfoContext.Provider>
    </UserContext.Provider>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <ErrorBoundary
        FallbackComponent={errorContent !== undefined ? ErrorFallbackNoMain : ErrorFallback}
        onReset={() =>
          (window.location.href =
            window.location.origin + window.location.pathname)
        }
      >
        <Switch>
          <Route exact path="/">
            <Welcome />
          </Route>
          <Route>
            <Suspense fallback={<NewLoading />}>
              {mainContent}
            </Suspense>
          </Route>
        </Switch>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function Header({ setShowAnnouncementTemporarily }) {
  const user = useContext(UserContext);

  const openAnnouncements = () => {
    setShowAnnouncementTemporarily(true);
  };

  const [expandedMenu, setExpandedMenu] = useState(false);

  const toggleMenu = () => {
    setExpandedMenu(!expandedMenu);
  };

  const [smallWidth, setSmallWidth] = useState(window.innerWidth <= 700);

  const handleResize = () => {
    setSmallWidth(window.innerWidth <= 700);
  };

  const location = useLocation();

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      // smallWidth ? {

      // } : {

      // };
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      setExpandedMenu(false);
    };
  }, [location]);

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

  return (
    <div className="header">
      {new Date().getMonth() === 9 && (
        <img
          src="/images/holiday/spiderweb.gif"
          alt="Holiday Spider"
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            zIndex: 1000,
            width: "10%",
            height: "10%",
            display: window.innerWidth <= 768 ? "none" : "block",
          }}
        />
      )}
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
        }}
      >
        <Link to="/" className="logo-wrapper">
          <Box
            component="img"
            sx={{
              height: 105,
              width: 179,
            }}
            alt="Site logo"
            src={getLogoSrc()}
          />
        </Link>
        <Stack direction="column">
          {user.loggedIn && smallWidth && (
            <div className="user-wrapper">
              <UserNotifications
                openAnnouncements={openAnnouncements}
                user={user}
                SiteNotifs={SiteNotifs}
              />
            </div>
          )}
          <div
            className="navbar nav-wrapper"
            style={{
              display: smallWidth === false ? "none" : "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "24px",
              flexDirection: "row",
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: "center",
                fontWeight: "bold",
                marginLeft: "auto",
              }}
              onClick={toggleMenu}
            >
              <span>{expandedMenu === false ? "Menu" : "Close"}</span>
              <Icon
                icon="material-symbols:menu-rounded"
                style={{ marginRight: 8 }}
              />
            </Stack>
          </div>
        </Stack>
      </Stack>
      <div
        className="nav-wrapper"
        style={{
          display:
            smallWidth === true ? (expandedMenu ? "flex" : "none") : "flex",
        }}
      >
        <Nav>
          <NavLink
            to="/play"
            className={"glow-on-hover"}
            style={expandedMenu ? { width: "100%" } : { width: "auto" }}
          >
            <span>Play</span>
          </NavLink>
          <NavLink
            to="/community"
            className={"glow-on-hover"}
            style={expandedMenu ? { width: "100%" } : { width: "auto" }}
          >
            <span>Community</span>
          </NavLink>
          <NavLink
            to="/fame"
            className={"glow-on-hover"}
            style={expandedMenu ? { width: "100%" } : { width: "auto" }}
          >
            <span>Fame</span>
          </NavLink>
          <NavLink
            to="/learn"
            className={"glow-on-hover"}
            style={expandedMenu ? { width: "100%" } : { width: "auto" }}
          >
            <span>Learn</span>
          </NavLink>
          <NavLink
            to="/policy"
            className={"glow-on-hover"}
            style={expandedMenu ? { width: "100%" } : { width: "auto" }}
          >
            <span>Policy</span>
          </NavLink>
          {user.loggedIn && !smallWidth && (
            <div className="user-wrapper">
              <UserNotifications
                openAnnouncements={openAnnouncements}
                user={user}
                SiteNotifs={SiteNotifs}
              />
            </div>
          )}
        </Nav>
      </div>
    </div>
  );
}

function SiteNotifs() {
  const [showNotifList, setShowNotifList] = useState(false);
  const [notifInfo, updateNotifInfo] = useNotifInfoReducer();
  const [nextRestart, setNextRestart] = useState();
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();

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
      history.go(0);
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
