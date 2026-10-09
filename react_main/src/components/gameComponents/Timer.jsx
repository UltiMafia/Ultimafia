import { useContext, useEffect, useReducer, useState } from "react";
import ChangeHead from "components/gameComponents/ChangeHead";
import { GameContext } from "Contexts";
import { Box } from "@mui/material";
import { hasActivePushSubscription } from "utils/pushNotifications";
import {
  canApplyTimerTime,
  formatSyncedTimer,
  formatTimerTime,
  timerRemainingMs,
  timerTimeAction,
} from "utils/timerSync";

function useTimersReducer() {
  return useReducer((timers, action) => {
    var newTimers = { ...timers };

    switch (action.type) {
      case "create":
        newTimers[action.timer.name] = {
          delay: action.timer.delay,
          time: 0,
          lastSyncTime: 0,
          lastSyncTimestamp: Date.now(),
        };
        break;
      case "clear":
        delete newTimers[action.name];
        break;
      case "update":
        if (
          !canApplyTimerTime(newTimers[action.name]) ||
          !Number.isFinite(action.time)
        ) {
          break;
        }
        newTimers[action.name].time = action.time;
        newTimers[action.name].lastSyncTime = action.time;
        newTimers[action.name].lastSyncTimestamp = Date.now();
        break;
      case "updateAll":
        for (let timerName in newTimers) {
          const t = newTimers[timerName];
          if (t.lastSyncTimestamp != null && canApplyTimerTime(t)) {
            const elapsed = Date.now() - t.lastSyncTimestamp;
            t.time = t.lastSyncTime + elapsed;
          }
        }

        const timer =
          newTimers["pregameCountdown"] ||
          newTimers["secondary"] ||
          newTimers["main"];

        if (!timer || !canApplyTimerTime(timer)) break;

        const remaining = timerRemainingMs(timer);
        if (remaining == null) break;

        const intTime = Math.round(remaining / 1000);
        if (intTime !== timer?.lastTickTime) {
          if (intTime < 16 && intTime > 0) action.playAudio("tick");
        }
        timer.lastTickTime = intTime;

        const canVegPing =
          !timer.lastVegPingDate ||
          new Date() - timer?.lastVegPingDate >= 10 * 1000;
        if (canVegPing && intTime >= 25 && intTime <= 30) {
          action.playAudio("vegPing");
          timer.lastVegPingDate = new Date();
        }
        break;
    }

    return newTimers;
  }, {});
}

