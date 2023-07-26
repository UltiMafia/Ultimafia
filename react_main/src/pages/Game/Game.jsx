import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useReducer,
  useContext,
  useRef,
} from "react";
import { useParams, Switch, Route, Redirect } from "react-router-dom";
import update from "immutability-helper";
import axios from "axios";
// import AgoraRTC from "agora-rtc-sdk-ng";
import ReactLoading from "react-loading";

import { linkify, UserText } from "../../components/Basic";
import LoadingPage from "../Loading";
import MafiaGame from "./MafiaGame";
import SplitDecisionGame from "./SplitDecisionGame";
import ResistanceGame from "./ResistanceGame";
import OneNightGame from "./OneNightGame";
import GhostGame from "./GhostGame";
import AcrotopiaGame from "./AcrotopiaGame";
import SecretHitlerGame from "./SecretHitlerGame";
import {
  GameContext,
  PopoverContext,
  SiteInfoContext,
  UserContext,
} from "../../Contexts";
import Dropdown, { useDropdown } from "../../components/Dropdown";
import Setup from "../../components/Setup";
import { NameWithAvatar } from "../User/User";
import { ClientSocket as Socket } from "../../Socket";
import { RoleCount, RolePrediction } from "../../components/Roles";
import Form, { useForm } from "../../components/Form";
import { Modal } from "../../components/Modal";
import { useErrorAlert } from "../../components/Alerts";
import {
  MaxGameMessageLength,
  MaxTextInputLength,
  MaxWillLength,
} from "../../Constants";
import { textIncludesSlurs } from "../../lib/profanity";

import "../../css/game.css";
import { adjustColor, flipTextColor } from "../../utils";
import EmotePicker from "../../components/EmotePicker";
import JottoGame from "./JottoGame";

export default function Game() {
  return (
    <Switch>
      <Route
        exact
        path="/game/:gameId"
        render={(props) => <GameWrapper key={props.match.params.gameId} />}
      />
      <Route
        exact
        path="/game/:gameId/review"
        render={() => <GameWrapper review />}
      />
      <Redirect to="/play" />
    </Switch>
  );
}

