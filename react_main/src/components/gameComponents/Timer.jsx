import { useContext, useEffect, useReducer, useState } from "react";
import ChangeHead from "components/gameComponents/ChangeHead";
import { GameContext } from "Contexts";

function formatTimerTime(time) {
  if (time > 0) time = Math.round(time / 1000);
  else time = 0;

  const minutes = String(Math.floor(time / 60)).padStart(2, "0");
  const seconds = String(time % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function useTimersReducer() {
  return useReducer((timers, action) => {
    var newTimers = { ...timers };

    switch (action.type) {
      case "create":
        newTimers[action.timer.name] = {
          delay: action.timer.delay,
          time: 0,
        };
        break;
      case "clear":
        delete newTimers[action.name];
        break;
      case "update":
        if(!(action.name in newTimers)) {
          newTimers[action.name] = {
            time: 0,
          };
        }
        newTimers[action.name].time = action.time;
        break;
      case "updateAll":
        // for (var timerName in newTimers) newTimers[timerName].time += 200;

        const timer =
          newTimers["pregameCountdown"] ||
          newTimers["secondary"] ||
          newTimers["main"];

        if (!timer) break;

        const intTime = Math.round((timer.delay - timer.time) / 1000);
        if (intTime !== timer?.lastTickTime) {
          if (intTime < 16 && intTime > 0) action.playAudio("tick");
        }
        timer.lastTickTime = intTime;

        const canVegPing =
          !timer.lastVegPingDate ||
          new Date() - timer?.lastVegPingDate >= 10 * 1000; // note: 10 * 1000 might not work, cuz lastVegPingDate becomes null upon reset/restart anyway...
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

    if (socket && socket.on) {
      socket.on("timerInfo", (info) => {
        if (info?.name === "vegKick") {
          playAudio("vegPing");
        }
        updateTimers({
          type: "create",
          timer: info,
        });

        if (
          info.name === "pregameCountdown" &&
          Notification &&
          Notification.permission === "granted" &&
          !document.hasFocus()
        ) {
          new Notification("Your game is starting!");
        }
      });

      socket.on("clearTimer", (name) => {
        updateTimers({
          type: "clear",
          name,
        });
      });

      socket.on("time", (info) => {
        updateTimers({
          type: "update",
          name: info.name,
          time: info.time,
        });
      });

      socket.on("start", () => setStarted(true));

      socket.on("isStarted", (isStarted) => setStarted(isStarted));

      socket.on("winners", ({ groups }) => {
        const newGroups = groups.map((group) => {
          if (group === "Village") return "⛪ Village";
          if (group === "Mafia") return "🔪 Mafia";
          return group;
        });
        setWinners(`${newGroups.join("/")} won!`);
      });
    }

    // cleanup
    return () => {
      clearInterval(timerInterval);
    };
  }, []);

  const numPlayers = Object.values(game.players).filter((p) => !p?.left).length;

  const isFilled = numPlayers === game.setup?.total;
  const filledEmoji = isFilled ? " 🔔🔔" : "";
  const fillingTitle = `🔪 ${numPlayers}/${game.setup?.total}${filledEmoji} Ultimafia`;
  const ChangeHeadFilling = <ChangeHead title={fillingTitle} />;

  const currentState = game.history?.states[game.history?.currentState]?.name;
  const isFinished = currentState === "Postgame";

  const mainTimer = formatTimerTime(timers?.main?.delay - timers?.main?.time);
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

  if (!timer || game.review) return <div className="state-timer">{"--:--"}</div>;

  var time = timer.delay - timer.time;

  if (timers["secondary"]) {
    // show main timer if needed
    const mainTimer = timers["main"];
    if (mainTimer) {
      var mainTime = mainTimer.delay - mainTimer.time;
      time = Math.min(time, mainTime);
    }
  }

  time = formatTimerTime(time);

  if (timerName === "vegKick") {
    return <div className="state-timer">Kicking in {time}</div>;
  }
  return (
    <>
      {HeadChanges}
      <div className="state-timer">{time}</div>
    </>
  );
}