export function Timer(props) {
  const game = useContext(GameContext);
  const [timers, updateTimers] = useTimersReducer();
  const [started, setStarted] = useState(null);
  const [winners, setWinners] = useState(null);

  const socket = game.socket;
  const playAudio = game.playAudio;

  useEffect(() => {
    var timerInterval = setInterval(() => {
      updateTimers({
        type: "updateAll",
        playAudio,
      });
    }, 200);

    if (!socket || !socket.on) {
      return () => {
        clearInterval(timerInterval);
      };
    }

    const knownDelay = {};
    const lastInfoRequest = {};

    function requestTimerInfo(name) {
      const now = Date.now();
      const previous = lastInfoRequest[name] || 0;
      if (now - previous < 1000) return;

      lastInfoRequest[name] = now;
      if (socket.send) socket.send("getTimerInfo");
    }

    function onTimerInfo(info) {
      if (
        info &&
        typeof info.name === "string" &&
        Number.isFinite(info.delay)
      ) {
        knownDelay[info.name] = info.delay;
      }

      if (info?.name === "vegKick") {
        playAudio("vegPing");
      }
      updateTimers({
        type: "create",
        timer: info,
      });

      // The server pushes this same event to subscribed players, and the
      // service worker will show it. Firing the in-page one too would notify
      // them twice, so the page defers when a push subscription is active.
      if (
        info.name === "pregameCountdown" &&
        window.Notification &&
        window.Notification.permission === "granted" &&
        !document.hasFocus() &&
        !hasActivePushSubscription()
      ) {
        new Notification("Your game is starting!");
      }
    }

    function onClearTimer(name) {
      delete knownDelay[name];
      updateTimers({
        type: "clear",
        name,
      });
    }

    function onTime(info) {
      const name = info && info.name;
      const decision = timerTimeAction(
        { delay: knownDelay[name] },
        info && info.time
      );

      if (!decision.apply) {
        if (decision.requestInfo && name) requestTimerInfo(name);
        return;
      }

      updateTimers({
        type: "update",
        name,
        time: decision.time,
      });
    }

    function onStart() {
      setStarted(true);
    }

    function onIsStarted(isStarted) {
      setStarted(isStarted);
    }

    function onWinners({ groups }) {
      const newGroups = groups.map((group) => {
        if (group === "Village") return "⛪ Village";
        if (group === "Mafia") return "🔪 Mafia";
        return group;
      });
      setWinners(`${newGroups.join("/")} won!`);
    }

    const timerInfoListener = socket.on("timerInfo", onTimerInfo);
    const clearTimerListener = socket.on("clearTimer", onClearTimer);
    const timeListener = socket.on("time", onTime);
    const startListener = socket.on("start", onStart);
    const isStartedListener = socket.on("isStarted", onIsStarted);
    const winnersListener = socket.on("winners", onWinners);

    return () => {
      clearInterval(timerInterval);
      if (!socket.off) return;

      socket.off("timerInfo", timerInfoListener);
      socket.off("clearTimer", clearTimerListener);
      socket.off("time", timeListener);
      socket.off("start", startListener);
      socket.off("isStarted", isStartedListener);
      socket.off("winners", winnersListener);
    };
  }, [socket]);

  const numPlayers = Object.values(game.players).filter((p) => !p?.left).length;

  const isFilled = numPlayers === game.setup?.total;
  const filledEmoji = isFilled ? " 🔔🔔" : "";
  const fillingTitle = `🔪 ${numPlayers}/${game.setup?.total}${filledEmoji} Ultimafia`;
  const ChangeHeadFilling = <ChangeHead title={fillingTitle} />;

  const currentState = game.history?.states[game.history?.currentState]?.name;
  const isFinished = currentState === "Postgame";

  const mainTimer = formatSyncedTimer(timers && timers.main) || "--:--";
  const ChangeHeadInProgress = (
    <ChangeHead title={`🔪 ${mainTimer} - ${currentState}`} />
  );

  let HeadChanges = null;
  if (!game.review) {
    if (isFinished) {
      if (winners) HeadChanges = <ChangeHead title={winners} />;
      else HeadChanges = <ChangeHead title=" Ultimafia" />;
    } else if (started) HeadChanges = ChangeHeadInProgress;
    else HeadChanges = ChangeHeadFilling;
  }

  var timerName;

  if (!timers["pregameCountdown"] && timers["pregameWait"])
    timerName = "pregameWait";
  else if (game.history.currentState == -1) timerName = "pregameCountdown";
  else if (game.history.currentState == -2) timerName = "postgame";
  else if (timers["secondary"]) timerName = "secondary";
  else if (timers["vegKick"]) timerName = "vegKick";
  else if (timers["vegKickCountdown"]) timerName = "vegKickCountdown";
  else timerName = "main";

  const timer = timers[timerName];
  const remaining = timerRemainingMs(timer);

  let timerContent;
  if (!timer || remaining == null || game.review) {
    timerContent = "--:--";
  } else {
    let time = remaining;

    if (timers["secondary"]) {
      // show main timer if needed
      const mainLeft = timerRemainingMs(timers["main"]);
      if (mainLeft != null) {
        time = Math.min(time, mainLeft);
      }
    }

    timerContent = formatTimerTime(time);
  }

  const isSecondary = timerName === "secondary";
  const isVegKickCountdown = timerName === "vegKickCountdown";
  const isVegKick = timerName === "vegKick";

  return (
    <>
      {HeadChanges}
      <Box className="state-timer" sx={{
        borderWidth: "1px",
        borderColor: isVegKick || isVegKickCountdown ? "error.main" : isSecondary ? "warning.main" : "divider",
        borderStyle: isVegKick ? "solid" : isSecondary || isVegKickCountdown ? "dashed solid" : "solid",
      }}>
        {timerContent}
      </Box>
    </>
  );
}