function GameWrapper(props) {
  const [loaded, setLoaded] = useState(false);
  const [leave, setLeave] = useState(false);
  const [finished, setFinished] = useState(false);
  const [port, setPort] = useState();
  const [gameType, setGameType] = useState();
  const [token, setToken] = useState();
  const [socket, setSocket] = useState({});
  const [connected, setConnected] = useState(0);
  const [setup, setSetup] = useState();
  const [options, setOptions] = useState({});
  const [emojis, setEmojis] = useState({});
  const [history, updateHistory] = useHistoryReducer();
  const [stateViewing, updateStateViewing] = useStateViewingReducer(history);
  const [players, updatePlayers] = usePlayersReducer();
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isSpectator, setIsSpectator] = useState(false);
  const [self, setSelf] = useState();
  const [lastWill, setLastWill] = useState("");
  const [timers, updateTimers] = useTimersReducer();
  const [settings, updateSettings] = useSettingsReducer();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFirstGameModal, setShowFirstGameModal] = useState(false);
  const [speechFilters, setSpeechFilters] = useState({
    from: "",
    contains: "",
  });
  const [isolationEnabled, setIsolationEnabled] = useState(false);
  const [isolatedPlayers, setIsolatedPlayers] = useState(new Set());
  const [rolePredictions, setRolePredictions] = useState({});
  const [activeVoiceChannel, setActiveVoiceChannel] = useState();
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [rehostId, setRehostId] = useState();
  const [dev, setDev] = useState(false);

  const playersRef = useRef();
  const selfRef = useRef();
  // const agoraClient = useRef();
  const localAudioTrack = useRef();
  const noLeaveRef = useRef();

  const [activity, updateActivity] = useActivity(localAudioTrack);
  const [playAudio, loadAudioFiles, stopAudio, stopAudios, setVolume] =
    useAudio(settings);
  const siteInfo = useContext(SiteInfoContext);
  const popover = useContext(PopoverContext);
  const errorAlert = useErrorAlert();
  const { gameId } = useParams();

  const audioFileNames = ["bell", "ping", "tick"];
  const audioLoops = [false, false, false];
  const audioOverrides = [false, false, false];
  const audioVolumes = [1, 1, 1];

  const togglePlayerIsolation = (playerId) => {
    const newIsolatedPlayers = new Set(isolatedPlayers);

    if (newIsolatedPlayers.has(playerId)) {
      newIsolatedPlayers.delete(playerId);
    } else {
      newIsolatedPlayers.add(playerId);
    }
    setIsolatedPlayers(newIsolatedPlayers);
  };

  function toggleRolePrediction(playerId) {
    return function (prediction) {
      let newRolePredictions = rolePredictions;
      newRolePredictions[playerId] = prediction;
      if (prediction === null) {
        delete newRolePredictions[playerId];
      }
      setRolePredictions(newRolePredictions);
    };
  }

  useEffect(() => {
    if (token == null) return;

    var socketURL;

    if (process.env.REACT_APP_USE_PORT == "true")
      socketURL = `${process.env.REACT_APP_SOCKET_PROTOCOL}://${process.env.REACT_APP_SOCKET_URI}:${port}`;
    else
      socketURL = `${process.env.REACT_APP_SOCKET_PROTOCOL}://${process.env.REACT_APP_SOCKET_URI}/${port}`;

    var newSocket = new Socket(socketURL);
    newSocket.on("connected", () => setConnected(connected + 1));
    newSocket.on("disconnected", () => setConnected(connected - 1));
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.clear();
    };
  }, [token]);

  useEffect(() => {
    if (finished) {
      socket.clear();
      setSocket({ send: () => {} });
    }
  }, [finished]);

  useEffect(() => {
    updateSettings({ type: "load" });

    if (!props.review) {
      document.title = `Game ${gameId} | UltiMafia`;
      loadAudioFiles(audioFileNames, audioLoops, audioOverrides, audioVolumes);
      requestNotificationAccess();

      var timerInterval = setInterval(() => {
        updateTimers({
          type: "updateAll",
          playAudio,
        });
      }, 1000);

      function onKeydown() {
        var speechInput = document.getElementById("speechInput");
        var activeElName = document.activeElement.tagName;

        if (
          speechInput &&
          activeElName != "INPUT" &&
          activeElName != "TEXTAREA"
        )
          speechInput.focus();
      }

      window.addEventListener("keydown", onKeydown);

      return () => {
        window.removeEventListener("keydown", onKeydown);

        clearInterval(timerInterval);
        stopAudio();
        // agoraDisconnect();

        if (localAudioTrack.current) localAudioTrack.current.close();
      };
    } else {
      document.title = `Review Game ${gameId} | UltiMafia`;

      axios
        .get(`/game/${gameId}/review/data`)
        .then((res) => {
          var data = res.data;

          if (data.broken) {
            setLeave(true);
            errorAlert("Game not found.");
            return;
          }

          setGameType(data.type);
          setSetup(data.setup);

          setOptions({
            ranked: data.ranked,
            spectating: data.spectating,
            private: false,
          });

          updateHistory({
            type: "set",
            history: JSON.parse(data.history),
          });

          var players = {};

          for (let i in data.players) {
            players[data.players[i]] = {
              id: data.players[i],
              name: data.names[i],
              userId: data.users[i] ? data.users[i].id : "",
              avatar: data.users[i] ? data.users[i].avatar : false,
              textColor: data.users[i] && data.users[i].settings.textColor,
              nameColor: data.users[i] && data.users[i].settings.nameColor,
              left: data.left.indexOf(data.players[i]) != -1,
            };
          }

          updatePlayers({
            type: "set",
            players,
          });

          setLoaded(true);
        })
        .catch((e) => {
          setLeave(true);
          errorAlert(e);
        });
    }
  }, []);

  useEffect(() => {
    selfRef.current = self;
  }, [self]);

  useEffect(() => {
    if (stateViewing == null) updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // useEffect(() => {
  //   if (!options.voiceChat || props.review) return;

  //   if (!activeVoiceChannel) {
  //     agoraDisconnect();
  //     return;
  //   }

  //   var state = history.states[history.currentState];
  //   var meeting = state && state.meetings[activeVoiceChannel];
  //   var vcToken = meeting && meeting.vcToken;

  //   if (vcToken) agoraConnect(activeVoiceChannel, vcToken);
  // }, [activeVoiceChannel]);

  useEffect(() => {
    if (socket.readyState != 1) {
      if (
        (socket.readyState == null || socket.readyState == 3) &&
        !leave &&
        !finished &&
        !props.review
      ) {
        getConnectionInfo();
      }

      return;
    }

    if (token) socket.send("auth", token);
    else
      socket.send("join", {
        gameId,
        guestId: window.localStorage.getItem("cacheVal"),
      });

    socket.on("authSuccess", () => {
      socket.send("join", {
        gameId,
        isBot: window.location.search == "?bot",
      });
    });

    socket.on("loaded", () => {
      setLoaded(true);
    });

    socket.on("setup", (data) => {
      setSetup(data);
    });

    socket.on("options", (options) => {
      setOptions(options);
    });

    socket.on("emojis", (emojis) => {
      setEmojis(emojis);
    });

    socket.on("state", (state) => {
      updateHistory({ type: "addState", state: state });
    });

    socket.on("history", (history) => {
      updateHistory({
        type: "set",
        history,
      });
    });

    socket.on("players", (players) => {
      updatePlayers({
        type: "set",
        players,
      });
    });

    socket.on("playerJoin", (player) => {
      updatePlayers({
        type: "add",
        player,
      });
    });

    socket.on("playerLeave", (playerId) => {
      updatePlayers({
        type: "remove",
        playerId,
      });
    });

    socket.on("spectatorCount", (count) => {
      setSpectatorCount(count);
    });

    socket.on("self", (playerId) => {
      setSelf(playerId);
    });

    socket.on("reveal", (info) => {
      toggleRolePrediction(info.playerId)(null);

      updateHistory({
        type: "reveal",
        playerId: info.playerId,
        role: info.role,
      });
    });

    socket.on("death", (playerId) => {
      updateHistory({
        type: "death",
        playerId,
      });
    });

    socket.on("revival", (playerId) => {
      updateHistory({
        type: "revival",
        playerId,
      });
    });

    socket.on("meeting", (meeting) => {
      updateHistory({
        type: "addMeeting",
        meeting,
      });
    });

    socket.on("members", (info) => {
      updateHistory({
        type: "meetingMembers",
        meetingId: info.meetingId,
        members: info.members,
      });
    });

    socket.on("leftMeeting", (meetingId) => {
      updateHistory({
        type: "removeMeeting",
        meetingId,
      });
    });

    socket.on("stateEvents", (stateEvents) => {
      updateHistory({
        type: "stateEvents",
        stateEvents,
      });
    });

    socket.on("message", (message) => {
      updateHistory({
        type: "addMessage",
        message,
      });

      const pings = message.content.match(/@[\w-]*/gm) || [];

      if (
        selfRef.current &&
        playersRef.current[selfRef.current] &&
        (pings.indexOf("@" + playersRef.current[selfRef.current].name) != -1 ||
          pings.indexOf("@everyone") != -1)
      ) {
        playAudio("ping");
      }
    });

    socket.on("quote", (quote) => {
      updateHistory({
        type: "addQuote",
        quote,
      });
    });

    socket.on("vote", (vote) => {
      updateHistory({
        type: "vote",
        vote,
      });
    });

    socket.on("unvote", (info) => {
      updateHistory({
        type: "unvote",
        info,
      });
    });

    socket.on("lastWill", (will) => {
      setLastWill(will);
    });

    socket.on("firstGame", () => {
      setShowFirstGameModal(true);
    });

    socket.on("timerInfo", (info) => {
      updateTimers({
        type: "create",
        timer: info,
      });

      if (
        info.name == "pregameCountdown" &&
        Notification &&
        Notification.permission == "granted" &&
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

    socket.on("typing", (info) => {
      updateActivity({
        type: "typing",
        playerId: info.playerId,
        meetingId: info.meetingId,
      });
    });

    socket.on("isSpectator", () => {
      setIsSpectator(true);
    });

    socket.on("left", () => {
      if (!noLeaveRef.current) {
        setLeave(true);
        siteInfo.hideAllAlerts();
      }
    });

    socket.on("finished", () => {
      setFinished(true);
    });

    socket.on("error", (error) => {
      setLeave(true);
      errorAlert(error);
    });

    socket.on("dev", () => {
      setDev(true);
    });
  }, [connected]);

  function getConnectionInfo() {
    axios
      .get(`/game/${gameId}/connect`)
      .then((res) => {
        setGameType(res.data.type);
        setPort(res.data.port);
        setToken(res.data.token || false);
      })
      .catch((e) => {
        var msg = e && e.response && e.response.data;

        if (msg == "Game not found.") setLeave("review");
        else {
          setLeave(true);
          errorAlert(e);
        }
      });
  }

  // function createAgoraClient() {
  //   if (agoraClient.current) return;

  //   agoraClient.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  //   agoraClient.current.on("user-published", async (user, mediaType) => {
  //     if (mediaType != "audio") return;

  //     await agoraClient.current.subscribe(user, mediaType);

  //     if (deafened) user.audioTrack.setVolume(0);

  //     user.audioTrack.play();
  //   });

  //   agoraClient.current.on("user-unpublished", (user) => {
  //     var audioContainer = document.getElementById(user.uid);

  //     if (audioContainer) audioContainer.remove();
  //   });
  // }

  // async function agoraConnect(meetingId, token) {
  //   try {
  //     if (!agoraClient.current) createAgoraClient();
  //     else await agoraDisconnect();

  //     await agoraClient.current.join(
  //       process.env.REACT_APP_AGORA_ID,
  //       meetingId,
  //       token,
  //       self
  //     );

  //     if (!localAudioTrack.current) {
  //       localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();

  //       if (muted) localAudioTrack.current.setVolume(0);
  //     }

  //     await agoraClient.current.publish([localAudioTrack.current]);
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }

  // async function agoraDisconnect() {
  //   if (!agoraClient.current) return;

  //   agoraClient.current.remoteUsers.forEach((user) => {
  //     let audioContainer = document.getElementById(user.uid);

  //     if (audioContainer) audioContainer.remove();
  //   });

  //   await agoraClient.current.leave();
  // }

  if (leave == "review") return <Redirect to={`/game/${gameId}/review`} />;
  else if (leave) return <Redirect to="/play" />;
  else if (rehostId) return <Redirect to={`/game/${rehostId}`} />;
  else if (!loaded || stateViewing == null)
    return (
      <div className="game">
        <LoadingPage />
      </div>
    );
  else {
    const context = {
      socket: socket,
      review: props.review,
      setup: setup,
      history: history,
      updateHistory: updateHistory,
      stateViewing: stateViewing,
      updateStateViewing: updateStateViewing,
      self: self,
      isSpectator: isSpectator,
      players: players,
      updatePlayers: updatePlayers,
      timers: timers,
      options: options,
      spectatorCount: spectatorCount,
      lastWill: lastWill,
      emojis: emojis,
      setLeave: setLeave,
      finished: finished,
      settings: settings,
      updateSettings: updateSettings,
      setShowSettingsModal: setShowSettingsModal,
      speechFilters: speechFilters,
      setSpeechFilters: setSpeechFilters,
      isolationEnabled,
      setIsolationEnabled,
      isolatedPlayers,
      togglePlayerIsolation,
      rolePredictions,
      toggleRolePrediction,
      loadAudioFiles: loadAudioFiles,
      playAudio: playAudio,
      stopAudio: stopAudio,
      stopAudios: stopAudios,
      setRehostId: setRehostId,
      // agoraClient: agoraClient,
      localAudioTrack: localAudioTrack,
      setActiveVoiceChannel: setActiveVoiceChannel,
      activity: activity,
      muted: muted,
      setMuted: setMuted,
      deafened: deafened,
      setDeafened: setDeafened,
      noLeaveRef,
      dev: dev,
    };

    return (
      <GameContext.Provider value={context}>
        <div className="game no-highlight">
          <SettingsModal
            showModal={showSettingsModal}
            setShowModal={setShowSettingsModal}
            settings={settings}
            updateSettings={updateSettings}
          />
          <FirstGameModal
            showModal={showFirstGameModal}
            setShowModal={setShowFirstGameModal}
          />
          {gameType == "Mafia" && <MafiaGame />}
          {gameType == "Resistance" && <ResistanceGame />}
          {gameType == "Split Decision" && <SplitDecisionGame />}
          {gameType == "One Night" && <OneNightGame />}
          {gameType == "Ghost" && <GhostGame />}
          {gameType == "Jotto" && <JottoGame />}
          {gameType == "Acrotopia" && <AcrotopiaGame />}
          {gameType == "Secret Hitler" && <SecretHitlerGame />}
        </div>
      </GameContext.Provider>
    );
  }
}

export function useSocketListeners(listeners, socket) {
  useEffect(() => {
    if (!socket.on) return;

    listeners(socket);
  }, [socket]);
}

export function TopBar(props) {
  const { gameId } = useParams();
  const infoRef = useRef();
  const errorAlert = useErrorAlert();
  const siteInfo = useContext(SiteInfoContext);
  const popover = useContext(PopoverContext);
  const hideStateSwitcher = props.hideStateSwitcher;

  function onInfoClick(e) {
    e.stopPropagation();
    popover.onClick(
      `/game/${gameId}/info`,
      "game",
      infoRef.current,
      `Game ${gameId}`
    );
  }

  function onLogoClick() {
    window.open(process.env.REACT_APP_URL, "_blank");
  }

  function onSettingsClick() {
    props.setShowSettingsModal(true);
  }

  function onTestClick() {
    for (let i = 0; i < props.setup.total - 1; i++)
      window.open(window.location + "?bot");
  }

  function onLeaveGameClick() {
    const shouldLeave =
      props.finished ||
      props.review ||
      window.confirm("Are you sure you wish to leave?");

    if (!shouldLeave) return;

    if (props.finished) siteInfo.hideAllAlerts();

    if (props.socket.on) props.socket.send("leave");
    else props.setLeave(true);
  }

  function onRehostGameClick() {
    props.noLeaveRef.current = true;

    if (props.socket.on) props.socket.send("leave");

    setTimeout(() => {
      var stateLengths = {};

      for (let stateName in props.options.stateLengths)
        stateLengths[stateName] = props.options.stateLengths[stateName] / 60000;

      axios
        .post("/game/host", {
          rehost: gameId,
          gameType: props.gameType,
          setup: props.setup.id,
          lobby: props.options.lobby,
          private: props.options.private,
          spectating: props.options.spectating,
          hideClosedRoles: props.options.hideClosedRoles,
          guests: props.options.guests,
          ranked: props.options.ranked,
          stateLengths: stateLengths,
          ...props.options.gameTypeOptions,
        })
        .then((res) => props.setRehostId(res.data))
        .catch((e) => {
          props.noLeaveRef.current = false;
          errorAlert(e);
        });
    }, 500);
  }

  return (
    <div className="top">
      <div className="game-name-wrapper" onClick={onLogoClick}>
        {props.gameName}
      </div>
      <div className="state-wrapper">
        {!hideStateSwitcher && (
          <StateSwitcher
            history={props.history}
            stateViewing={props.stateViewing}
            updateStateViewing={props.updateStateViewing}
          />
        )}
        {props.timer}
      </div>
      <div className="misc-wrapper">
        {props.setup && <Setup setup={props.setup} maxRolesCount={10} />}

        <div className="misc-left">
          <div className="misc-buttons">
            {props.options.voiceChat && (
              <i className="misc-icon fas fa-microphone" />
            )}
            <i
              className="misc-icon fas fa-info-circle"
              ref={infoRef}
              onClick={onInfoClick}
            />
            <i className="misc-icon fas fa-cog" onClick={onSettingsClick} />
            {props.dev && (
              <i className="misc-icon fas fa-vial" onClick={onTestClick} />
            )}
          </div>
          <div className="options">
            {!props.options.private && !props.review && (
              <i className="fas fa-lock-open" />
            )}
            {props.options.private && !props.review && (
              <i className="fas fa-lock" />
            )}
            {!props.review && (
              <div className="player-count">
                <i className="fas fa-users" />
                {
                  Object.values(props.players).filter((p) => !p.left).length
                } / {props.setup.total}
              </div>
            )}
            {!props.options.spectating && !props.review && (
              <div className="no-spectator">
                <i className="fas fa-eye-slash" />
              </div>
            )}
            {props.options.spectating && !props.review && (
              <div className="spectator-count">
                <i className="fas fa-eye" />
                {props.spectatorCount}
              </div>
            )}
          </div>
        </div>
        <div className="btn btn-theme leave-game" onClick={onLeaveGameClick}>
          Leave
        </div>
        {!props.review && props.history.currentState == -2 && (
          <div
            className="btn btn-theme-sec rehost-game"
            onClick={onRehostGameClick}
          >
            Rehost
          </div>
        )}
      </div>
    </div>
  );
}

export function ThreePanelLayout(props) {
  return (
    <div className="main">
      <div className="left-panel panel with-radial-gradient">
        {props.leftPanelContent}
      </div>
      <div className="center-panel panel with-radial-gradient">
        {props.centerPanelContent}
      </div>
      <div className="right-panel panel with-radial-gradient">
        {props.rightPanelContent}
      </div>
    </div>
  );
}

export function TextMeetingLayout(props) {
  const game = useContext(GameContext);
  const { isolationEnabled, isolatedPlayers } = game;
  const {
    combineMessagesFromAllMeetings,
    history,
    players,
    stateViewing,
    updateHistory,
    setActiveVoiceChannel,
  } = props;

  const stateInfo = history.states[stateViewing];
  const meetings = stateInfo ? stateInfo.meetings : {};
  const alerts = stateInfo ? stateInfo.alerts : [];
  const selTab = stateInfo && stateInfo.selTab;

  const [autoScroll, setAutoScroll] = useState(true);
  const [mouseMoved, setMouseMoved] = useState(false);
  const speechDisplayRef = useRef();

  const speechMeetings = Object.values(meetings).filter(
    (meeting) => meeting.speech
  );

  useLayoutEffect(() => doAutoScroll());

  useEffect(() => {
    if (stateViewing != null && !selTab && speechMeetings.length) {
      updateHistory({
        type: "selTab",
        state: stateViewing,
        meetingId: speechMeetings[0].id,
      });
    }
  }, [stateViewing, speechMeetings]);

  useEffect(() => {
    if (stateViewing == history.currentState) setAutoScroll(true);
    else setAutoScroll(false);
  }, [stateViewing]);

  useEffect(() => {
    function onMouseMove() {
      setMouseMoved(true);
      document.removeEventListener("mousemove", onMouseMove);
    }

    document.addEventListener("mousemove", onMouseMove);

    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);

  // useEffect(() => {
  //   if (!selTab || !meetings[selTab] || !meetings[selTab].vcToken)
  //     setActiveVoiceChannel(null);

  //   setActiveVoiceChannel(selTab);
  // }, [selTab, meetings]);

  function doAutoScroll() {
    if (autoScroll && speechDisplayRef.current)
      speechDisplayRef.current.scrollTop =
        speechDisplayRef.current.scrollHeight;
  }

  function onTabClick(tabId) {
    updateHistory({
      type: "selTab",
      state: stateViewing,
      meetingId: tabId,
    });

    setAutoScroll(true);
  }

  function onMessageQuote(message) {
    if (
      !props.review &&
      message.senderId != "server" &&
      !message.isQuote &&
      message.quotable
    ) {
      const fromState = combineMessagesFromAllMeetings
        ? message.fromState
        : stateViewing;

      props.socket.send("quote", {
        messageId: message.id,
        toMeetingId: history.states[history.currentState].selTab,
        fromMeetingId: message.meetingId,
        fromState: fromState,
      });
    }
  }

  function onSpeechScroll() {
    if (!mouseMoved) {
      doAutoScroll();
      return;
    }

    var speech = speechDisplayRef.current;

    if (
      Math.round(speech.scrollTop + speech.clientHeight) >=
      Math.round(speech.scrollHeight)
    )
      setAutoScroll(true);
    else setAutoScroll(false);
  }

  const tabs = speechMeetings.map((meeting) => {
    return (
      <div
        className={`tab ${selTab == meeting.id ? "sel" : ""}`}
        key={meeting.id}
        onClick={() => onTabClick(meeting.id)}
      >
        {meeting.name}
      </div>
    );
  });

  var messages;
  if (combineMessagesFromAllMeetings) {
    messages = getAllMessagesToDisplay(history);
  } else {
    messages = getMessagesToDisplay(
      meetings,
      alerts,
      selTab,
      players,
      props.settings,
      props.filters
    );
  }
  messages = messages.map((message, i) => {
    const isNotServerMessage = message.senderId !== "server";
    const unfocusedMessage =
      isolationEnabled &&
      isNotServerMessage &&
      isolatedPlayers.size &&
      !isolatedPlayers.has(message.senderId);

    return (
      <Message
        message={message}
        history={history}
        players={players}
        stateViewing={stateViewing}
        key={message.id || message.messageId + message.time || i}
        onMessageQuote={onMessageQuote}
        settings={props.settings}
        unfocusedMessage={unfocusedMessage}
      />
    );
  });

  var canSpeak = selTab;
  canSpeak =
    canSpeak &&
    (meetings[selTab].members.length > 1 || history.currentState == -1);
  canSpeak =
    canSpeak &&
    stateViewing == history.currentState &&
    meetings[selTab].amMember &&
    meetings[selTab].canTalk;

  return (
    <>
      <div className="meeting-tabs">
        {tabs.length > 0 && tabs}
        {tabs.length == 0 && (
          <div className="tab sel">{stateInfo && stateInfo.name}</div>
        )}
      </div>
      <div className="speech-wrapper">
        <div
          className="speech-display"
          onScroll={onSpeechScroll}
          ref={speechDisplayRef}
        >
          {messages}
        </div>
        {canSpeak && (
          <>
            <SpeechInput
              meetings={meetings}
              selTab={selTab}
              players={players}
              options={props.options}
              setup={props.setup}
              socket={props.socket}
              setAutoScroll={setAutoScroll}
              // agoraClient={props.agoraClient}
              localAudioTrack={props.localAudioTrack}
              muted={props.muted}
              setMuted={props.setMuted}
              deafened={props.deafened}
              setDeafened={props.setDeafened}
            />
          </>
        )}
      </div>
    </>
  );
}

function getAllMessagesToDisplay(history) {
  var messages = [];
  const states = Object.keys(history.states).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
  // postgame
  if (states[0] == "-2") {
    states.push(states.shift());
  }

  for (let state of states) {
    const stateMeetings = history.states[state].meetings;
    if (!stateMeetings) {
      return;
    }

    let stateMessages = [];
    for (let meeting in stateMeetings) {
      var meetingData = stateMeetings[meeting];
      for (let m of meetingData.messages) {
        if (!m.isQuote) {
          m.fromState = state;
        }
      }

      stateMessages.push(...meetingData.messages);
    }
    const stateAlerts = history.states[state].alerts;
    stateMessages.push(...stateAlerts);
    stateMessages.sort((a, b) => a.time - b.time);

    messages.push(...stateMessages);
  }

  return messages;
}

function getMessagesToDisplay(
  meetings,
  alerts,
  selTab,
  players,
  settings,
  filters
) {
  var messages;

  if (selTab) messages = [...meetings[selTab].messages];
  else messages = [];

  if (filters && (filters.from || filters.contains))
    messages = messages.filter((m) => {
      var content = m.content || "";
      var matches =
        content.toLowerCase().indexOf(filters.contains.toLowerCase()) != -1;

      var playerName = players[m.senderId]?.name || "";
      matches =
        matches &&
        playerName.toLowerCase().indexOf(filters.from.toLowerCase()) != -1;

      return matches;
    });

  for (let alert of alerts) {
    for (let i = 0; i <= messages.length; i++) {
      if (i == messages.length) {
        messages.push(alert);
        break;
      } else if (alert.time < messages[i].time) {
        messages.splice(i, 0, alert);
        break;
      }
    }
  }

  if (!settings.votingLog) return messages;

  var voteRecord;

  if (selTab) voteRecord = meetings[selTab].voteRecord;
  else voteRecord = [];

  for (let meetingId in meetings)
    if (!meetings[meetingId].speech)
      voteRecord = voteRecord.concat(meetings[meetingId].voteRecord);

  for (let vote of voteRecord) {
    let isUnvote = vote.type == "unvote";
    let voter = players[vote.voterId];
    let voterName = voter ? voter.name : "Anonymous";
    let target = vote.target;

    if (!isUnvote) {
      if (target != "*" && players[target]) target = players[target].name;
      else if (target == "*") target = "no one";
    }

    let voteMsg = {
      senderId: "vote",
      content: `${voterName} ${isUnvote ? "unvotes" : "votes"} ${
        isUnvote ? "" : target
      }`,
      time: vote.time,
    };

    for (let i = 0; i <= messages.length; i++) {
      if (i == messages.length) {
        messages.push(voteMsg);
        break;
      } else if (vote.time < messages[i].time) {
        messages.splice(i, 0, voteMsg);
        break;
      }
    }
  }

  return messages;
}

function areSameDay(first, second) {
  first = new Date(first);
  second = new Date(second);
  first.setYear(0);
  second.setYear(0);
  if (
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  ) {
    return true;
  }
  return false;
}

function Message(props) {
  const history = props.history;
  const players = props.players;
  const user = useContext(UserContext);

  var message = props.message;
  var player, quotedMessage;
  var contentClass = "content ";
  var isMe = false;
  var currentState = props.history.currentState;
  var meetings = history.states[currentState].meetings;

  if (
    message.senderId != "server" &&
    message.senderId != "vote" &&
    message.senderId != "anonymous"
  ) {
    player = players[message.senderId];
  }

  if (message.isQuote) {
    var state = history.states[message.fromState];

    if (!state) return <></>;

    var meeting = state.meetings[message.fromMeetingId];

    if (!meeting) return <></>;

    for (let msg of meeting.messages) {
      if (msg.id == message.messageId) {
        quotedMessage = { ...msg };
        quotedMessage.meetingName = meeting.name;

        if (msg.senderId == "anonymous") quotedMessage.senderName = "Anonymous";
        else quotedMessage.senderName = players[msg.senderId].name;
        break;
      }
    }
  }

  if (message.isQuote && !quotedMessage) return <></>;

  var stateMeetings = history.states[props.stateViewing].meetings;

  var stateMeetingDefined =
    stateMeetings !== undefined &&
    stateMeetings[message.meetingId] !== undefined;

  var playerDead = false;
  var deadGray = "#808080";
  var playerHasTextColor = false;

  if (player !== undefined) {
    playerDead = history.states[props.stateViewing].dead[message.senderId]
      ? true
      : false;
    playerHasTextColor = player.textColor !== undefined ? true : false;
    if (stateMeetingDefined) {
      if (stateMeetings[message.meetingId].name === "Party!" && !playerDead) {
        contentClass += "party ";
      }
    }
  }

  if ((player || message.senderId == "anonymous") && !message.isQuote)
    contentClass += "clickable ";

  if (!message.isQuote && message.content?.indexOf("/me ") == 0) {
    isMe = true;
    message = { ...message };
    message.content = message.content.replace("/me ", "");
  }

  if (message.isQuote) contentClass += "quote ";
  else if (message.senderId == "server") contentClass += "server ";
  else if (message.senderId == "vote") contentClass += "vote-record ";
  else if (isMe) contentClass += "me ";

  const messageStyle = {};
  if (props.unfocusedMessage) {
    messageStyle.opacity = "0.2";
  }

  if (player !== undefined) {
    if (playerDead && props.stateViewing > 0 && stateMeetingDefined) {
      contentClass += "dead";
      playerHasTextColor = false;
    } else if (
      player.birthday !== undefined &&
      areSameDay(Date.now(), player.birthday)
    ) {
      contentClass += " party ";
    }
  }

  if (message.content?.startsWith(">")) {
    contentClass += "greentext ";
    playerHasTextColor = false;
  }

  if (
    !user.settings?.ignoreTextColor &&
    player !== undefined &&
    player.textColor !== undefined
  ) {
    contentClass += `${adjustColor(player.textColor)}`;
  }

  return (
    <div
      className="message"
      onDoubleClick={() => props.onMessageQuote(message)}
      style={messageStyle}
    >
      <div className="sender">
        {props.settings.timestamps && <Timestamp time={message.time} />}
        {player && (
          <NameWithAvatar
            dead={playerDead && props.stateViewing > 0}
            id={player.userId}
            name={player.name}
            avatar={player.avatar}
            color={
              playerDead && props.stateViewing > 0 ? deadGray : player.nameColor
            }
            noLink
            small
          />
        )}
        {message.senderId == "anonymous" && (
          <div className="name-with-avatar">Anonymous</div>
        )}
      </div>
      <div
        className={contentClass}
        style={
          !user.settings?.ignoreTextColor && playerHasTextColor
            ? { color: flipTextColor(player.textColor) }
            : {}
        }
      >
        {!message.isQuote && (
          <>
            {message.prefix && <div className="prefix">({message.prefix})</div>}
            <UserText
              text={message.content}
              settings={user.settings}
              players={players}
              filterProfanity
              linkify
              emotify
              slangify
              slangifySeed={message.time.toString()}
              terminologyEmoticons={props.settings.terminologyEmoticons}
              iconUsername
            />
          </>
        )}
        {message.isQuote && (
          <>
            <i className="fas fa-quote-left" />
            <Timestamp time={quotedMessage.time} />
            <div className="quote-info">
              {`${quotedMessage.senderName} in ${quotedMessage.meetingName}: `}
            </div>
            <div className="quote-content">
              <UserText
                text={quotedMessage.content}
                settings={user.settings}
                players={players}
                filterProfanity
                linkify
                emotify
                slangifySeed={quotedMessage.time.toString()}
                iconUsername
              />
            </div>
            <i className="fas fa-quote-right" />
          </>
        )}
      </div>
    </div>
  );
}

export function Timestamp(props) {
  const time = new Date(props.time);
  var hours = String(time.getHours()).padStart(2, "0");
  var minutes = String(time.getMinutes()).padStart(2, "0");
  var seconds = String(time.getSeconds()).padStart(2, "0");

  return (
    <div className="time">
      {hours}:{minutes}:{seconds}
    </div>
  );
}

function SpeechInput(props) {
  const socket = props.socket;
  const meetings = props.meetings;
  const selTab = props.selTab;
  const players = props.players;
  const options = props.options;
  // const agoraClient = props.agoraClient;
  const localAudioTrack = props.localAudioTrack;
  const muted = props.muted;
  const setMuted = props.setMuted;
  const deafened = props.deafened;
  const setDeafened = props.setDeafened;

  const [speechInput, setSpeechInput] = useState("");
  const [speechDropdownOptions, setSpeechDropdownOptions] = useState([]);
  const [speechDropdownValue, setSpeechDropdownValue] = useState("Say");
  const [lastTyped, setLastTyped] = useState(0);
  const [typingIn, setTypingIn] = useState();
  const [clearTyping, setClearTyping] = useState();
  const [checkboxOptions, setCheckboxOptions] = useState({});

  var placeholder = "";

  for (let option of speechDropdownOptions) {
    if (speechDropdownValue == option.id) {
      placeholder = option.placeholder || "";
      break;
    }
  }

  useEffect(() => {
    if (!selTab) return <></>;

    const speechAbilities = meetings[selTab].speechAbilities;
    const newDropdownOptions = [
      { label: "Say", id: "Say", placeholder: "to everyone" },
    ];

    for (let ability of speechAbilities) {
      newDropdownOptions.push("divider");

      for (let target of ability.targets) {
        let targetDisplay = target;

        if (ability.targetType == "player")
          targetDisplay = players[target].name;

        newDropdownOptions.push({
          label: ability.name,
          placeholder: `${ability.verb} ${targetDisplay}`,
          id: `${ability.name}:${target}`,
        });
      }
    }
    if (props.setup.whispers) {
      newDropdownOptions.push("divider");
      newDropdownOptions.push({
        id: "forceLeak",
        label: "Leak Whispers",
        type: "checkbox",
        value: false,
      });
    }

    setSpeechDropdownOptions(newDropdownOptions);
  }, [selTab]);

  useEffect(() => {
    if (lastTyped > 0) {
      clearTimeout(clearTyping);
      setClearTyping(setTimeout(() => setLastTyped(0), 1000));

      if (typingIn != selTab) {
        setTypingIn(selTab);

        if (typingIn != null)
          socket.send("typing", { meetingId: typingIn, isTyping: false });

        socket.send("typing", { meetingId: selTab, isTyping: true });
      }
    } else if (typingIn != null) {
      setTypingIn(null);
      socket.send("typing", { meetingId: typingIn, isTyping: false });
    }
  }, [lastTyped]);

  function onSpeechDropdownChange(value) {
    setSpeechDropdownValue(value);
  }

  function onCheckboxChange(id, value) {
    const tempOptions = { ...checkboxOptions, [id]: value };
    setCheckboxOptions(tempOptions);
  }

  function onSpeechType(e) {
    setSpeechInput(e.target.value);

    if (
      e.target.value.length > 0 &&
      (e.target.value[0] != "/" || e.target.value.slice(0, 4) == "/me ") &&
      !meetings[selTab].anonymous &&
      speechDropdownValue == "Say"
    ) {
      setLastTyped(Date.now());
    }
  }

  function onSpeechSubmit(e) {
    if (e.key === "Enter" && selTab && speechInput.length) {
      const abilityInfo = speechDropdownValue.split(":");
      var abilityName = abilityInfo[0];
      var abilityTarget = abilityInfo[1];

      if (abilityName == "Say") abilityName = null;

      if (textIncludesSlurs(speechInput)) {
        socket.send("slurDetected");
      } else {
        socket.send("speak", {
          content: speechInput,
          meetingId: selTab,
          abilityName,
          abilityTarget,
          ...checkboxOptions,
        });
        props.setAutoScroll(true);
      }

      setSpeechInput("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const words = speechInput.split(" ");
      const word = words.pop();
      // Removing non-word characters before the string.
      const seedString = word.match(/[^\w-]?([\w-]*)$/)[1].toLowerCase();
      const prefix = word.substring(0, word.length - seedString.length);
      if (!seedString.length) return;

      const playerNames = Object.values(players).map((player) => player.name);
      const playerSeeds = playerNames.map((playerName) =>
        playerName.toLowerCase().substring(0, seedString.length)
      );
      const matchedPlayers = [];
      for (const i in playerSeeds) {
        // Checking seed string against characters in player names.
        if (playerSeeds[i] === seedString) {
          matchedPlayers.push(playerNames[i]);
        }
      }
      if (matchedPlayers.length) {
        if (matchedPlayers.length === 1) {
          // If one matching player, autocomplete entire name.
          words.push(prefix + matchedPlayers[0]);
        } else {
          // If multiple matching players, autocomplete until player names diverge.
          let autocompleted = "";
          let i = 1;
          while (
            matchedPlayers.every(
              (playerName) => playerName[i] === matchedPlayers[0][i]
            )
          ) {
            i += 1;
          }
          words.push(prefix + matchedPlayers[0].substring(0, i));
        }
        setSpeechInput(words.join(" "));
      } else if (word.toLowerCase() === "@everyone".substring(0, word.length)) {
        // Check for @everyone.
        words.push("@everyone");
        setSpeechInput(words.join(" "));
      }
    }
  }

  function onMute() {
    if (localAudioTrack.current) {
      var volume = muted ? 100 : 0;

      localAudioTrack.current.setVolume(volume);
      setMuted(!muted);
    }
  }

  // function onDeafen() {
  //   if (agoraClient.current) {
  //     var volume = deafened ? 100 : 0;

  //     agoraClient.current.remoteUsers.forEach((user) => {
  //       user.audioTrack && user.audioTrack.setVolume(volume);
  //     });

  //     setDeafened(!deafened);
  //   }
  // }
  function onEmoteSelected(emote) {
    setSpeechInput(speechInput ? `${speechInput.trimRight()} ${emote}` : emote);
  }

  return (
    <div className="speech-input-area">
      <div className="speech-input-wrapper">
        <Dropdown
          className="speech-dropdown"
          options={speechDropdownOptions}
          onChange={onSpeechDropdownChange}
          onCheckboxChange={onCheckboxChange}
          value={speechDropdownValue}
        />
        <input
          id="speechInput"
          className="speech-input"
          type="text"
          autoComplete="off"
          value={speechInput}
          placeholder={placeholder}
          maxLength={MaxGameMessageLength}
          onChange={onSpeechType}
          enterKeyHint="done"
          onKeyDown={onSpeechSubmit}
        />
        <EmotePicker
          className="speech-dropdown"
          onEmoteSelected={onEmoteSelected}
        />
      </div>
      {/*options.voiceChat && (
        <>
          <i
            className={`fas fa-microphone ${muted ? "disabled" : ""}`}
            onClick={onMute}
          />
          <i
            className={`fas fa-headphones ${deafened ? "disabled" : ""}`}
            onClick={onDeafen}
          />
        </>
      )*/}
    </div>
  );
}

export function StateSwitcher(props) {
  const history = props.history;
  const stateViewing = props.stateViewing;
  const stateName = history.states[stateViewing]
    ? history.states[stateViewing].name
    : "";

  const leftArrowVisible = props.stateViewing != -1;
  const rigthArrowVisible =
    props.stateViewing < history.currentState ||
    (history.currentState == -2 && props.stateViewing != history.currentState);

  function onStateNameClick() {
    props.updateStateViewing({ type: "current" });
  }

  return (
    <div className="state-nav">
      <i
        className={`hist-arrow fas fa-caret-left ${
          leftArrowVisible ? "" : "invisible"
        }`}
        onClick={() => props.updateStateViewing({ type: "backward" })}
      />
      <div className="state-name" onClick={onStateNameClick}>
        {stateName.toUpperCase()}
      </div>
      <i
        className={`hist-arrow fas fa-caret-right ${
          rigthArrowVisible ? "" : "invisible"
        }`}
        onClick={() => props.updateStateViewing({ type: "forward" })}
      />
    </div>
  );
}

export function formatTimerTime(time) {
  if (time > 0) time = Math.round(time / 1000);
  else time = 0;

  const minutes = String(Math.floor(time / 60)).padStart(2, "0");
  const seconds = String(time % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function SideMenu(props) {
  return (
    <div className={`side-menu ${props.scrollable ? "scrollable" : ""}`}>
      <div className="side-menu-title">{props.title}</div>
      <div className="side-menu-content">{props.content}</div>
    </div>
  );
}

function RoleMarkerToggle(props) {
  const roleMarkerRef = useRef();
  const popover = useContext(PopoverContext);
  const game = useContext(GameContext);
  const { toggleRolePrediction } = game;
  const playerId = props.playerId;

  function onRoleMarkerClick() {
    if (props.onClick) props.onClick();

    popover.onClick(
      `/setup/${game.setup.id}`,
      "rolePrediction",
      roleMarkerRef.current,
      "Mark Role as",
      (data) => {
        let roles = {};
        for (let r of JSON.parse(data.roles)) {
          Object.assign(roles, r);
        }

        data.roles = roles;
        data.toggleRolePrediction = toggleRolePrediction(playerId);
      }
    );
  }

  return (
    <div
      className="role-marker"
      onClick={onRoleMarkerClick}
      ref={roleMarkerRef}
    >
      <i className="fas fa-user-edit"></i>
    </div>
  );
}

export function PlayerRows(props) {
  const game = useContext(GameContext);
  const { isolationEnabled, togglePlayerIsolation, isolatedPlayers } = game;
  const { rolePredictions } = game;
  const history = props.history;
  const players = props.players;
  const activity = props.activity;
  const stateViewingInfo = history.states[props.stateViewing];
  const selTab = stateViewingInfo && stateViewingInfo.selTab;

  const isPlayerIsolated = (playerId) => isolatedPlayers.has(playerId);

  const rows = players.map((player) => {
    const isolationCheckbox = isolationEnabled && (
      <input
        type="checkbox"
        checked={isPlayerIsolated(player.id)}
        onChange={() => togglePlayerIsolation(player.id)}
      />
    );

    const rolePrediction = rolePredictions[player.id];
    const roleToShow = rolePrediction
      ? rolePrediction
      : stateViewingInfo.roles[player.id];

    var showBubbles =
      Object.keys(history.states[history.currentState].dead).includes(
        props.self
      ) || players.find((x) => x.id === props.self) !== undefined;
    var colorAutoScheme = false;
    var bubbleColor = "black";
    if (document.documentElement.classList.length === 0) {
      colorAutoScheme = true;
    } else {
      if (!document.documentElement.classList.contains("light-mode")) {
        if (!document.documentElement.classList.contains("dark-mode")) {
          colorAutoScheme = true;
        } else {
          bubbleColor = "white";
        }
      } else {
        bubbleColor = "black";
      }
    }

    if (colorAutoScheme) {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        bubbleColor = "white";
      }
    }

    return (
      <div
        className={`player ${props.className ? props.className : ""}`}
        key={player.id}
      >
        {isolationCheckbox}
        {props.stateViewing != -1 && <RoleMarkerToggle playerId={player.id} />}
        {props.stateViewing != -1 && (
          <RoleCount
            role={roleToShow}
            isRolePrediction={rolePrediction !== undefined}
            gameType={props.gameType}
            showPopover
          />
        )}
        <NameWithAvatar
          id={player.userId}
          name={player.name}
          avatar={player.avatar}
          color={player.nameColor}
          active={activity.speaking[player.id]}
          newTab
        />
        {selTab && showBubbles && activity.typing[player.id] == selTab && (
          <ReactLoading
            className={`typing-icon ${
              props.stateViewing != -1 ? "has-role" : ""
            }`}
            type="bubbles"
            color={bubbleColor}
            width="20"
            height="20"
          />
        )}
      </div>
    );
  });

  return rows;
}

export function PlayerList(props) {
  const history = props.history;
  const stateViewingInfo = history.states[props.stateViewing];
  const alivePlayers = Object.values(props.players).filter(
    (p) => !stateViewingInfo.dead[p.id] && !p.left
  );
  const deadPlayers = Object.values(props.players).filter(
    (p) => stateViewingInfo.dead[p.id] && !p.left
  );

  return (
    <SideMenu
      title="Players"
      scrollable
      content={
        <div className="player-list">
          <PlayerRows
            players={alivePlayers}
            history={history}
            self={props.self}
            gameType={props.gameType}
            stateViewing={props.stateViewing}
            activity={props.activity}
          />
          {deadPlayers.length > 0 && (
            <div className="section-title">
              <i className="fas fa-skull" />
              Graveyard
            </div>
          )}
          <PlayerRows
            players={deadPlayers}
            history={history}
            self={props.self}
            gameType={props.gameType}
            stateViewing={props.stateViewing}
            activity={props.activity}
            className="dead"
          />
        </div>
      }
    />
  );
}

export function ActionList(props) {
  const actions = Object.values(props.meetings).reduce((actions, meeting) => {
    if (meeting.voting) {
      var action;

      switch (meeting.inputType) {
        case "player":
        case "boolean":
        case "role":
        case "alignment":
        case "custom":
        case "customBoolean":
        case "select":
          action = (
            <ActionSelect
              key={meeting.id}
              socket={props.socket}
              meeting={meeting}
              players={props.players}
              self={props.self}
              history={props.history}
              stateViewing={props.stateViewing}
            />
          );
          break;
        case "button":
          action = (
            <ActionButton
              key={meeting.id}
              socket={props.socket}
              meeting={meeting}
              players={props.players}
              self={props.self}
              history={props.history}
              stateViewing={props.stateViewing}
            />
          );
          break;
        case "text":
          action = (
            <ActionText
              key={meeting.id}
              socket={props.socket}
              meeting={meeting}
              players={props.players}
              self={props.self}
              history={props.history}
              stateViewing={props.stateViewing}
            />
          );
          break;
      }

      actions.push(action);
    }
    return actions;
  }, []);

  return (
    <>
      {actions.length > 0 && (
        <SideMenu
          scrollable
          title="Actions"
          content={<div className="action-list">{actions}</div>}
        />
      )}
    </>
  );
}

function ActionSelect(props) {
  const [meeting, history, stateViewing, isCurrentState, notClickable, onVote] =
    useAction(props);
  const [menuVisible, setMenuVisible, dropdownContainerRef, dropdownMenuRef] =
    useDropdown();
  const [selectVisible, setSelectVisible] = useState(true);

  const targets = meeting.targets.map((target) => {
    var targetDisplay = getTargetDisplay(target, meeting, props.players);

    return (
      <div
        className="target dropdown-menu-option"
        key={target}
        onClick={() => onSelectVote(target)}
      >
        {targetDisplay}
      </div>
    );
  });

  const votes = Object.values(meeting.members).map((member) => {
    var selection = meeting.votes[member.id];
    var player = props.players[member.id];
    selection = getTargetDisplay(selection, meeting, props.players);

    if (!member.canVote && meeting.displayOptions.disableShowDoesNotVote) {
      return <></>;
    }

    return (
      <div className={`vote ${meeting.multi ? "multi" : ""}`} key={member.id}>
        <div className="voter" onClick={() => onSelectVote(member.id)}>
          {(player && player.name) || "Anonymous"}
        </div>
        {!member.canVote && <div className="selection">does not vote</div>}
        {member.canVote && selection.length > 0 && (
          <div className="italic">votes</div>
        )}
        {member.canVote && (
          <div className="selection">{selection.join(", ")}</div>
        )}
      </div>
    );
  });

  function onSelectVote(sel) {
    setMenuVisible(false);
    onVote(sel);
  }

  function onActionClick() {
    if (!notClickable) setMenuVisible(!menuVisible);
  }

  useEffect(() => {
    if (notClickable && meeting.hideAfterVote) {
      setSelectVisible(false);
    }
  }, [notClickable]);

  return (
    <div className="action" style={selectVisible ? {} : { display: "none" }}>
      <div
        className={`action-name dropdown-control ${
          notClickable ? "not-clickable" : ""
        }`}
        ref={dropdownContainerRef}
        onClick={onActionClick}
      >
        {meeting.actionName}
        <i className="fas fa-angle-down dropdown-arrow" />
      </div>
      {menuVisible && (
        <div className="targets dropdown-menu" ref={dropdownMenuRef}>
          {targets}
        </div>
      )}
      <div className="votes">{votes}</div>
    </div>
  );
}

function ActionButton(props) {
  const [meeting, history, stateViewing, isCurrentState, notClickable, onVote] =
    useAction(props);
  if (notClickable) {
    return null;
  }
  const votes = { ...meeting.votes };

  for (let playerId in votes)
    votes[playerId] = getTargetDisplay(votes[playerId], meeting, props.players);

  const buttons = meeting.targets.map((target) => {
    var targetDisplay = getTargetDisplay(target, meeting, props.players);

    return (
      <div
        className={`btn btn-theme ${
          votes[props.self] == targetDisplay ? "sel" : ""
        }`}
        key={target}
        disabled={votes[props.self] && !meeting.canUnvote}
        onClick={() => onVote(target)}
      >
        {targetDisplay}
      </div>
    );
  });

  return (
    <div className="action">
      <div className="action-name">{meeting.actionName}</div>
      {buttons}
    </div>
  );
}

function ActionText(props) {
  const meeting = props.meeting;
  const self = props.self;

  const disabled = meeting.finished;

  // text settings
  const textOptions = meeting.textOptions || {};
  const minLength = textOptions.minLength || 0;
  const maxLength = textOptions.maxLength || MaxTextInputLength;

  const [textData, setTextData] = useState("");

  function handleOnChange(e) {
    var textInput = e.target.value;
    // disable new lines by default
    textInput = textInput.replace(/\n/g, " ");

    if (textOptions.alphaOnly) {
      textInput = textInput.replace(/[^a-z]/gi, "");
    }

    if (textOptions.alphaOnlyWithSpaces) {
      textInput = textInput.replace(/\s\s+/g, " ");
      textInput = textInput.replace(/[^a-z ]/gi, "");
    }

    if (textOptions.toLowerCase) {
      textInput = textInput.toLowerCase();
    }

    if (textOptions.enforceAcronym) {
      let words = textInput.split(" ");
      let acceptedWords = [];
      for (let i in textOptions.enforceAcronym) {
        if (words.length <= i) {
          break;
        }

        if (
          words[i].charAt(0).toLowerCase() ==
          textOptions.enforceAcronym.charAt(i).toLowerCase()
        ) {
          acceptedWords.push(words[i]);
          continue;
        }

        break;
      }

      let addSpace =
        words.length <= textOptions.enforceAcronym.length &&
        words[words.length - 1] == "";
      if (addSpace) {
        acceptedWords.push("");
      }

      textInput = acceptedWords.join(" ");
    }

    textInput = textInput.substring(0, maxLength);
    setTextData(textInput);
  }

  function handleOnSubmit(e) {
    if (textData.length < minLength) {
      return;
    }

    // validate if it's a real english word
    // if (textOptions.validEnglishWord &&  )

    // validate if it's unique only
    // if (textOptions.uniqueOnly)

    meeting.votes[self] = textData;
    props.socket.send("vote", {
      meetingId: meeting.id,
      selection: textData,
    });
  }

  return (
    <div className="action">
      <div className="action-name">{meeting.actionName}</div>
      {!disabled && <textarea value={textData} onChange={handleOnChange} />}
      {!disabled && (
        <div className="btn btn-theme" onClick={handleOnSubmit}>
          {textOptions.submit || "Submit"}
        </div>
      )}
      {meeting.votes[self]}
    </div>
  );
}

function useAction(props) {
  const meeting = props.meeting;
  const history = props.history;
  const stateViewing = props.stateViewing;
  const isCurrentState = stateViewing == history.currentState;

  const notClickable =
    !isCurrentState ||
    !meeting.amMember ||
    !meeting.canVote ||
    ((meeting.instant || meeting.noUnvote) && meeting.votes[props.self]);

  function onVote(sel) {
    var isUnvote;

    if (!Array.isArray(meeting.votes[props.self]))
      isUnvote = sel == meeting.votes[props.self];
    else isUnvote = meeting.votes[props.self].indexOf(sel) != -1;

    if (!isUnvote) {
      props.socket.send("vote", {
        meetingId: meeting.id,
        selection: sel,
      });
    } else {
      props.socket.send("unvote", {
        meetingId: meeting.id,
        selection: sel,
      });
    }
  }

  return [meeting, history, stateViewing, isCurrentState, notClickable, onVote];
}

function getTargetDisplay(targets, meeting, players) {
  if (!Array.isArray(targets) && targets) targets = [targets];
  else if (!targets) targets = [];
  else targets = [...targets];

  for (let i in targets) {
    let target = targets[i];

    switch (meeting.inputType) {
      case "player":
        if (target == "*") target = "no one";
        else if (target) target = players[target].name;
        else target = "";
        break;
      case "boolean":
        if (target == "*") target = "No";
        else if (!target) target = "";
      default:
        if (target == "*") target = "None";
        else if (!target) target = "";
    }

    targets[i] = target;
  }

  return targets;
}

export function Timer(props) {
  var timerName;

  if (props.history.currentState == -1) timerName = "pregameCountdown";
  else if (props.history.currentState == -2) timerName = "postgame";
  else if (props.timers["secondary"]) timerName = "secondary";
  else if (props.timers["vegKick"]) timerName = "vegKick";
  else if (props.timers["vegKickCountdown"]) timerName = "vegKickCountdown";
  else timerName = "main";

  const timer = props.timers[timerName];

  if (!timer) return <div className="state-timer"></div>;

  var time = timer.delay - timer.time;

  if (props.timers["secondary"]) {
    // show main timer if needed
    const mainTimer = props.timers["main"];
    if (mainTimer) {
      var mainTime = mainTimer.delay - mainTimer.time;
      time = Math.min(time, mainTime);
    }
  }

  time = formatTimerTime(time);

  if (timerName === "vegKick") {
    return <div className="state-timer">Kicking in {time}</div>;
  }
  return <div className="state-timer">{time}</div>;
}

export function LastWillEntry(props) {
  const [lastWill, setLastWill] = useState(props.lastWill);
  const cannotModifyLastWill = props.cannotModifyLastWill;

  function onWillChange(e) {
    var newWill = e.target.value.slice(0, MaxWillLength);
    setLastWill(newWill);
    props.socket.send("lastWill", newWill);
  }

  return (
    <SideMenu
      title="Last Will"
      content={
        <div className="last-will-wrapper">
          <textarea
            readOnly={cannotModifyLastWill}
            className="last-will-entry"
            value={lastWill}
            onChange={onWillChange}
          />
        </div>
      }
    />
  );
}

function SettingsModal(props) {
  const settings = props.settings;
  const updateSettings = props.updateSettings;
  const showModal = props.showModal;
  const setShowModal = props.setShowModal;
  const [formFields, updateFormFields] = useForm([
    {
      label: "Voting Log",
      ref: "votingLog",
      type: "boolean",
      value: settings.votingLog,
    },
    {
      label: "Timestamps",
      ref: "timestamps",
      type: "boolean",
      value: settings.timestamps,
    },
    {
      label: "Sounds",
      ref: "sounds",
      type: "boolean",
      value: settings.sounds,
    },
    {
      label: "Music",
      ref: "music",
      type: "boolean",
      value: settings.music,
    },
    {
      label: "Volume",
      ref: "volume",
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      value: settings.volume,
    },
    {
      label: `Display Terminology Emoticons`,
      ref: "terminologyEmoticons",
      type: "boolean",
      value: settings.terminologyEmoticons,
    },
  ]);

  const modalHeader = "Settings";

  const modalContent = <Form fields={formFields} onChange={updateFormFields} />;

  const modalFooter = (
    <div className="settings-control">
      <div className="settings-save btn btn-theme" onClick={saveSettings}>
        Save
      </div>
      <div className="settings-cancel btn btn-theme-third" onClick={cancel}>
        Cancel
      </div>
    </div>
  );
  function cancel() {
    for (let field of formFields) {
      updateFormFields({
        ref: field.ref,
        prop: "value",
        value: settings[field.ref],
      });
    }

    setShowModal(false);
  }

  function saveSettings() {
    var newSettings = {};

    for (let field of formFields) newSettings[field.ref] = field.value;

    updateSettings({
      type: "set",
      settings: newSettings,
    });

    setShowModal(false);
  }

  return (
    <Modal
      className="settings"
      show={showModal}
      header={modalHeader}
      content={modalContent}
      footer={modalFooter}
      onBgClick={cancel}
    />
  );
}

function FirstGameModal(props) {
  const showModal = props.showModal;
  const setShowModal = props.setShowModal;

  const modalHeader = "Welcome to UltiMafia";

  const modalContent = (
    <>
      <div className="paragraph">
        To keep games fun and competitive for all, please don't:
      </div>

      <div className="paragraph">
        <div>
          - Communicate with other players using anything which isn't part of
          the game.
        </div>
        <div>
          - Form alliances or other out-of-game arrangements with other users.
        </div>
        <div>- Attempt to play a game using more than one account.</div>
        <div>- Send screenshots or "prove" anything with images or video.</div>
        <div>- Copy exactly any system messages you recieve (blue text).</div>
        <div>- Try to lose the game on purpose.</div>
        <div>- Give up or leave partway through the game.</div>
        <div>
          - Issue out-of-game bribes or threats to sway other players, including
          threatening to leave.
        </div>
      </div>

      <div className="paragraph">
        Breaking game conduct may result in necessary action being taken against
        your account.
      </div>
      <div className="paragraph">
        A full description of these rules as well as site and community rules is
        found <a href="/community/forums/board/-2z5mOHaYp">here</a>.
      </div>
      <div className="paragraph">
        You can also find tutorials, tips, and strategy guides{" "}
        <a href="/community/forums/board/ht4TEuL6lG">here</a>. Good luck, and
        have fun!
      </div>
    </>
  );

  const modalFooter = (
    <div className="btn btn-theme" onClick={cancel}>
      Close
    </div>
  );

  function cancel() {
    setShowModal(false);
  }

  return (
    <Modal
      className="first-game"
      show={showModal}
      header={modalHeader}
      content={modalContent}
      footer={modalFooter}
      onBgClick={cancel}
    />
  );
}

export function SpeechFilter(props) {
  const game = useContext(GameContext);
  const { isolationEnabled, setIsolationEnabled } = game;
  const { filters, setFilters, stateViewing } = props;

  const toggleIsolationEnabled = () => setIsolationEnabled(!isolationEnabled);

  function onFilter(type, value) {
    setFilters(
      update(filters, {
        [type]: {
          $set: value,
        },
      })
    );
  }

  if (stateViewing < 0) return <></>;

  return (
    <SideMenu
      title="Speech Filters"
      content={
        <div className="speech-filters">
          <div style={{ marginBottom: "10px" }}>
            <input
              id="isolateMessagesCheckbox"
              type="checkbox"
              value={isolationEnabled}
              onChange={toggleIsolationEnabled}
            />
            <label htmlFor="isolateMessagesCheckbox"> Isolate messages</label>
          </div>
          <input
            type="text"
            placeholder="From user"
            value={filters.from}
            onChange={(e) => onFilter("from", e.target.value)}
            style={{ marginBottom: "10px" }}
          />
          <input
            type="text"
            placeholder="Contains"
            value={filters.contains}
            onChange={(e) => onFilter("contains", e.target.value)}
          />
        </div>
      }
    />
  );
}

export function Notes(props) {
  const stateViewing = props.stateViewing;
  const [notes, setNotes] = useState("");
  const { gameId } = useParams();

  useEffect(() => {
    var notesData = window.localStorage.getItem("notesData");

    if (notesData) {
      notesData = JSON.parse(notesData);

      if (notesData.game != gameId) window.localStorage.removeItem("notesData");
      else setNotes(notesData.notes);
    }
  }, []);

  function onNotesUpdate(_notes) {
    setNotes(_notes);
    window.localStorage.setItem(
      "notesData",
      JSON.stringify({ game: gameId, notes: _notes })
    );
  }

  if (stateViewing < 0) return <></>;

  return (
    <SideMenu
      title="Notes"
      content={
        <div className="notes-wrapper">
          <textarea
            className="notes-entry"
            value={notes}
            onChange={(e) => onNotesUpdate(e.target.value)}
          />
        </div>
      }
    />
  );
}

function useHistoryReducer() {
  return useReducer(
    (history, action) => {
      var newHistory;

      switch (action.type) {
        case "set":
          var stateIds = Object.keys(action.history).sort((a, b) => a - b);
          newHistory = { states: action.history };

          if (stateIds[0] == -2) newHistory.currentState = -2;
          else newHistory.currentState = stateIds[stateIds.length - 1];
          break;
        case "addState":
          if (!history.states[action.state.id]) {
            var prevState;

            if (action.state.id != -2) prevState = action.state.id - 1;
            else
              prevState = Object.keys(history.states).sort((a, b) => b - a)[0];

            newHistory = update(history, {
              states: {
                [action.state.id]: {
                  $set: {
                    name: action.state.name,
                    meetings: {},
                    alerts: [],
                    stateEvents: [],
                    roles: { ...history.states[prevState].roles },
                    dead: { ...history.states[prevState].dead },
                    extraInfo: { ...action.state.extraInfo },
                  },
                },
              },
              currentState: {
                $set: action.state.id,
              },
            });
          } else newHistory = history;
          break;
        case "addMeeting":
          var state = history.states[history.currentState];

          if (state) {
            if (!state.meetings) {
              newHistory = update(history, {
                states: {
                  [history.currentState]: {
                    meetings: {
                      $set: {},
                    },
                  },
                },
              });
            }

            newHistory = update(newHistory || history, {
              states: {
                [history.currentState]: {
                  meetings: {
                    [action.meeting.id]: {
                      $set: action.meeting,
                    },
                  },
                },
              },
            });
          }
          break;
        case "meetingMembers":
          if (
            history.states[history.currentState] &&
            history.states[history.currentState].meetings[action.meetingId]
          ) {
            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  meetings: {
                    [action.meetingId]: {
                      members: {
                        $set: action.members,
                      },
                    },
                  },
                },
              },
            });
          }
          break;
        case "removeMeeting":
          if (history.states[history.currentState]) {
            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  meetings: {
                    $unset: [action.meetingId],
                  },
                },
              },
            });

            if (
              newHistory.states[history.currentState].selTab == action.meetingId
            ) {
              newHistory = update(newHistory, {
                states: {
                  [history.currentState]: {
                    $unset: ["selTab"],
                  },
                },
              });
            }
          }
          break;
        case "addMessage":
          if (history.states[history.currentState]) {
            if (action.message.meetingId) {
              if (
                history.states[history.currentState].meetings[
                  action.message.meetingId
                ]
              ) {
                newHistory = update(history, {
                  states: {
                    [history.currentState]: {
                      meetings: {
                        [action.message.meetingId]: {
                          messages: {
                            $push: [action.message],
                          },
                        },
                      },
                    },
                  },
                });
              }
            } else {
              newHistory = update(history, {
                states: {
                  [history.currentState]: {
                    alerts: {
                      $push: [action.message],
                    },
                  },
                },
              });
            }
          }
          break;
        case "addQuote":
          if (
            history.states[history.currentState] &&
            history.states[history.currentState].meetings[
              action.quote.toMeetingId
            ]
          ) {
            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  meetings: {
                    [action.quote.toMeetingId]: {
                      messages: {
                        $push: [action.quote],
                      },
                    },
                  },
                },
              },
            });
          }
          break;
        case "vote":
          var target = action.vote.target;
          var state = history.states[history.currentState];
          var meeting = state && state.meetings[action.vote.meetingId];

          if (meeting) {
            if (meeting.multi)
              target = [...(meeting.votes[action.vote.voterId] || []), target];

            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  meetings: {
                    [action.vote.meetingId]: {
                      votes: {
                        [action.vote.voterId]: {
                          $set: target,
                        },
                      },
                    },
                  },
                },
              },
            });

            if (!action.vote.noLog) {
              newHistory = update(newHistory, {
                states: {
                  [history.currentState]: {
                    meetings: {
                      [action.vote.meetingId]: {
                        voteRecord: {
                          $push: [
                            {
                              type: "vote",
                              voterId: action.vote.voterId,
                              target: action.vote.target,
                              time: Date.now(),
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              });
            }
          }
          break;
        case "unvote":
          var target = undefined;
          var state = history.states[history.currentState];
          var meeting = state && state.meetings[action.info.meetingId];

          if (meeting) {
            if (meeting.multi)
              target = (meeting.votes[action.info.voterId] || []).filter(
                (t) => t != action.info.target
              );

            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  meetings: {
                    [action.info.meetingId]: {
                      votes: {
                        [action.info.voterId]: {
                          $set: target,
                        },
                      },
                      voteRecord: {
                        $push: [
                          {
                            type: "unvote",
                            voterId: action.info.voterId,
                            time: Date.now(),
                          },
                        ],
                      },
                    },
                  },
                },
              },
            });
          }
          break;
        case "stateEvents":
          if (history.states[history.currentState]) {
            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  stateEvents: {
                    $set: action.stateEvents,
                  },
                },
              },
            });
          }
          break;
        case "selTab":
          if (history.states[action.state]) {
            newHistory = update(history, {
              states: {
                [action.state]: {
                  selTab: {
                    $set: action.meetingId,
                  },
                },
              },
            });
          }
          break;
        case "reveal":
          if (history.states[history.currentState]) {
            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  roles: {
                    [action.playerId]: {
                      $set: action.role,
                    },
                  },
                },
              },
            });
          }
          break;
        case "death":
          if (history.states[history.currentState]) {
            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  dead: {
                    [action.playerId]: {
                      $set: true,
                    },
                  },
                },
              },
            });
          }
          break;
        case "revival":
          if (history.states[history.currentState]) {
            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  dead: {
                    [action.playerId]: {
                      $set: false,
                    },
                  },
                },
              },
            });
          }
          break;
      }

      return newHistory || history;
    },
    { states: {} }
  );
}

