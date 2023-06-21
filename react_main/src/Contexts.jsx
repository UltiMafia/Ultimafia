import React, { useState, useReducer } from "react";
import update from "immutability-helper";

      import { AlertFadeTimeout, AlertFadeDuration } from "./Constants";

export const UserContext = React.createContext();
export const SiteInfoContext = React.createContext();
export const PopoverContext = React.createContext();
export const GameContext = React.createContext();

export function useSiteInfo(initData) {
  const [siteInfo, updateSiteInfo] = useReducer((siteInfo, action) => {
    var newSiteInfo;

    switch (action.type) {
      case "setProp":
        if (siteInfo[action.prop] != action.value) {
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
          if (siteInfo.alerts[i].id == action.id) {
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
  }, initData);

  function setSiteInfoProp(prop, value) {
    updateSiteInfo({
      type: "setProp",
      prop,
      value,
    });
  }

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
    setSiteInfoProp("cacheVal", cacheVal);
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

  return {
    ...siteInfo,
    update: setSiteInfoProp,
    showAlert,
    hideAlert,
    hideAllAlerts,
    clearCache,
  };
}
