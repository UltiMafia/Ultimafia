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
  Redirect,
  useHistory,
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
import Learn from "./pages/Learn/Learn";
import Auth from "./pages/Auth/Auth";
import User, { Avatar, useUser } from "./pages/User/User";
import Legal from "./pages/Legal/Legal";
import Popover, { usePopover } from "./components/Popover";
import Chat from "./pages/Chat/Chat";
import Emotes from "./pages/Chat/EmoteList";

import "./css/main.css";
import { useReducer } from "react";
import { setCaptchaVisible } from "./utils";

function Main() {
  var cacheVal = window.localStorage.getItem("cacheVal");

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

  var userColourScheme = "";

  if (user.settings?.siteColorScheme === false) {
    userColourScheme = "light";
  } else if (user.settings?.siteColorScheme === true) {
    userColourScheme = "dark";
  } else {
    userColourScheme = user.settings?.siteColorScheme || "auto";
  }

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
    if (document.documentElement.classList.contains("dark-mode")) {
      document.documentElement.classList.remove("dark-mode");
    }
    if (document.documentElement.classList.contains("light-mode")) {
      document.documentElement.classList.remove("light-mode");
    }
  }

  var roleIconScheme = user.settings?.roleIconScheme
    ? user.settings.roleIconScheme
    : "vivid";

  let toClear = [
    "role-icon-scheme-tall",
    "role-icon-scheme-noir",
    "role-icon-scheme-vivid",
    "role-icon-scheme-retro",
  ];
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

        if (res.data.nameChanged == false) {
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
        siteInfo.update("rolesRaw", res.data)
      } catch (e) {
        errorAlert(e);
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

  return (
    <UserContext.Provider value={user}>
      <SiteInfoContext.Provider value={siteInfo}>
        <PopoverContext.Provider value={popover}>
          <Switch>
            <Route path="/game">
              <Game />
            </Route>
            <Route path="/">
              <div className="site-wrapper">
                <div className="main-container">
                  <Header />
                  <div className="inner-container">
                    <Switch>
                      <Route path="/play" render={() => <Play />} />
                      <Route path="/learn" render={() => <Learn />} />
                      <Route path="/community" render={() => <Community />} />
                      <Route path="/auth" render={() => <Auth />} />
                      <Route path="/user" render={() => <User />} />
                      <Route path="/legal" render={() => <Legal />} />
                      <Route path="/emotes" render={() => <Emotes />} />
                      <Route render={() => <Redirect to="/play" />} />
                    </Switch>
                  </div>
                  <Footer />
                  <AlertList />
                  <Chat />
                </div>
              </div>
            </Route>
          </Switch>
          <Popover />
        </PopoverContext.Provider>
      </SiteInfoContext.Provider>
    </UserContext.Provider>
  );
}

function Header(props) {
  const user = useContext(UserContext);

  return (
    <div className="header">
      <div className="nav-wrapper left">
        <Nav>
          <NavLink to="/play">Lobby</NavLink>
          <NavLink to="/community">Community</NavLink>
        </Nav>
      </div>
      <Link to="/" className="logo-wrapper">
        <div className="logo" />
      </Link>
      <div className="nav-wrapper right">
        <Nav>
          <a href="../learn" target="_self">
            Learn
          </a>
          <a href="../emotes" target="_self">
            Emotes
          </a>
          {!user.loggedIn && (
            <NavLink to="/auth" className="nav-link">
              Log In
            </NavLink>
          )}
          {user.loggedIn && (
            <div className="user-wrapper">
              <SiteNotifs />
              <Link to="/user" className="profile-link">
                <Avatar id={user.id} name={user.name} hasImage={user.avatar} />
              </Link>
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
    else if (window.location.pathname == notif.link.split("?")[0])
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
          {notifs.length == 0 && "No unread notifications"}
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
            (notif) => existingNotifIds.indexOf(notif.id) == -1
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
        <div style={{ "font-size": "xx-large" }}>
          <a href="https://github.com/UltiMafia/Ultimafia">
            <i className="fab fa-github" />
          </a>
          <a href="https://www.patreon.com/Ultimafia/membership">
            <i className="fab fa-patreon" />
          </a>
          <a href="https://ko-fi.com/ultimafia">
            <Icon icon="simple-icons:kofi" />
          </a>
        </div>
        <div>© {year} UltiMafia</div>
        <span>
          Built on code provided by rend, Github repository{""}
          <a
            style={{ color: "var(--theme-color-text)" }}
            href="https://github.com/r3ndd/BeyondMafia-Integration"
          >
            here
          </a>
        </span>
      </div>
    </div>
  );
}

export default Main;