export function useStateViewingReducer(history) {
  return useReducer((state, action) => {
    var newState;

    switch (action.type) {
      case "backward":
        if (state > -2) newState = state - 1;
        else newState = Math.max(...Object.keys(history.states));
        break;
      case "forward":
        if (history.states[state + 1]) newState = state + 1;
        else newState = -2;
        break;
      case "current":
        newState = history.currentState;
        break;
      case "first":
        newState = -1;
        break;
      default:
        newState = state;
    }

    if (history.states[newState]) return newState;
    else return state;
  }, history.currentState);
}

export function useTimersReducer() {
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
        newTimers[action.name].time = action.time;
        break;
      case "updateAll":
        for (var timerName in newTimers) newTimers[timerName].time += 1000;

        const timer =
          newTimers["pregameCountdown"] ||
          newTimers["secondary"] ||
          newTimers["main"];

        if (!timer) break;

        const intTime = Math.round((timer.delay - timer.time) / 1000);

        if (intTime < 16 && intTime > 0) action.playAudio("tick");
        break;
    }

    return newTimers;
  }, {});
}

export function usePlayersReducer() {
  return useReducer((players, action) => {
    var newPlayers;

    switch (action.type) {
      case "set":
        newPlayers = action.players;
        break;
      case "add":
        if (!players[action.player.id]) {
          newPlayers = update(players, {
            [action.player.id]: {
              $set: action.player,
            },
          });
        } else {
          newPlayers = update(players, {
            [action.player.id]: {
              $unset: ["left"],
            },
          });
        }
        break;
      case "remove":
        newPlayers = update(players, {
          [action.playerId]: {
            left: {
              $set: true,
            },
          },
        });
        break;
      case "setProp":
        newPlayers = update(players, {
          [action.playerId]: {
            [action.propName]: {
              $set: action.propVal,
            },
          },
        });
        break;
    }

    return newPlayers || players;
  }, {});
}

