import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  Route,
  Link,
  NavLink,
  Switch,
  useHistory,
  useLocation,
} from "react-router-dom";
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
import Game from "./pages/Game/Game";
import Play from "./pages/Play/Play";
import Community from "./pages/Community/Community";
import Fame from "./pages/Fame/Fame";
import Learn from "./pages/Learn/Learn";
import Development from "./pages/Development/Development";
import Policy from "./pages/Policy/Policy";
import User, { Avatar, useUser } from "./pages/User/User";
import UserNotifications from "./pages/User/UserNotifications";
import Popover, { usePopover } from "./components/Popover";
import CookieBanner from "./components/CookieBanner";
import Chat from "./pages/Chat/Chat";

import "./css/main.css";
import { useReducer } from "react";
import { setCaptchaVisible } from "./utils";
import { NewLoading } from "./pages/Welcome/NewLoading";
import { Box, ThemeProvider, CssBaseline } from "@mui/material";
import {
  darkTheme,
  lightTheme,
  darkThemeHigherContrast,
} from "./constants/themes";
import { Announcement } from "./components/alerts/Announcement";
import { BadTextContrast } from "./components/alerts/BadTextContrast";
import { useIsPhoneDevice } from "./hooks/useIsPhoneDevice";

function Main() {
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

  function onGameLeave(index) {
    axios
      .post("/game/leave")
      .then(() => {
        siteInfo.hideAlert(index);
      })
      .catch(errorAlert);
  }

  const [theme, setTheme] = useState(darkTheme);

  useEffect(() => {
    const colorScheme = user?.settings?.siteColorScheme || "dark";
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
        var res = await axios.get("/user/info");

        if (res.data.id) {
          setCaptchaVisible(false);

          axios.defaults.headers.common["x-csrf"] = res.data.csrf;
          axios.post("/user/online");

          res.data.loggedIn = true;
          res.data.loaded = true;
          res.data.rank = Number(res.data.rank);
          user.set(res.data);

          var referrer = window.localStorage.getItem("referrer");

          if (referrer) {
            axios.post("/user/referred", { referrer });
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

        res = await axios.get("/roles/all");
        siteInfo.update("roles", res.data);

        res = await axios.get("/roles/raw");
        siteInfo.update("rolesRaw", res.data);

        res = await axios.get("/roles/modifiers");
        siteInfo.update("modifiers", res.data);
      } catch (e) {
        errorAlert(e);
      } finally {
        setLoading(false);
      }
    }

    getInfo();

    var onlineInterval = setInterval(() => {
      axios.post("/user/online");
    }, 1000 * 30);

    return () => {
      clearInterval(onlineInterval);
    };
  }, []);

  if (isLoading) {
    return <NewLoading />;
  }

  const style = isPhoneDevice
    ? { padding: "8px" }
    : { padding: "24px" };

  return (
    <UserContext.Provider value={user}>
      <SiteInfoContext.Provider value={siteInfo}>
        <PopoverContext.Provider value={popover}>
          <ThemeProvider theme={theme}>
            <CookieBanner />
            <CssBaseline />
            <Switch>
              <Route path="/game">
                <Game />
                <AlertList />
              </Route>
              <Route path="/">
                <div className="site-wrapper">
                  <div className="main-container" style={style}>
                    <Header
                      setShowAnnouncementTemporarily={
                        setShowAnnouncementTemporarily
                      }
                    />
                    <Announcement
                      showAnnouncementTemporarily={showAnnouncementTemporarily}
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
                      <Switch>
                        <Route path="/play" render={() => <Play />} />
                        <Route path="/community" render={() => <Community />} />
                        <Route path="/fame" render={() => <Fame />} />
                        <Route
                          path="/development"
                          render={() => <Development />}
                        />
                        <Route path="/learn" render={() => <Learn />} />
                        <Route path="/policy" render={() => <Policy />} />
                        <Route path="/user" render={() => <User />} />
                      </Switch>
                    </div>
                    <Footer />
                    <AlertList />
                    {<Chat SiteNotifs={SiteNotifs} />}
                  </div>
                </div>
              </Route>
            </Switch>
            <Popover />
          </ThemeProvider>
        </PopoverContext.Provider>
      </SiteInfoContext.Provider>
    </UserContext.Provider>
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
    if (currentMonth === 5) return "../../images/holiday/umpride2.png"; // June (Pride)
    if (currentMonth === 9) return "../../images/holiday/logobloody.png"; // October (Halloween)
    return "../../images/fadelogohat.png";
  };

  return (
    <div className="header">
      <Link to="/" className="logo-wrapper">
        <Box
          component="img"
          sx={{
            height: 105,
            width: 179,
            ml: "auto",
            mr: "auto",
          }}
          alt="Site logo"
          src={getLogoSrc()}
        />
      </Link>
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexGrow: 1,
            fontWeight: "bold",
          }}
          onClick={toggleMenu}
        >
          <Icon
            icon="material-symbols:menu-rounded"
            style={{ marginRight: 8 }}
          />
          <span>{expandedMenu === false ? "Menu" : "Close"}</span>
        </div>
        {user.loggedIn && (
          <div className="nav" style={{ flexGrow: 0 }}>
            <div
              className="user-wrapper"
              style={{ display: "flex", alignItems: "flex-start" }}
            >
              <UserNotifications
                openAnnouncements={openAnnouncements}
                user={user}
                SiteNotifs={SiteNotifs}
              />
            </div>
          </div>
        )}
      </div>
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
            to="/development"
            className={"glow-on-hover"}
            style={expandedMenu ? { width: "100%" } : { width: "auto" }}
          >
            <span>Dev</span>
          </NavLink>
          <NavLink
            to="/policy"
            className={"glow-on-hover"}
            style={expandedMenu ? { width: "100%" } : { width: "auto" }}
          >
            <span>Policy</span>
          </NavLink>
          {user.loggedIn && (
            <div
              className="user-wrapper"
              style={{ display: smallWidth === true ? "none" : "flex" }}
            >
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
      .get("/notifs")
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
      .post("/notifs/viewed")
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
              style={{ color: "var(--theme-color-text)" }}
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
            <a
              target="_blank"
              href="https://ultimafia.com/user/2oDrE3Ueq"
            >
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
