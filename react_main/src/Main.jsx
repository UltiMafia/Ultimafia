import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { Route, Link, NavLink, Switch, useHistory, useLocation } from "react-router-dom";
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
import Learn from "./pages/Learn/Learn";
import Auth from "./pages/Auth/Auth";
import User, { Avatar, useUser } from "./pages/User/User";
import UserNotifications from "./pages/User/UserNotifications";
import Policy from "./pages/Policy/Policy";
import Fame from "./pages/Fame/Fame";
import Popover, { usePopover } from "./components/Popover";
import Chat from "./pages/Chat/Chat";

import "./css/main.css";
import { useReducer } from "react";
import { setCaptchaVisible } from "./utils";
import { NewLoading } from "./pages/Welcome/NewLoading";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme, darkThemeHigherContrast } from "./constants/themes";
import { Announcement } from "./components/alerts/Announcement";
import { BadTextContrast } from "./components/alerts/BadTextContrast";
import GlowButton from "./components/GlowButton";

function Main() {
  var cacheVal = window.localStorage.getItem("cacheVal");
  const [isLoading, setLoading] = useState(true);
  const [showChatTab, setShowChatTab] = useState(
    localStorage.getItem("showChatTab") == "false" ? false : true
  );
  const [showAnnouncementTemporarily, setShowAnnouncementTemporarily] =
    useState(false);

  if (!cacheVal) {
    cacheVal = Date.now();
    window.localStorage.setItem("cacheVal", cacheVal);
  }

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

  var userColourScheme = "dark";

  if (userColourScheme === "light") {
    if (document.documentElement.classList.contains("dark-mode")) {
      document.documentElement.classList.remove("dark-mode");
    }
    document.documentElement.classList.add("light-mode");
  } else if (userColourScheme === "dark") {
    if (document.documentElement.classList.contains("light-mode")) {
      document.documentElement.classList.remove("light-mode");
    }
    document.documentElement.classList.add("dark-mode");
  } else if (userColourScheme === "auto") {
    if (document.documentElement.classList.contains("light-mode")) {
      document.documentElement.classList.remove("light-mode");
    }
    document.documentElement.classList.add("dark-mode");
  }

  const [theme, setTheme] = useState();
  useEffect(() => {
    if (user?.settings?.accessibilityTheme === "Higher Contrast") {
      setTheme(darkThemeHigherContrast);
    } else {
      setTheme(darkTheme);
    }
  }, [user]);

  var roleIconScheme = user.settings?.roleIconScheme
    ? user.settings.roleIconScheme
    : "vivid";

  let toClear = ["role-icon-scheme-noir", "role-icon-scheme-vivid"];
  for (let scheme of toClear) {
    if (document.documentElement.classList.contains(scheme)) {
      document.documentElement.classList.remove(scheme);
    }
  }
  document.documentElement.classList.add(`role-icon-scheme-${roleIconScheme}`);

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

        if (res.data.inGame) {
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

  return (
    <UserContext.Provider value={user}>
      <SiteInfoContext.Provider value={siteInfo}>
        <PopoverContext.Provider value={popover}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Switch>
              <Route path="/game">
                <Game />
              </Route>
              <Route path="/">
                <div className="site-wrapper">
                  <div className="main-container">
                    <Header
                      setShowChatTab={setShowChatTab}
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
                        <Route path="/learn" render={() => <Learn />} />
                        <Route path="/community" render={() => <Community />} />
                        <Route path="/auth" render={() => <Auth />} />
                        <Route path="/user" render={() => <User />} />
                        <Route path="/policy" render={() => <Policy />} />
                        <Route path="/fame" render={() => <Fame />} />
                      </Switch>
                    </div>
                    <Footer />
                    <AlertList />
                    {showChatTab && <Chat
                    setShowChatTab={setShowChatTab} 
                    SiteNotifs={SiteNotifs}  />}
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

function Header({ setShowChatTab, setShowAnnouncementTemporarily }) {
  const user = useContext(UserContext);

  const openChatTab = () => {
    setShowChatTab(true);
    localStorage.setItem("showChatTab", true);
  };

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
    }

    const location = useLocation();

    useEffect(() => {
      window.addEventListener('resize', handleResize);
      return () => {
        // smallWidth ? {
          
        // } : {

        // };
        window.removeEventListener('resize', handleResize);
      };
    }, []);


  useEffect(() => {
    return () => {
      setExpandedMenu(false);
    }
  }, [location]);

    return (
      <div className="header">
        <Link to="/" className="logo-wrapper">
          <div className="logo" />
        </Link>
        <div className="navbar nav-wrapper" style={{display: smallWidth === false ? 'none' : 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', fontSize: '24px', flexDirection: 'row'}}>
          <div style={{display:'flex', alignItems:'center', flexGrow: 1, fontWeight: 'bold'}} onClick={toggleMenu}>
            <Icon icon="material-symbols:menu-rounded" style={{marginRight: 8}} />
            <span>
              {expandedMenu === false ? "Menu": "Close"}
            </span>
          </div>
          {user.loggedIn && (
            <div className="nav" style={{flexGrow: 0}}>
            <div className="user-wrapper" style={{display: 'flex', alignItems: 'flex-start'}}>
              <UserNotifications 
                openChatTab={openChatTab} 
                user={user}
                SiteNotifs={SiteNotifs} 
              />
            </div></div>
          )}
        </div>
      <div className="nav-wrapper" style={{display: smallWidth === true ? (expandedMenu ? 'flex' : 'none') : 'flex'}}>
       <Nav>
        {/* melodic-e: implement mobile-friendly menu
            TODO: refactor into css files (need help or more time to do it myself)
          */}
          <NavLink to="/play" className={"glow-on-hover"} style={expandedMenu ? {width: '100%'} : {width: 'auto'}}>
            <span>Play</span>
          </NavLink>
          <NavLink to="/community" className={"glow-on-hover"} style={expandedMenu ? {width: '100%'} : {width: 'auto'}}>
            <span>Community</span>
          </NavLink>
          <NavLink to="/fame" className={"glow-on-hover"} style={expandedMenu ? {width: '100%'} : {width: 'auto'}}>
            <span>Fame</span>
          </NavLink>
          <NavLink to="/learn" className={"glow-on-hover"} style={expandedMenu ? {width: '100%'} : {width: 'auto'}}>
            <span>Learn</span>
          </NavLink>
          <NavLink to="/policy" className={"glow-on-hover"} style={expandedMenu ? {width: '100%'} : {width: 'auto'}}>
            <span>Policy</span>
          </NavLink>
          {user.loggedIn && (
            <div className="user-wrapper" style={{display: smallWidth === true ? 'none' : 'flex'}}>
              <UserNotifications 
                openChatTab={openChatTab} 
                user={user}
                SiteNotifs={SiteNotifs} 
              />
            </div>
          )}
          {/* {!user.loggedIn && ( 
            <NavLink to="/auth" className="nav-link">
              Log In
            </NavLink>
          )} */}
          {/* TODO: is above REALLY necessary? */}
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
        {/*<a*/}
        {/*  href="https://discord.gg/C5WMFpYRHQ"*/}
        {/*  target="blank"*/}
        {/*  style={{*/}
        {/*    display: "flex",*/}
        {/*    justifyContent: "center",*/}
        {/*    alignItems: "flex-end",*/}
        {/*    color: "var(--theme-color-text)",*/}
        {/*  }}*/}
        {/*>*/}
        {/*  <i className="fab fa-discord" />*/}
        {/*  <Box sx={{ mx: 0.5 }}>Join us on Discord</Box>*/}
        {/*  <i className="fab fa-discord" />*/}
        {/*</a>*/}
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
            href="https://www.patreon.com/Ultimafia/membership"
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
          <div>© {year} UltiMafia</div>
        </div>
      </div>
    </div>
  );
}

export default Main;