export function useSettingsReducer() {
  const defaultSettings = {
    votingLog: true,
    timestamps: true,
    sounds: true,
    music: true,
    volume: 1,
    terminologyEmoticons: true,
  };

  return useReducer((settings, action) => {
    var newSettings;

    switch (action.type) {
      case "load":
        try {
          newSettings = window.localStorage.getItem("gameSettings");
          newSettings = JSON.parse(newSettings);
        } catch (e) {
          newSettings = settings;
        }
        break;
      case "set":
        newSettings = action.settings;
        window.localStorage.setItem(
          "gameSettings",
          JSON.stringify(newSettings)
        );
        break;
      case "setProp":
        newSettings = update(settings, {
          [action.propName]: {
            $set: action.propval,
          },
        });

        window.localStorage.setItem(
          "gameSettings",
          JSON.stringify(newSettings)
        );
        break;
    }

    return newSettings || settings;
  }, defaultSettings);
}

export function useActivity(localAudioTrack) {
  const volumeThreshold = 0.001;
  const [activity, updateActivity] = useReducer(
    (activity, action) => {
      var newActivity;

      switch (action.type) {
        case "typing":
          newActivity = update(activity, {
            typing: {
              [action.playerId]: {
                $set: action.meetingId,
              },
            },
          });
          break;
        case "speaking":
          var newSpeaking = action.players.reduce((speaking, playerId) => {
            speaking[playerId] = true;
            return speaking;
          }, {});

          newActivity = update(activity, {
            speaking: {
              $set: newSpeaking,
            },
          });
          break;
      }

      return newActivity || activity;
    },
    { typing: {}, speaking: {} }
  );

  // useEffect(() => {
  //   var activityInterval = setInterval(() => {
  //     if (agoraClient.current) {
  //       var speaking = [];

  //       if (
  //         localAudioTrack.current &&
  //         localAudioTrack.current.getVolumeLevel() > volumeThreshold
  //       ) {
  //         speaking.push(agoraClient.current.uid);
  //       }

  //       agoraClient.current.remoteUsers.forEach((user) => {
  //         if (
  //           user.audioTrack &&
  //           user.audioTrack.getVolumeLevel() > volumeThreshold
  //         )
  //           speaking.push(user.uid);
  //       });

  //       updateActivity({
  //         type: "speaking",
  //         players: speaking,
  //       });
  //     }
  //   }, 50);

  //   return () => clearInterval(activityInterval);
  // });

  return [activity, updateActivity];
}

