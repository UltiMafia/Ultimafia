import React, { useEffect, useReducer, useState, useContext } from "react";
import { setCaptchaVisible } from "./utils";
import update from "immutability-helper";
import MuiLink from "@mui/material/Link";

import { AlertFadeTimeout, AlertFadeDuration } from "./Constants";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { GlobalStyles } from "@mui/material";

export const UserContext = React.createContext();
export const SiteInfoContext = React.createContext();
export const GameContext = React.createContext();

export function UserProvider({ children, setUserLoading }) {
  const location = useLocation();
  const siteInfo = useContext(SiteInfoContext);
  const [inGame, setInGame] = useState(null);
  const [dpiCorrection, setDpiCorrection] = useState(undefined);
  const [iconFilter, setIconFilter] = useState({});
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

    axios.get("/api/user/info").then((res) => {
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
        siteInfo?.showAlert(
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

  useEffect(() => {
    if (user.settings && user.settings.expHighDpiCorrection) {
      // VERY EXPERIMENTAL: counteract non-integer values of DPI scaling because they make role icons look weird
      if (window.devicePixelRatio !== undefined) {
        const dpiScaling = window.devicePixelRatio;
        const dpiDecimal = dpiScaling % 1;
        if (dpiDecimal > 0) {
          console.log(
            "Experimental DPI non-integer scaling correction is enabled"
          );
          const dpiScalingInt = dpiScaling - dpiDecimal;
          setDpiCorrection(`${(16 * dpiScalingInt) / dpiScaling}px`);
        }
      }
    }
    if (user.settings && user.settings.iconFilter) {
      const ICON_FILTER_CLASS_LIST =
        '.role, .collapsIconWrapper, .expandIconWrapper, .game-icon, .gamesetting, .closed-role-count, .game-state-icon, .um-coin, img[alt=Kudos], img[alt=Karma], img[alt=Achievements], img[alt=Achievements], img[alt="Daily Challenges"], img[alt=Fortune], img[alt=Misfortune]';
      const ICON_FILTER_CLASS_LIST_WITH_FA = `${ICON_FILTER_CLASS_LIST}, .fas`;
      switch (user.settings.iconFilter) {
        case "none": {
          setIconFilter({});
          break;
        }
        case "highContrast": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST_WITH_FA]: { filter: "contrast(200%)" },
          });
          break;
        }
        case "sepia": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST_WITH_FA]: { filter: "sepia(60%)" },
          });
          break;
        }
        case "inverted": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST_WITH_FA]: { filter: "invert(100%)" },
          });
          break;
        }
        case "grayscale": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST_WITH_FA]: { filter: "grayscale(100%)" },
          });
          break;
        }
        case "colorful": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST_WITH_FA]: { filter: "saturate(200%)" },
          });
          break;
        }
        case "elevated": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST_WITH_FA]: {
              filter: "drop-shadow(.04rem .04rem 0 #000)",
            },
          });
          break;
        }
        case "upsideDown": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST_WITH_FA]: { transform: "scaleY(-1)" },
          });
          break;
        }
        case "hallucination": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST]: {
              position: "relative",

              "&:before, &:after": {
                display: "block",
                content: "''",
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                bottom: "0",
                background: "inherit",
                backgroundBlendMode: "multiply",
                transform: "scale(1.1)",
              },

              "&:before": {
                filter: "hue-rotate(120deg)",
                transformOrigin: "top left",
              },

              "&:after": {
                filter: "hue-rotate(240deg)",
                transformOrigin: "bottom right",
              },
            },
          });
          break;
        }
        case "green": {
          setIconFilter({
            [ICON_FILTER_CLASS_LIST_WITH_FA]: {
              filter:
                "sepia(1) contrast(200%) saturate(400%) hue-rotate(80deg)",
            },
          });
          break;
        }
        default: {
          console.error("Invalid icon filter, this should never happen");
          break;
        }
      }
    }
  }, [user.settings]);

  return (
    <>
      <GlobalStyles
        styles={{
          html: {
            fontSize: dpiCorrection,
          },
          ...iconFilter,
        }}
      />
      <UserContext.Provider value={userVal}>{children}</UserContext.Provider>
    </>
  );
}

export function SiteInfoProvider({ children, setSiteInfoLoading }) {
  let cacheVal = localStorage.getItem("cacheVal");
  if (!cacheVal) {
    cacheVal = Date.now();
    localStorage.setItem("cacheVal", cacheVal);
  }

  const [siteInfo, updateSiteInfo] = useReducer(
    (siteInfo, action) => {
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
    },
    {
      alerts: [],
      cacheVal,
    }
  );

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
    updateSiteInfo({ type: "setProp", prop: "cacheVal", value: cacheVal });
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
      axios
        .get("/api/roles/all")
        .then((res) =>
          updateSiteInfo({ type: "setProp", prop: "roles", value: res.data })
        ),
      axios
        .get("/api/roles/raw")
        .then((res) =>
          updateSiteInfo({ type: "setProp", prop: "rolesRaw", value: res.data })
        ),
      axios.get("/api/roles/modifiers").then((res) =>
        updateSiteInfo({
          type: "setProp",
          prop: "modifiers",
          value: res.data,
        })
      ),
      axios.get("/api/roles/gamesettings").then((res) =>
        updateSiteInfo({
          type: "setProp",
          prop: "gamesettings",
          value: res.data,
        })
      ),
    ]).then(() => {
      setSiteInfoLoading(false);
    });
  }, []);

  const ready =
    siteInfoVal.roles &&
    siteInfoVal.rolesRaw &&
    siteInfoVal.modifiers &&
    siteInfoVal.gamesettings;

  return (
    <SiteInfoContext.Provider value={siteInfoVal}>
      {ready && children}
    </SiteInfoContext.Provider>
  );
}
