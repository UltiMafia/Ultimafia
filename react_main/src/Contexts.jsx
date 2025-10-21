import React, { useEffect, useReducer, useState } from "react";
import { setCaptchaVisible } from "./utils";
import update from "immutability-helper";

import { AlertFadeTimeout, AlertFadeDuration } from "./Constants";
import { useLocation } from "react-router-dom";
import axios from "axios";

export const UserContext = React.createContext();
export const SiteInfoContext = React.createContext();
export const GameContext = React.createContext();

export function UserProvider({ children, setUserLoading  }) {
  const location = useLocation();
  const [inGame, setInGame] = useState(null);
  const [user, setUser] = useState({
    loggedIn: false,
    loaded: false,
    perms: {},
    rank: 0,
    blockedUsers: [],
    settings: {},
    itemsOwned: {},
  });

  function clear() {
    setUser({
      loggedIn: false,
      loaded: true,
      perms: {},
      rank: 0,
      blockedUsers: [],
    });
  }

  function blockUserToggle(userId) {
    var userIndex = user.blockedUsers.indexOf(userId);

    if (userIndex === -1) {
      setUser(
        update(user, {
          blockedUsers: {
            $push: [userId],
          },
        })
      );
    } else {
      setUser(
        update(user, {
          blockedUsers: {
            $splice: [[userIndex, 1]],
          },
        })
      );
    }
  }

  function updateSetting(prop, value) {
    setUser(
      update(user, {
        settings: {
          [prop]: {
            $set: value,
          },
        },
      })
    );
  }

  user.gamesPlayed = user.gamesPlayed || 0;
  user.canPlayRanked = user.gamesPlayed >= 5;

  const userVal = {
    ...user,
    state: user,
    set: setUser,
    blockUserToggle,
    updateSetting,
    clear,
    inGame,
    setInGame,
  };

  useEffect(() => {
    let onlineInterval = null;

    axios.get("/api/user/info").then(res => {
      if (res.data.id) {
        setCaptchaVisible(false);

        axios.defaults.headers.common["x-csrf"] = res.data.csrf;
        axios.post("/api/user/online");

        res.data.loggedIn = true;
        res.data.loaded = true;
        res.data.rank = Number(res.data.rank);
        setUser(res.data);

        var referrer = window.localStorage.getItem("referrer");

        if (referrer) {
          axios.post("/api/user/referred", { referrer });
          window.localStorage.removeItem("referrer");
        }
      } else {
        clear();
        setCaptchaVisible(true);
      }

      if (res.data.nameChanged === false) {
        siteInfo.showAlert(
          () => (
            <div>
              New account created, you can change your username once in your{" "}
              <MuiLink href={`/user/settings`}>settings</MuiLink>.
            </div>
          ),
          "basic",
          true
        );
      }

      if (res.data.inGame) {
        // TODO make this more accurate via websockets that communicate updates to this in real time
        setInGame(res.data.inGame);
      }

      setUserLoading(false);

      onlineInterval = setInterval(() => {
        axios.post("/api/user/online");
      }, 1000 * 30);
    });

    return () => {
      if (onlineInterval) {
        clearInterval(onlineInterval);
      }
    };
  }, []);

  return (
    <UserContext.Provider value={userVal}>
      {children}
    </UserContext.Provider>
  );
}

export function SiteInfoProvider({ children, setSiteInfoLoading }) {
  let cacheVal = localStorage.getItem("cacheVal");
  if (!cacheVal) {
    cacheVal = Date.now();
    localStorage.setItem("cacheVal", cacheVal);
  }

  const [siteInfo, updateSiteInfo] = useReducer((siteInfo, action) => {
    var newSiteInfo;

    switch (action.type) {
      case "setProp":
        if (siteInfo[action.prop] !== action.value) {
          newSiteInfo = update(siteInfo, {
            [action.prop]: {
              $set: action.value,
            },
          });
        }
        break;
      case "showAlert":
        if (typeof action.text == "function")
          action.text = action.text(siteInfo.alerts.length);

        if (siteInfo.alerts.length < 5) {
          newSiteInfo = update(siteInfo, {
            alerts: {
              $push: [
                {
                  text: action.text,
                  type: action.alertType || "",
                  id: action.id,
                },
              ],
            },
          });
        }
        break;
      case "hideAlert":
        newSiteInfo = update(siteInfo, {
          alerts: {
            $splice: [[action.index, 1]],
          },
        });
        break;
      case "hideAlertById":
        for (let i = 0; i < siteInfo.alerts.length; i++) {
          if (siteInfo.alerts[i].id === action.id) {
            newSiteInfo = update(siteInfo, {
              alerts: {
                $splice: [[i, 1]],
              },
            });
            break;
          }
        }
        break;
      case "hideAllAlerts":
        newSiteInfo = update(siteInfo, {
          alerts: {
            $set: [],
          },
        });
        break;
    }

    return newSiteInfo || siteInfo;
  }, {
    alerts: [],
    cacheVal,
  });

  function showAlert(text, alertType, noFade) {
    var alertId = Math.random();

    updateSiteInfo({
      type: "showAlert",
      text,
      alertType,
      id: alertId,
    });

    if (!noFade) setTimeout(() => fadeAlert(alertId), AlertFadeTimeout);
  }

  function hideAlert(index) {
    updateSiteInfo({
      type: "hideAlert",
      index,
    });
  }

  function hideAllAlerts() {
    updateSiteInfo({
      type: "hideAllAlerts",
    });
  }

  function clearCache() {
    var cacheVal = Date.now();
    setSiteInfoProp({ type: "setProp", prop: "cacheVal", value: cacheVal });
    window.localStorage.setItem("cacheVal", cacheVal);
  }

  function fadeAlert(id) {
    var alert = document.getElementById(`alert-id-${id}`);

    if (!alert) return;

    alert.style.opacity = 0;

    setTimeout(() => {
      updateSiteInfo({
        type: "hideAlertById",
        id,
      });
    }, AlertFadeDuration);
  }

  const siteInfoVal = {
    ...siteInfo,
    showAlert,
    hideAlert,
    hideAllAlerts,
    clearCache,
  };

  useEffect(() => {
    Promise.all([
      axios.get("/api/roles/all").then(res => updateSiteInfo({ type: "setProp", prop: "roles", value: res.data })),
      axios.get("/api/roles/raw").then(res => updateSiteInfo({ type: "setProp", prop: "rolesRaw", value: res.data })),
      axios.get("/api/roles/modifiers").then(res => updateSiteInfo({ type: "setProp", prop: "modifiers", value: res.data })),
      axios.get("/api/roles/gamesettings").then(res => updateSiteInfo({ type: "setProp", prop: "gamesettings", value: res.data })),
    ]).then(() => {
      setSiteInfoLoading(false);
    });
  }, []);

  return (
    <SiteInfoContext.Provider value={siteInfoVal}>
      {children}
    </SiteInfoContext.Provider>
  );
}