export function useAudio(settings) {
  const audioRef = useRef({});

  const [audioInfo, updateAudio] = useReducer(
    (audioInfo, action) => {
      var newAudioInfo;

      switch (action.type) {
        case "play":
          if (!settings.sounds) return audioInfo;
          if (!settings.music && action.audioName.includes("music")) {
            return audioInfo;
          }
          if (audioInfo.overrides[action.audioName])
            for (let audioName in audioInfo.overrides)
              if (audioInfo.overrides[audioName] && audioRef.current[audioName])
                audioRef.current[audioName].pause();

          if (audioRef.current[action.audioName]) {
            audioRef.current[action.audioName].currentTime = 0;
            audioRef.current[action.audioName].play().catch((e) => {});
          }
          break;
        case "load":
          newAudioInfo = {
            overrides: { ...audioInfo.overrides },
            volumes: { ...audioInfo.volumes },
          };

          for (let i in action.files) {
            let fileName = action.files[i];

            if (!audioRef.current[fileName]) {
              audioRef.current[fileName] = new Audio(`/audio/${fileName}.mp3`);
              audioRef.current[fileName].load();
              audioRef.current[fileName].loop = action.loops[i];
            }

            newAudioInfo.overrides[fileName] = action.overrides[i];
            newAudioInfo.volumes[fileName] = action.volumes[i];
          }
          break;
        case "volume":
          for (let audioName in audioRef.current) {
            if (audioInfo.volumes[audioName])
              audioRef.current[audioName].volume =
                audioInfo.volumes[audioName] * action.volume;
          }
          break;
      }

      return newAudioInfo || audioInfo;
    },
    { overrides: {}, volumes: {} }
  );

  useEffect(() => {
    updateAudio({
      type: "volume",
      volume: settings.volume,
    });
  }, [settings.volume, audioInfo]);

  function playAudio(audioName) {
    updateAudio({
      type: "play",
      audioName,
    });
  }

  function loadAudioFiles(files, loops, overrides, volumes) {
    updateAudio({
      type: "load",
      files,
      loops,
      overrides,
      volumes,
    });
  }

  function stopAudio() {
    for (let audioName in audioRef.current) audioRef.current[audioName].pause();
  }

  function stopAudios(audios) {
    for (let audioName of audios) audioRef.current[audioName].pause();
  }

  function setVolume(volume) {
    updateAudio({
      type: "volume",
      volume,
    });
  }

  return [playAudio, loadAudioFiles, stopAudio, stopAudios, setVolume];
}

async function requestNotificationAccess() {
  if (!Notification) return;

  await Notification.requestPermission();
}
