import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams, Route, Navigate, Routes, Link } from "react-router-dom";
import update from "immutability-helper";
import axios from "axios";
import ReactLoading from "react-loading";

import { UserText } from "../../components/Basic";
import { ObituariesMessage } from "../../components/gameComponents/Newspaper";
import MafiaGame from "./MafiaGame";
import ResistanceGame from "./ResistanceGame";
import JottoGame from "./JottoGame";
import AcrotopiaGame from "./AcrotopiaGame";
import SecretDictatorGame from "./SecretDictatorGame";
import WackyWordsGame from "./WackyWordsGame";
import LiarsDiceGame from "./LiarsDiceGame";
import TexasHoldEmGame from "./TexasHoldEmGame";
import CheatGame from "./CheatGame";
import BattlesnakesGame from "./BattlesnakesGame";
import ConnectFourGame from "./ConnectFourGame";
import { GameContext, SiteInfoContext, UserContext } from "Contexts";
import Dropdown from "../../components/Dropdown";
import Setup from "../../components/Setup";
import { NameWithAvatar } from "../User/User";
import { ClientSocket as Socket } from "../../Socket";
import { RoleCount } from "../../components/Roles";
import Form, { useForm } from "../../components/Form";
import { Modal } from "../../components/Modal";
import SiteLogo from "../../components/SiteLogo";
import LeaveGameDialog from "../../components/LeaveGameDialog";
import ReportDialog from "../../components/ReportDialog";
import { useErrorAlert } from "../../components/Alerts";
import {
  MaxGameMessageLength,
  MaxTextInputLength,
  MaxWillLength,
} from "../../Constants";
import { textIncludesSlurs } from "../../lib/profanity";

import "css/game.css";
import EmotePicker from "../../components/EmotePicker";
import "./Game.css";
import { NewLoading } from "../Welcome/NewLoading";
import StateSwitcher from "../../components/gameComponents/StateSwitcher";

import { randomizeMeetingTargetsWithSeed } from "../../utilsFolder";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";
import { useLongPress } from "../../hooks/useLongPress.jsx";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  TextField,
  Typography,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import { PlayerCount } from "../Play/LobbyBrowser/PlayerCount";
import { getSetupBackgroundColor } from "../Play/LobbyBrowser/gameRowColors.js";

import lore from "images/emotes/lore.webp";
import poison from "images/emotes/poison.webp";
import exit from "images/emotes/exit.png";
import veg from "images/emotes/veg.webp";
import system from "images/emotes/system.webp";
import { usePopover } from "components/Popover";

import dice1 from "images/emotes/dice1.webp";
import dice2 from "images/emotes/dice2.webp";
import dice3 from "images/emotes/dice3.webp";
import dice4 from "images/emotes/dice4.webp";
import dice5 from "images/emotes/dice5.webp";
import dice6 from "images/emotes/dice6.webp";
import { Timer } from "components/gameComponents/Timer";
import { ChangeHeadPing } from "components/gameComponents/ChangeHeadPing";

const emoteMap = {
  dice1: dice1,
  dice2: dice2,
  dice3: dice3,
  dice4: dice4,
  dice5: dice5,
  dice6: dice6,
};

export default function Game() {
  const { gameId } = useParams();
  return (
    <Routes>
      <Route path=":gameId" element={<GameWrapper key={gameId} />} />
      <Route path=":gameId/review" element={<GameWrapper review />} />
    </Routes>
  );
}

const NO_ONE_NAME = "no one";
const MAGUS_NAME = "Declare Magus Game";

function GameWrapper(props) {
  const [loaded, setLoaded] = useState(false);
  const [leave, setLeave] = useState(false);
  const [finished, setFinished] = useState(false);
  const [port, setPort] = useState();
  const [gameType, setGameType] = useState();
  const [startTime, setStartTime] = useState(Date.now());
  const [token, setToken] = useState();
  const [socket, setSocket] = useState({});
  const [connected, setConnected] = useState(0);
  const [setup, setSetup] = useState();
  const [options, setOptions] = useState({});
  const [emojis, setEmojis] = useState({});
  const [history, updateHistory] = useHistoryReducer(false);
  const [stateViewing, updateStateViewing] = useStateViewingReducer(history);
  const [players, updatePlayers] = usePlayersReducer();
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isSpectator, setIsSpectator] = useState(false);
  const [self, setSelf] = useState();
  const [lastWill, setLastWill] = useState("");
  const [settings, updateSettings] = useSettingsReducer();
  const [showFirstGameModal, setShowFirstGameModal] = useState(false);
  const [speechFilters, setSpeechFilters] = useState({
    from: "",
    contains: "",
  });
  const [isolationEnabled, setIsolationEnabled] = useState(false);
  const [isolatedPlayers, setIsolatedPlayers] = useState(new Set());
  const [rehostId, setRehostId] = useState();
  const [dev, setDev] = useState(false);
  const [pingInfo, setPingInfo] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const playersRef = useRef();
  const selfRef = useRef();
  const noLeaveRef = useRef();

  const [playAudio, loadAudioFiles, stopAudio, stopAudios, setVolume] =
    useAudio(settings);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();
  const { gameId } = useParams();
  const [selectedPanel, setSelectedPanel] = useState("chat");

  const isParticipant = !isSpectator && !props.review;
  const currentStateObject = history.states[history.currentState];
  const unresolvedActionCount = Object.values(
    currentStateObject ? currentStateObject.meetings : {}
  ).filter(
    (meeting) => !meeting.playerHasVoted && meeting.voting && meeting.canVote
  ).length;

  function onLeaveGameClick() {
    if (
      history.currentState == -1 ||
      history.currentState == -2 ||
      finished ||
      !isParticipant
    ) {
      leaveGame();
    } else {
      setLeaveDialogOpen(true);
    }
  }

  function leaveGame() {
    if (finished) siteInfo.hideAllAlerts();

    if (socket.on) socket.send("leave");
    else setLeave(true);

    setLeaveDialogOpen(false);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onLeaveGameClick();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [persistentGameData, updatePersistentGameData] = useReducer(
    (state, action) => {
      let newState = state;
      let persistAfterAction = true;

      switch (action.type) {
        case "addPinnedMessage": {
          if (action.message && action.message.id) {
            newState = update(state, {
              pinnedMessages: {
                [action.message.id]: { $set: action.message },
              },
            });
          }
          break;
        }
        case "removePinnedMessage": {
          if (action.messageId) {
            newState = update(state, {
              pinnedMessages: {
                $unset: [action.messageId],
              },
            });
          }
          break;
        }
        case "toggleRolePrediction": {
          if (action.prediction === null) {
            newState = update(state, {
              rolePredictions: {
                $unset: [action.playerId],
              },
            });
          } else {
            newState = update(state, {
              rolePredictions: {
                [action.playerId]: { $set: action.prediction },
              },
            });
          }
          break;
        }
        case "setPersistentGameData": {
          persistAfterAction = false;
          newState = action.state;
          break;
        }
        default: {
          throw Error("Unknown action: " + action.type);
        }
      }

      if (persistAfterAction) {
        // Save data in localStorage for remembering it in future refreshes
        window.localStorage.setItem(
          "persistentGameData",
          JSON.stringify({
            state: newState,
            gameId: gameId,
          })
        );
      }

      return newState;
    },
    {
      rolePredictions: {},
      pinnedMessages: {},
    }
  );

  // If a user refreshes, retain their persistent game data
  useEffect(() => {
    let _persistentGameData = window.localStorage.getItem("persistentGameData");

    if (_persistentGameData) {
      _persistentGameData = JSON.parse(_persistentGameData);

      if (_persistentGameData.gameId !== gameId) {
        window.localStorage.removeItem("persistentGameData");
      } else {
        updatePersistentGameData({
          type: "setPersistentGameData",
          state: _persistentGameData.state,
        });
      }
    }
  }, []);

  function isMessagePinned(message) {
    return message && message.id in persistentGameData.pinnedMessages;
  }

  function onPinMessage(message) {
    if (isMessagePinned(message)) {
      updatePersistentGameData({
        type: "removePinnedMessage",
        messageId: message.id,
      });
    } else {
      updatePersistentGameData({
        type: "addPinnedMessage",
        message: message,
      });
    }
  }

  const audioFileNames = ["bell", "ping", "tick", "vegPing"];
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

  const toggleRolePrediction = (playerId, prediction) => {
    updatePersistentGameData({
      type: "toggleRolePrediction",
      playerId: playerId,
      prediction: prediction,
    });
  };

  useEffect(() => {
    if (token == null) return;

    var socketURL;

    if (import.meta.env.REACT_APP_USE_PORT === "true")
      socketURL = `${import.meta.env.REACT_APP_SOCKET_PROTOCOL}://${
        import.meta.env.REACT_APP_SOCKET_URI
      }:${port}`;
    else
      socketURL = `${import.meta.env.REACT_APP_SOCKET_PROTOCOL}://${
        import.meta.env.REACT_APP_SOCKET_URI
      }/${port}`;

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
      loadAudioFiles(audioFileNames, audioLoops, audioOverrides, audioVolumes);
      requestNotificationAccess();

      function onKeydown() {
        var speechInput = document.getElementById("speechInput");
        var activeElName = document.activeElement.tagName;

        if (
          speechInput &&
          activeElName !== "INPUT" &&
          activeElName !== "TEXTAREA"
        )
          speechInput.focus();
      }

      window.addEventListener("keydown", onKeydown);

      return () => {
        window.removeEventListener("keydown", onKeydown);

        stopAudio();
      };
    } else {
      document.title = `Review Game ${gameId} | UltiMafia`;

      axios
        .get(`/api/game/${gameId}/review/data`)
        .then((res) => {
          var data = res.data;

          if (data.broken) {
            setLeave(true);
            errorAlert("Game not found.");
            return;
          }

          setGameType(data.type);
          setSetup(data.setup);
          setStartTime(data.startTime);

          setOptions({
            lobby: data.lobby,
            ranked: data.ranked,
            competitive: data.competitive,
            spectating: data.spectating,
            private: false,
            anonymousGame: data.anonymousGame,
            anonymousDeck: data.anonymousDeck,
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
              customEmotes:
                data.users[i] && data.users[i].settings.customEmotes,
              left: data.left.indexOf(data.players[i]) !== -1,
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

  useEffect(() => {
    if (socket.readyState !== 1) {
      if (
        (socket.readyState == null || socket.readyState === 3) &&
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
        isBot: window.location.search === "?bot",
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

    socket.on("finished", () => setFinished(true));

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

    socket.on("obituaries", (info) => {
      updateHistory({
        type: "obituaries",
        obituariesMessage: info,
      });
    });

    // socket.on("winners", (info) => {
    //   updateHistory({
    //     type: "winners",
    //     winnersMessage: info,
    //   });
    // });

    socket.on("reveal", (info) => {
      toggleRolePrediction(info.playerId, null);

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

      const iWasPinged =
        pings.indexOf("@" + playersRef?.current?.[selfRef?.current]?.name) !==
        -1;
      if (
        selfRef.current &&
        playersRef.current[selfRef.current] &&
        (iWasPinged || pings.some((p) => p.startsWith("@every")))
      ) {
        playAudio("ping");
        if (iWasPinged) {
          const senderName = playersRef?.current?.[message?.senderId]?.name;
          setPingInfo({
            msg: `⚠ ${senderName} pinged you!`,
            timestamp: new Date().getTime(),
          });
        }
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

    socket.on("isSpectator", () => {
      setIsSpectator(true);
    });

    socket.on("left", () => {
      if (!noLeaveRef.current) {
        setLeave(true);
        siteInfo.hideAllAlerts();
      }
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
    const urlParams = new URLSearchParams(window.location.search);
    const isSpectating = urlParams.get("spectate") === "true";

    const url = `/api/game/${gameId}/connect${
      isSpectating ? "?spectate=true" : ""
    }`;

    axios
      .get(url)
      .then((res) => {
        setGameType(res.data.type);
        setPort(res.data.port);
        setToken(res.data.token || false);
      })
      .catch((e) => {
        var msg = e && e.response && e.response.data;
        if (msg === "Game not found.") setLeave("review");
        else {
          setLeave(true);
          errorAlert(e);
        }
      });
  }

  function onMessageQuote(message) {
    if (
      !props.review &&
      message.senderId !== "server" &&
      !message.isQuote &&
      message.quotable
    ) {
      socket.send("quote", {
        messageId: message.id,
        toMeetingId: history.states[history.currentState].selTab,
        fromMeetingId: message.meetingId,
        fromState: message.fromState ? message.fromState : stateViewing,
        messageContent: message.content,
      });
    }
  }

  function getSetupGameSetting(gameSetting) {
    if (setup && setup.gameSettings && gameSetting in setup.gameSettings) {
      return setup.gameSettings[gameSetting];
    }

    return null;
  }

  if (leave === "review") return <Navigate to={`/game/${gameId}/review`} />;
  else if (leave) return <Navigate to="/play" />;
  else if (rehostId) return <Navigate to={`/game/${rehostId}`} />;
  else if (!loaded || stateViewing == null)
    return (
      <div className="game">
        <NewLoading />
      </div>
    );
  else {
    const gameContext = {
      gameId: gameId,
      socket: socket,
      review: props.review,
      gameType: gameType,
      setup: setup,
      getSetupGameSetting: getSetupGameSetting,
      startTime: startTime,
      history: history,
      updateHistory: updateHistory,
      unresolvedActionCount: unresolvedActionCount,
      stateViewing: stateViewing,
      updateStateViewing: updateStateViewing,
      self: self,
      isSpectator: isSpectator,
      isParticipant: isParticipant,
      players: players,
      updatePlayers: updatePlayers,
      options: options,
      spectatorCount: spectatorCount,
      lastWill: lastWill,
      emojis: emojis,
      setLeave: setLeave,
      onLeaveGameClick: onLeaveGameClick,
      leaveGame: leaveGame,
      finished: finished,
      settings: settings,
      selectedPanel: selectedPanel,
      setSelectedPanel: setSelectedPanel,
      updateSettings: updateSettings,
      speechFilters: speechFilters,
      setSpeechFilters: setSpeechFilters,
      isolationEnabled,
      setIsolationEnabled,
      isolatedPlayers,
      togglePlayerIsolation,
      rolePredictions: persistentGameData.rolePredictions,
      toggleRolePrediction,
      pinnedMessages: persistentGameData.pinnedMessages,
      onPinMessage: onPinMessage,
      isMessagePinned: isMessagePinned,
      onMessageQuote: onMessageQuote,
      loadAudioFiles: loadAudioFiles,
      playAudio: playAudio,
      stopAudio: stopAudio,
      stopAudios: stopAudios,
      setRehostId: setRehostId,
      noLeaveRef,
      dev: dev,
    };

    return (
      <GameContext.Provider value={gameContext}>
        <ChangeHeadPing title={pingInfo?.msg} timestamp={pingInfo?.timestamp} />
        <Stack
          direction="column"
          sx={{
            height: "100%",
          }}
        >
          <Box
            className="game no-highlight"
            sx={{
              backgroundColor: "background.paper",
            }}
          >
            <FirstGameModal
              showModal={showFirstGameModal}
              setShowModal={setShowFirstGameModal}
            />
            {gameType === "Mafia" && <MafiaGame />}
            {gameType === "Resistance" && <ResistanceGame />}
            {gameType === "Jotto" && <JottoGame />}
            {gameType === "Acrotopia" && <AcrotopiaGame />}
            {gameType === "Secret Dictator" && <SecretDictatorGame />}
            {gameType === "Wacky Words" && <WackyWordsGame />}
            {gameType === "Liars Dice" && <LiarsDiceGame />}
            {gameType === "Texas Hold Em" && <TexasHoldEmGame />}
            {gameType === "Cheat" && <CheatGame />}
            {gameType === "Battlesnakes" && <BattlesnakesGame />}
            {gameType === "Connect Four" && <ConnectFourGame />}
          </Box>
        </Stack>
        <LeaveGameDialog
          open={leaveDialogOpen}
          onClose={() => setLeaveDialogOpen(false)}
          onConfirm={leaveGame}
        />
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

export function TopBar({ hideStateSwitcher = false }) {
  const game = useContext(GameContext);

  const theme = useTheme();
  const isPhoneDevice = useIsPhoneDevice();
  const { gameId } = useParams();
  const errorAlert = useErrorAlert();
  const siteInfo = useContext(SiteInfoContext);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  function onTestClick() {
    for (let i = 0; i < game.setup.total - 1; i++)
      window.open(window.location + "?bot");
  }

  function onReportClick() {
    setReportDialogOpen(true);
  }

  function onRehostGameClick() {
    game.noLeaveRef.current = true;

    if (game.socket.on) game.socket.send("leave");

    setTimeout(() => {
      var stateLengths = {};

      for (let stateName in game.options.stateLengths)
        stateLengths[stateName] = game.options.stateLengths[stateName] / 60000;

      axios
        .post("/api/game/host", {
          rehost: gameId,
          gameType: game.gameType,
          setup: game.setup.id,
          lobby: game.options.lobby,
          private: game.options.private,
          spectating: game.options.spectating,
          guests: game.options.guests,
          ranked: game.options.ranked,
          competitive: game.options.competitive,
          stateLengths: stateLengths,
          ...game.options.gameTypeOptions,
        })
        .then((res) => game.setRehostId(res.data))
        .catch((e) => {
          game.noLeaveRef.current = false;
          errorAlert(e);
        });
    }, 500);
  }

  function onArchiveGameClick() {
    axios
      .post(`/api/game/${gameId}/archive`)
      .then((res) => {
        siteInfo.showAlert(res.data, "success");
      })
      .catch((e) => {
        errorAlert(e);
      });
  }

  if (isPhoneDevice && game.selectedPanel !== "info") {
    // The top bar doubles as an info panel for mobile
    return <></>;
  }

  const logo = (
    <div style={{ flex: "1" }} key="logo">
      <Link to="/play" target="_blank" rel="noopener noreferrer">
        <SiteLogo
          sx={{
            height: 75,
            width: 145,
          }}
        />
      </Link>
    </div>
  );

  const stateSwitcher = (
    <Stack
      direction="column"
      spacing={1}
      key="stateSwitcher"
      sx={{
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
    >
      {!hideStateSwitcher && (
        <Paper>
          <StateSwitcher />
        </Paper>
      )}
    </Stack>
  );

  const setup = game.setup ? (
    <Setup
      setup={game.setup}
      backgroundColor={getSetupBackgroundColor(game.options, false)}
    />
  ) : (
    <></>
  );

  const buttonGroup = (
    <ButtonGroup
      variant="contained"
      sx={{
        alignSelf: "stretch",
        backgroundColor: theme.palette.secondary.main,
        borderRadius: 1,
      }}
    >
      {game.review && (
        <Tooltip title="Archive">
          <IconButton size="large" onClick={onArchiveGameClick}>
            <img src={lore} alt="Archive" />
          </IconButton>
        </Tooltip>
      )}

      {game.dev && game.history.currentState == -1 && (
        <Tooltip title="Fill">
          <IconButton size="large" onClick={onTestClick}>
            <img src={poison} alt="Fill" />
          </IconButton>
        </Tooltip>
      )}

      {!game.review && game.history.currentState === -2 && (
        <Tooltip title="Rehost">
          <IconButton size="large" onClick={onRehostGameClick}>
            <img src={veg} alt="Rehost" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="File Report">
        <IconButton size="large" onClick={onReportClick}>
          <img src={system} alt="Report" />
        </IconButton>
      </Tooltip>
      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        prefilledArgs={{ game: gameId }}
      />

      {!isPhoneDevice && (
        <Button
          onClick={game.onLeaveGameClick}
          startIcon={<img src={exit} alt="Leave" />}
        >
          Leave
        </Button>
      )}
    </ButtonGroup>
  );

  if (!isPhoneDevice) {
    // DESKTOP ================================================================
    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 1,
          alignItems: "center",
        }}
      >
        {logo}
        {stateSwitcher}
        <Stack
          direction="row"
          spacing={1}
          key="miscWrapper"
          ref={game.scrollDownTriggerRef}
          sx={{
            alignItems: "center",
            flex: "1",
          }}
        >
          {setup}
          {buttonGroup}
        </Stack>
      </Stack>
    );
  } else {
    // MOBILE ================================================================
    return (
      <Stack
        direction="column"
        spacing={1}
        sx={{
          p: 1,
        }}
      >
        <Stack direction="row" spacing={1}>
          {logo}
          {buttonGroup}
        </Stack>
        {setup}
      </Stack>
    );
  }
}

function UnresolvedActionCount({ children }) {
  const game = useContext(GameContext);

  const { isParticipant, unresolvedActionCount } = game;

  const hideBadge = !isParticipant || unresolvedActionCount === 0;

  return (
    <Badge
      badgeContent={unresolvedActionCount}
      color="primary"
      invisible={hideBadge}
      sx={{
        "& .MuiBadge-badge": {
          transform: "scale(1) translate(100%, -50%)",
        },
      }}
    >
      {children}
    </Badge>
  );
}

function MobileMenu() {
  const game = useContext(GameContext);

  const menuContent = (
    <Stack
      direction="column"
      sx={{
        flex: "1",
        p: 1,
      }}
    >
      <SettingsForm />
      <Button
        onClick={game.onLeaveGameClick}
        startIcon={<img src={exit} alt="Leave" />}
        sx={{
          mt: "auto",
        }}
      >
        Leave
      </Button>
    </Stack>
  );

  return <SideMenu scrollable title="Settings" content={menuContent} />;
}

export function MobileLayout({
  singleState = false,
  outerLeftNavigationProps = {
    label: "Players",
    value: "players",
    icon: <i className="fas fa-user" />,
  },
  outerLeftContent = <PlayerList />,
  centerContent = <TextMeetingLayout />,
  innerRightNavigationProps = {
    label: "Actions",
    value: "actions",
    icon: (
      <UnresolvedActionCount>
        <i className="fas fa-bolt" />
      </UnresolvedActionCount>
    ),
  },
  innerRightContent = <ActionList />,
  additionalInfoContent = <></>,
}) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();

  if (!isPhoneDevice) {
    // Mobile only
    return <></>;
  }

  const { selectedPanel, setSelectedPanel } = game;

  function onBottomNavigationChange(event, newValue) {
    if (newValue === "leave") {
      onLeaveGameClick();
    } else {
      setSelectedPanel(newValue);
    }
  }

  return (
    <>
      {selectedPanel === outerLeftNavigationProps.value && outerLeftContent}
      {/* The additionalInfoContent displays after the mobile version of TopBar */}
      {selectedPanel === "info" && (
        <>
          <div style={{ flex: "1" }} />
          {additionalInfoContent}
        </>
      )}
      {selectedPanel === "chat" && centerContent}
      {selectedPanel === innerRightNavigationProps.value && innerRightContent}
      {selectedPanel === "menu" && <MobileMenu />}
      <Paper elevation={3}>
        <Divider orientation="horizontal" />
        <BottomNavigation
          showLabels
          value={selectedPanel}
          onChange={onBottomNavigationChange}
          sx={{
            "& > .MuiBottomNavigationAction-root": {
              minWidth: "unset",
              width: "56px",
            },
          }}
        >
          <BottomNavigationAction {...outerLeftNavigationProps} />
          <BottomNavigationAction
            label="Info"
            value="info"
            icon={<i className="fas fa-info" />}
          />
          <Stack
            direction="row"
            onClick={() => setSelectedPanel("chat")}
            sx={{
              filter: selectedPanel !== "chat" ? "grayscale(100%)" : undefined,
            }}
          >
            {!singleState && <Divider orientation="vertical" flexItem />}
            <StateSwitcher stateRange={singleState ? 0 : undefined} />
            {!singleState && <Divider orientation="vertical" flexItem />}
          </Stack>
          <BottomNavigationAction {...innerRightNavigationProps} />
          <BottomNavigationAction
            label="Menu"
            value="menu"
            icon={<i className="fas fa-bars" />}
          />
        </BottomNavigation>
      </Paper>
    </>
  );
}

export function ThreePanelLayout({
  leftPanelContent,
  centerPanelContent,
  rightPanelContent,
}) {
  const isPhoneDevice = useIsPhoneDevice();

  if (isPhoneDevice) {
    // Desktop only
    return <></>;
  }

  return (
    <Stack className="main" direction="row" sx={{ gap: 2 }}>
      <div className="left-panel panel with-radial-gradient">
        {leftPanelContent}
      </div>
      <div className="center-panel panel with-radial-gradient">
        {centerPanelContent}
      </div>
      <div className="right-panel panel with-radial-gradient">
        {rightPanelContent}
      </div>
    </Stack>
  );
}

export function TextMeetingLayout({ combineMessagesFromAllMeetings = false }) {
  const game = useContext(GameContext);
  const { isolationEnabled, isolatedPlayers } = game;
  const { history, players, stateViewing, updateHistory, settings, filters } =
    game;

  const stateInfo = history.states[stateViewing];
  const meetings = stateInfo ? stateInfo.meetings : {};
  const alerts = stateInfo ? stateInfo.alerts : [];
  const obituaries = stateInfo ? stateInfo.obituaries : {};
  const selTab = stateInfo && stateInfo.selTab;

  const [speechInput, setSpeechInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [mouseMoved, setMouseMoved] = useState(false);
  const speechDisplayRef = useRef();

  const speechMeetings = Object.values(meetings).filter(
    (meeting) => meeting.speech
  );

  function onTabChange(event, newValue) {
    updateHistory({
      type: "selTab",
      state: stateViewing,
      meetingId: newValue,
    });
    setAutoScroll(true);
  }

  useEffect(() => doAutoScroll());

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
    if (stateViewing === history.currentState) setAutoScroll(true);
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

  function onSpeechScroll() {
    if (!mouseMoved) {
      doAutoScroll();
      return;
    }

    var speech = speechDisplayRef.current;

    if (
      Math.round(speech.scrollTop + speech.clientHeight) >=
      Math.round(speech.scrollHeight - 5)
    )
      setAutoScroll(true);
    else setAutoScroll(false);
  }

  const tabs = speechMeetings.map((meeting) => {
    return (
      <div
        className={`tab ${selTab === meeting.id ? "sel" : ""}`}
        key={meeting.id}
        onClick={() => onTabClick(meeting.id)}
      >
        {meeting.name}
      </div>
    );
  });

  function shouldChainToPreviousMessage(message, previousMessage) {
    if (!previousMessage) {
      return false;
    }

    if (message.senderId === "server" || message.senderId === "anonymous") {
      return false;
    }

    if (Math.abs(message.time - previousMessage.time) > 30000) {
      return false;
    }

    if (message.senderId === previousMessage.senderId) {
      return true;
    } else {
      return false;
    }
  }

  const messages = useMemo(() => {
    var messageData;
    if (combineMessagesFromAllMeetings) {
      messageData = getAllMessagesToDisplay(history);
    } else {
      messageData = getMessagesToDisplay(
        meetings,
        alerts,
        obituaries,
        selTab,
        players,
        settings,
        filters
      );
    }

    var previousMessage = null;
    return messageData.map((message, i) => {
      const isNotServerMessage = message.senderId !== "server";
      const unfocusedMessage =
        isolationEnabled &&
        isNotServerMessage &&
        isolatedPlayers.size &&
        !isolatedPlayers.has(message.senderId);

      const chainToPrevious = shouldChainToPreviousMessage(
        message,
        previousMessage
      );
      previousMessage = message;

      return (
        <Message
          message={message}
          review={game.review}
          history={history}
          players={players}
          stateViewing={stateViewing}
          key={message.id || message.messageId + message.time || i}
          onMessageQuote={game.onMessageQuote}
          onPinMessage={game.onPinMessage}
          isMessagePinned={game.isMessagePinned}
          settings={settings}
          unfocusedMessage={unfocusedMessage}
          chainToPrevious={chainToPrevious}
        />
      );
    });
  }, [
    /* MEMO DEPENDENCIES: These variables can affect the messages that are rendered in the game.
       This is a performance improvement for preventing unnecessary re-renders caused by GameWrapper.
    */
    stateInfo,
    settings,
    filters,
    isolationEnabled,
    isolatedPlayers,
    game.pinnedMessages,
  ]);

  var canSpeak = selTab;
  canSpeak =
    canSpeak &&
    (meetings[selTab].members.length > 1 || history.currentState == -1);
  canSpeak =
    canSpeak &&
    stateViewing === history.currentState &&
    meetings[selTab].amMember &&
    meetings[selTab].canTalk;
  return (
    <>
      <Box
        className="meeting-tabs title-box"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Tabs
          value={selTab || false}
          onChange={onTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            flexGrow: 1,
            minHeight: 36,
            "& .MuiTab-root": {
              textTransform: "none",
              minHeight: 36,
              fontWeight: 500,
              fontSize: "0.9rem",
            },
          }}
        >
          {speechMeetings.map((meeting) => (
            <Tab
              key={meeting.id}
              value={meeting.id}
              label={meeting.name}
              sx={{ paddingX: 1.5 }}
            />
          ))}

          {speechMeetings.length === 0 && (
            <Tab
              value="noMeeting"
              label={stateInfo?.name || "No Meeting"}
              disabled
            />
          )}
        </Tabs>

        <Box sx={{ flexShrink: 0, ml: 1 }}>
          <Timer />
        </Box>
      </Box>

      <div className="speech-wrapper">
        <div
          className="speech-display"
          onScroll={onSpeechScroll}
          ref={speechDisplayRef}
        >
          {messages}
        </div>
        {canSpeak && (
          <SpeechInput
            meetings={meetings}
            selTab={selTab}
            players={players}
            options={game.options}
            socket={game.socket}
            setAutoScroll={setAutoScroll}
            speechInput={speechInput}
            setSpeechInput={setSpeechInput}
            whispersEnabled={game.getSetupGameSetting("Whispers")}
          />
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
  if (states[0] === "-2") {
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
  obituaries,
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
        content.toLowerCase().indexOf(filters.contains.toLowerCase()) !== -1;

      var playerName = players[m.senderId]?.name || "";
      matches =
        matches &&
        playerName.toLowerCase().indexOf(filters.from.toLowerCase()) !== -1;

      return matches;
    });

  for (let alert of alerts) {
    for (let i = 0; i <= messages.length; i++) {
      if (i === messages.length) {
        messages.push(alert);
        break;
      } else if (alert.time < messages[i].time) {
        messages.splice(i, 0, alert);
        break;
      }
    }
  }

  for (let source in obituaries) {
    const obituariesMessage = obituaries[source];
    for (let i = 0; i <= messages.length; i++) {
      if (i === messages.length) {
        messages.push(obituariesMessage);
        break;
      } else if (obituariesMessage.time < messages[i].time) {
        messages.splice(i, 0, obituariesMessage);
        break;
      }
    }
  }

  //   for (let source in winners) {
  //   const winnersMessage = winners[source];
  //   for (let i = 0; i <= messages.length; i++) {
  //     if (i === messages.length) {
  //       messages.push(winnersMessage);
  //       break;
  //     } else if (winnersMessage.time < messages[i].time) {
  //       messages.splice(i, 0, winnersMessage);
  //       break;
  //     }
  //   }
  // }

  if (!settings.votingLog) return messages;

  var voteRecord;

  if (selTab) voteRecord = meetings[selTab].voteRecord;
  else voteRecord = [];

  for (let meetingId in meetings)
    if (!meetings[meetingId].speech)
      voteRecord = voteRecord.concat(meetings[meetingId].voteRecord);

  for (let vote of voteRecord) {
    let isUnvote = vote.type === "unvote";
    let voter = players[vote.voterId];
    let voterName = voter ? voter.name : "Anonymous";
    let target = vote.target;

    if (!isUnvote) {
      if (target !== "*" && players[target]) target = players[target].name;
      else if (target === "*") target = NO_ONE_NAME;
    }

    let voteMsg = {
      senderId: "vote",
      content: `${voterName} ${isUnvote ? "unvotes" : "votes"} ${
        isUnvote ? "" : target
      }`,
      time: vote.time,
    };

    for (let i = 0; i <= messages.length; i++) {
      if (i === messages.length) {
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

function getContentClasses(message) {
  const contentClasses = ["content"];

  const tags = message.tags || [];

  const isVoteMessage = message.senderId === "vote";
  const isServerMessage = message.senderId === "server";
  const isAnonymousMessage = message.senderId === "anonymous";
  const isPlayerMessage =
    !isVoteMessage && !isServerMessage && !isAnonymousMessage;

  // First: get class for importance of message
  if (tags.includes("important")) contentClasses.push("important");
  else if (tags.includes("info")) contentClasses.push("info");
  else contentClasses.push("important");

  // Second: get class for kind of message
  if (message.isQuote) contentClasses.push("quote");
  else if (isServerMessage) contentClasses.push("server");
  else if (isVoteMessage) contentClasses.push("vote-record");

  // Make content clickable if it's quotable
  if ((isPlayerMessage || isAnonymousMessage) && !message.isQuote) {
    contentClasses.push("clickable");
  }

  return contentClasses;
}

/* CAUTION: This is rendered with useMemo in TextMeetingLayout, if you want to add something new to messages
    then you may need to update the memo dependencies!
*/
function Message(props) {
  const isPhoneDevice = useIsPhoneDevice();
  const user = useContext(UserContext);
  const [isHovering, setIsHovering] = useState(false);

  // Mobile only - users pin message by long pressing them
  const messageLongPress = useLongPress(
    () => props.onPinMessage(props.message),
    300
  );

  const history = props.history;
  const players = props.players;
  const chainToPrevious = props.chainToPrevious;
  var message = props.message;

  // message type flags
  const isVoteMessage = message.senderId === "vote";
  const isServerMessage = message.senderId === "server";
  const isAnonymousMessage = message.senderId === "anonymous";
  const isPlayerMessage =
    !isVoteMessage && !isServerMessage && !isAnonymousMessage;

  const hasNameplate = isPlayerMessage || isAnonymousMessage;
  const isRightAligned = isVoteMessage;

  // layout flags
  const messageLayout = props.forceDefaultStyling
    ? "default"
    : props?.settings?.messageLayout || "default";
  const denseMessages =
    messageLayout === "compactInline" || messageLayout === "compactAligned";
  const alignedNameplate = hasNameplate && messageLayout === "compactAligned";

  // nameplate styling
  const absoluteLeftAvatarPx = denseMessages ? undefined : "8px";
  const smallAvatar = messageLayout === "defaultLarge" ? false : true;

  const extraStyle = message.extraStyle;
  var player, quotedMessage;
  var contentClass = getContentClasses(message).join(" ") + " ";

  const useAbsoluteTimestamp =
    (chainToPrevious || isServerMessage) && !isRightAligned && !denseMessages;
  const showThumbtack =
    !props.review && !message.isQuote && isHovering && props.stateViewing >= 0;
  const thumbtackFaClass = props.isMessagePinned(message)
    ? "fas fa-thumbtack"
    : "fas fa-thumbtack fa-rotate-270";

  // If message is obituary, then short circuit and render that instead
  if (message.obituaries) {
    return (
      <ObituariesMessage
        message={message}
        stateViewing={props.stateViewing}
        settings={props.settings}
        history={history}
      />
    );
  }

  // If message is winners, render the WinnersMessage instead
  // if (message.winners) {
  //   return (
  //     <WinnersMessage
  //       message={message}
  //       stateViewing={props.stateViewing}
  //       settings={props.settings}
  //       history={history}
  //     />
  //   );
  // }

  if (isPlayerMessage) {
    player = players[message.senderId];
  }
  var customEmotes = player ? player.customEmotes : null;

  if (message.isQuote) {
    var state = history.states[message.fromState];

    if (!state) return <></>;

    var meeting = state.meetings[message.fromMeetingId];

    if (!meeting) return <></>;

    for (let msg of meeting.messages) {
      if (msg.id === message.messageId) {
        quotedMessage = { ...msg };
        quotedMessage.meetingName = meeting.name;
        quotedMessage.fromStateName = state.name;
        customEmotes = msg.customEmotes; // allow players to use other players' custom emotes if they quote them

        if (msg.senderId === "anonymous")
          quotedMessage.senderName = "Anonymous";
        else quotedMessage.senderName = players[msg.senderId].name;
        break;
      }
    }
  }

  if (message.isQuote && !quotedMessage) return <></>;

  if (!message.isQuote && message.content?.indexOf("/me ") === 0) {
    message = { ...message };
    message.content = message.content.replace("/me ", "");
    contentClass += "me ";
  }

  const messageStyle = {};
  if (props.unfocusedMessage) {
    messageStyle.opacity = "0.2";
  }

  // Make room for floated avatar if not using compact messages by padding the left side of the message
  if (!denseMessages) {
    if (smallAvatar || !hasNameplate) {
      messageStyle.paddingLeft = "32px"; // 24px avatar + 8px margin
    } else {
      messageStyle.paddingLeft = "56px"; // 40px avatar + 8px margin + 8px margin
    }
  }

  if (!denseMessages && !chainToPrevious) {
    messageStyle.marginTop = "8px";
  }

  if (isRightAligned) {
    messageStyle.justifyContent = "flex-end";
  }

  const stateMeetings = history.states[props.stateViewing].meetings;
  const stateMeetingDefined =
    stateMeetings !== undefined &&
    stateMeetings[message.meetingId] !== undefined;

  const playerDead =
    props.stateViewing >= 0 &&
    message.alive !== undefined &&
    message.alive !== true;

  var canHaveGreenText = false;
  if (player !== undefined) {
    const playerFiddled =
      message.content?.includes(
        player.name + " says something, but you cannot hear them!"
      ) || false;
    if (playerDead) {
      contentClass += "dead ";
    } else if (
      stateMeetingDefined &&
      stateMeetings[message.meetingId].name === "Party!"
    ) {
      contentClass += "party ";
    } else if (
      player.anonId == undefined &&
      player.birthday !== undefined &&
      areSameDay(Date.now(), player.birthday)
    ) {
      contentClass += " party ";
    } else if (playerFiddled) {
      contentClass += "fiddled ";
    } else {
      canHaveGreenText = true;
    }
  }

  if (canHaveGreenText && message.content?.startsWith(">")) {
    contentClass += "greentext ";
  }

  if (denseMessages && isPlayerMessage) {
    contentClass += "dense ";
  }

  let avatarId;

  if (player !== undefined) {
    if (Object.keys(message.textColor ?? {}).length === 2) {
      message.textColor = message.textColor["darkTheme"];
    }

    avatarId = player.anonId === undefined ? player.userId : player.anonId;
    if (player.anonId !== undefined) {
      // message.textColor = (player.textColor !== undefined && player.textColor !== "") ? player.textColor : "";
      message.nameColor = "";
    }

    if (Object.keys(message.nameColor ?? {}).length === 2) {
      message.nameColor = message.nameColor["darkTheme"];
    }
  }

  function messageOnMouseEnter() {
    setIsHovering(true);
  }

  function messageOnMouseLeave() {
    setIsHovering(false);
  }

  // if right aligned, use flex direction row-reverse to put timestamp on right hand side
  // otherwise if in compact mode AKA denseMessages, use inline display to keep everyone on one line if possible
  // otherwise, use flex direction column when in non-compact mode so that nameplate can appear above content
  // otherwise if there is no nameplate, use row to always keep everything on the same line
  const innerClassName = isRightAligned
    ? "message-inner-rightaligned"
    : hasNameplate && denseMessages
    ? "message-inner-inline"
    : hasNameplate
    ? "message-inner-nameplated"
    : "message-inner-onelined";

  const nameplateClassName = alignedNameplate
    ? "nameplate-aligned"
    : "nameplate";

  return (
    <div
      className="message"
      onDoubleClick={() => props.onMessageQuote(message)}
      style={messageStyle}
      onMouseEnter={messageOnMouseEnter}
      onMouseLeave={messageOnMouseLeave}
      onTouchStart={messageLongPress.onTouchStart}
      onTouchEnd={messageLongPress.onTouchEnd}
    >
      <div className={innerClassName}>
        {(!chainToPrevious || denseMessages || isRightAligned) && (
          <div
            className={nameplateClassName}
            style={{
              flexDirection: denseMessages ? "row" : undefined,
            }}
          >
            &#8203;
            {props.settings.timestamps && (
              <div
                style={{
                  position: useAbsoluteTimestamp ? "absolute" : undefined,
                  left: useAbsoluteTimestamp ? "4px" : undefined,
                }}
              >
                <Timestamp time={message.time} />
              </div>
            )}
            {player && (
              <NameWithAvatar
                dead={playerDead && props.stateViewing > 0}
                id={player.userId}
                avatarId={avatarId}
                name={player.name}
                avatar={player.avatar}
                color={
                  !user.settings?.ignoreTextColor && message.nameColor !== ""
                    ? message.nameColor
                    : ""
                }
                noLink
                small={smallAvatar}
                absoluteLeftAvatarPx={absoluteLeftAvatarPx}
              />
            )}
            {isAnonymousMessage && (
              <NameWithAvatar
                name="Anonymous"
                noLink
                small={smallAvatar}
                absoluteLeftAvatarPx={absoluteLeftAvatarPx}
              />
            )}
          </div>
        )}
        <div
          className={contentClass}
          style={{
            ...(!user.settings?.ignoreTextColor && message.textColor !== ""
              ? // ? { color: flipTextColor(message.textColor) }
                { color: message.textColor }
              : contentClass.includes("content")
              ? extraStyle
              : {}),
          }}
        >
          {!message.isQuote && (
            <>
              {message.prefix && (
                <div className="prefix" style={{ display: "inline" }}>
                  ({message.prefix})
                </div>
              )}
              <UserText
                text={message.content}
                settings={user.settings}
                players={players}
                customEmotes={customEmotes}
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
              <span className="quote-info">
                {`${quotedMessage.senderName} on ${quotedMessage.fromStateName}: `}
              </span>
              <span className="quote-content">
                <UserText
                  text={quotedMessage.content}
                  settings={user.settings}
                  players={players}
                  customEmotes={customEmotes}
                  filterProfanity
                  linkify
                  emotify
                  slangifySeed={quotedMessage.time.toString()}
                  iconUsername
                />
              </span>
              <i className="fas fa-quote-right" />
            </>
          )}
        </div>
      </div>
      {!isPhoneDevice && !isRightAligned && (
        <div
          className="pin-button-wrapper"
          onClick={() => props.onPinMessage(message)}
        >
          {showThumbtack && (
            <i
              className={thumbtackFaClass}
              style={{ cursor: "pointer", textAlign: "center" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// function WinnersMessage(props) {
//   const game = useContext(GameContext);
//   const message = props.message;

//   const winnersInfo = message.winners || {};
//   const winnerGroups = winnersInfo.groups || [];
//   const winnerPlayersByGroup = winnersInfo.players || {};
//   const winnerMessages = winnersInfo.messages || [];

//   let title = "Postgame Results";
//   if (winnerGroups.length === 1) {
//     title = `${winnerGroups[0]} Wins!`;
//   } else if (winnerGroups.length > 1) {
//     title = `${winnerGroups.join(" & ")} Win!`;
//   }

//   // didn't mess with deathMessage stuff
//   const wins = winnerGroups.map((group, index) => {
//     const groupPlayers = winnerPlayersByGroup[group] || [];
//     const groupMessage = winnerMessages[index] || `${group} has won.`;

//     return groupPlayers.length > 0
//       ? groupPlayers.map((player) => ({
//           id: player.userId || player.id,
//           name: player.name,
//           avatar: player.avatar,
//           avatarId: player.avatarId,
//           deathMessage: groupMessage,
//           revealMessage: `${player.name} was a member of the ${group}.`,
//           lastWill: "",
//         }))
//       : [
//           {
//             id: group,
//             name: group,
//             deathMessage: groupMessage,
//             revealMessage: "",
//             lastWill: "",
//           },
//         ];
//   });

//   const flattenedWins = wins.flat();

//   return (
//     <Newspaper
//       title={title}
//       timestamp={message.time}
//       dayCount={message.dayCount || 0}
//       deaths={flattenedWins}
//       isAlignmentReveal={false}
//     />
//   );
// }

function WinnersMessage(props) {
  const game = useContext(GameContext);
  const message = props.message;

  const winnersInfo = message.winners || {};
  const winnerGroups = winnersInfo.groups || [];
  const winnerPlayersByGroup = winnersInfo.players || {};
  const winnerMessages = winnersInfo.messages || [];

  let title = "Postgame Results";
  if (winnerGroups.length === 1) {
    title = `${winnerGroups[0]} Wins!`;
  } else if (winnerGroups.length > 1) {
    title = `${winnerGroups.join(" & ")} Win!`;
  }

  // didn't mess with deathMessage stuff
  const wins = winnerGroups.map((group, index) => {
    const groupPlayers = winnerPlayersByGroup[group] || [];
    const groupMessage = winnerMessages[index] || `${group} has won.`;

    return groupPlayers.length > 0
      ? groupPlayers.map((player) => ({
          id: player.userId || player.id,
          name: player.name,
          avatar: player.avatar,
          avatarId: player.avatarId,
          deathMessage: groupMessage,
          revealMessage: `${player.name} was a member of the ${group}.`,
          lastWill: "",
        }))
      : [
          {
            id: group,
            name: group,
            deathMessage: groupMessage,
            revealMessage: "",
            lastWill: "",
          },
        ];
  });

  const flattenedWins = wins.flat();

  return (
    <Newspaper
      title={title}
      timestamp={message.time}
      dayCount={message.dayCount || 0}
      deaths={flattenedWins}
      isAlignmentReveal={false}
    />
  );
}

export function Timestamp(props) {
  const time = new Date(props.time);

  var hours = String(time.getHours()).padStart(2, "0");
  var minutes = String(time.getMinutes()).padStart(2, "0");
  var seconds = String(time.getSeconds()).padStart(2, "0");

  return (
    <span className="time">
      {minutes}:{seconds}
    </span>
  );
}

function SpeechInput(props) {
  const socket = props.socket;
  const meetings = props.meetings;
  const selTab = props.selTab;
  const players = props.players;

  const speechInput = props.speechInput;
  const setSpeechInput = props.setSpeechInput;
  const [speechDropdownOptions, setSpeechDropdownOptions] = useState([]);
  const [speechDropdownValue, setSpeechDropdownValue] = useState("Say");
  const [lastTyped, setLastTyped] = useState(0);
  const [typingIn, setTypingIn] = useState();
  const [clearTyping, setClearTyping] = useState();
  const [checkboxOptions, setCheckboxOptions] = useState({});

  var placeholder = "";

  for (let option of speechDropdownOptions) {
    if (speechDropdownValue === option.id) {
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

        if (ability.targetType === "player")
          targetDisplay = players[target].name;

        newDropdownOptions.push({
          label: ability.name,
          placeholder: `${ability.verb} ${targetDisplay}`,
          id: `${ability.name}:${target}`,
        });
      }
    }
    if (props.whispersEnabled) {
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

      if (typingIn !== selTab) {
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
      (e.target.value[0] !== "/" || e.target.value.slice(0, 4) === "/me ") &&
      !meetings[selTab].anonymous &&
      speechDropdownValue === "Say"
    ) {
      setLastTyped(Date.now());
    }
  }

  function onSpeechSubmit(e) {
    if (e.key === "Enter" && selTab && speechInput.length) {
      const abilityInfo = speechDropdownValue.split(":");
      var abilityName = abilityInfo[0];
      var abilityTarget = abilityInfo[1];

      if (abilityName === "Say") abilityName = null;

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
        if (playerSeeds[i] === seedString) {
          matchedPlayers.push(playerNames[i]);
        }
      }
      if (matchedPlayers.length) {
        if (matchedPlayers.length === 1) {
          words.push(prefix + matchedPlayers[0]);
        } else {
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
        words.push("@everyone");
        setSpeechInput(words.join(" "));
      }
    }
  }

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
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        />
        <TextField
          id="speechInput"
          className="speech-input"
          fullWidth
          aria-autocomplete="none"
          name="MafiaSpeech"
          inputProps={{
            inputMode: "text",
            autoCorrect: "on",
            autoCapitalize: "on",
            autoComplete: "off",
            maxLength: MaxGameMessageLength,
          }}
          value={speechInput}
          placeholder={placeholder}
          onChange={onSpeechType}
          onKeyDown={onSpeechSubmit}
          enterKeyHint="done"
          sx={{
            "& fieldset": { border: "none" },
            input: { color: "var(--scheme-color-text)" },
          }}
        />
        <EmotePicker
          className="speech-dropdown"
          players={players}
          onEmoteSelected={onEmoteSelected}
        />
      </div>
    </div>
  );
}

export function SideMenu({
  title,
  lockIcon,
  content,
  scrollable,
  expanded,
  onChange,
  isAccordionMenu = false,
  defaultExpanded = false,
  disabled = false,
  contentPadding = "8px 16px",
}) {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange();
    }
  };

  if (!isAccordionMenu) {
    return (
      <div className={`side-menu ${scrollable ? "scrollable" : ""}`}>
        <Stack
          direction="row"
          spacing={1}
          className="title-box"
          sx={{
            alignItems: "center",
            p: 1,
            bgcolor: "var(--scheme-color-background)",
          }}
        >
          {lockIcon}
          {title}
        </Stack>
        <div className="side-menu-content">{content}</div>
      </div>
    );
  }

  return (
    <Accordion
      className={`side-menu ${scrollable ? "scrollable" : ""}`}
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      disableGutters
      onChange={handleToggle}
      disabled={disabled}
    >
      <AccordionSummary
        sx={{
          backgroundColor: "var(--scheme-color-sec)",
        }}
      >
        <Typography>
          {lockIcon}&nbsp;{title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        className="side-menu-content"
        sx={{
          padding: contentPadding, // Adjust padding inside the expanded section
        }}
      >
        {content}
      </AccordionDetails>
    </Accordion>
  );
}

function RoleMarkerToggle({ playerId, setup, toggleRolePrediction }) {
  const roleMarkerRef = useRef();

  const { InfoPopover, popoverOpen, handleClick, closePopover } = usePopover({
    path: `/api/setup/${setup.id}`,
    type: "rolePrediction",
    boundingEl: roleMarkerRef.current,
    title: "Mark Role as",
    postprocessData: (data) => {
      let roles = {};
      for (let r of JSON.parse(data.roles)) {
        Object.assign(roles, r);
      }

      data.roles = roles;
      data.makeRolePrediction = makeRolePrediction;
    },
  });

  const makeRolePrediction = useCallback(
    (prediction) => {
      toggleRolePrediction(playerId, prediction);
      closePopover();
    },
    [playerId]
  );

  return (
    <>
      {popoverOpen && <InfoPopover />}
      <div
        className="role-marker"
        onClick={handleClick}
        ref={roleMarkerRef}
        style={{
          cursor: "pointer",
        }}
      >
        <i className="fas fa-user-edit"></i>
      </div>
    </>
  );
}

export function PlayerRows({ players, className = "" }) {
  const game = useContext(GameContext);
  const [activity, updateActivity] = useActivity();

  useEffect(() => {
    if (socket && socket.on) {
      socket.on("typing", (info) => {
        updateActivity({
          type: "typing",
          playerId: info.playerId,
          meetingId: info.meetingId,
        });
      });
    }
  }, []);

  const {
    gameType,
    socket,
    history,
    setup,
    self,
    stateViewing,
    rolePredictions,
    toggleRolePrediction,
    isolationEnabled,
    togglePlayerIsolation,
    isolatedPlayers,
  } = game;
  const stateViewingInfo = history.states[stateViewing];
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
      Object.keys(history.states[history.currentState].dead).includes(self) ||
      players.find((x) => x.id === self) !== undefined;
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

    let avatarId;
    if (player !== undefined) {
      avatarId = player.anonId === undefined ? player.userId : player.anonId;
    }

    return (
      <div className={`player ${className ? className : ""}`} key={player.id}>
        {isolationCheckbox}
        {stateViewing !== -1 && (
          <RoleMarkerToggle
            playerId={player.id}
            setup={setup}
            toggleRolePrediction={toggleRolePrediction}
          />
        )}
        {stateViewing !== -1 && (
          <RoleCount
            role={roleToShow}
            key={roleToShow}
            gameType={gameType}
            showPopover
            otherRoles={setup?.roles}
          />
        )}
        <NameWithAvatar
          id={player.userId}
          avatarId={avatarId}
          name={player.name}
          avatar={player.avatar}
          color={player.nameColor}
          active={activity.speaking[player.id]}
          noLink={stateViewing >= 0 && game.options.anonymousGame}
          includeMiniprofile
          newTab
        />
        {selTab && showBubbles && activity.typing[player.id] === selTab && (
          <ReactLoading
            className={`typing-icon ${stateViewing != -1 ? "has-role" : ""}`}
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
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewingInfo = history.states[game.stateViewing];
  const alivePlayers = Object.values(game.players).filter(
    (p) => !stateViewingInfo.dead[p.id] && !p.left
  );
  const deadPlayers = Object.values(game.players).filter(
    (p) =>
      stateViewingInfo.dead[p.id] &&
      !p.left &&
      !stateViewingInfo.exorcised[p.id]
  );
  const exorcisedPlayers = Object.values(game.players).filter(
    (p) => stateViewingInfo.exorcised[p.id] && !p.left
  );

  const title = (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        width: "100%",
        alignItems: "center",
      }}
    >
      <Typography>Players</Typography>
      <Box sx={{ marginLeft: "auto !important" }}>
        <PlayerCount
          game={game}
          gameId={game.gameId}
          anonymousGame={game.options.anonymousGame}
          status={"In Progress"}
          numSlotsTaken={
            Object.values(game.players).filter((p) => !p.left).length
          }
          spectatingAllowed={game.options.spectating}
          spectatorCount={game.spectatorCount}
        />
      </Box>
    </Stack>
  );

  return (
    <SideMenu
      title={title}
      scrollable
      content={
        <div className="player-list">
          <PlayerRows players={alivePlayers} />
          {deadPlayers.length > 0 && (
            <div className="section-title">
              <i className="fas fa-skull" />
              Graveyard
            </div>
          )}
          <PlayerRows players={deadPlayers} className="dead" />
          {exorcisedPlayers.length > 0 && (
            <div className="section-title">
              <i className="fas fa-skull" />
              Underworld
            </div>
          )}
          <PlayerRows players={exorcisedPlayers} className="dead" />
        </div>
      }
    />
  );
}

export function OptionsList() {
  const game = useContext(GameContext);
  const gameOptions = game.options.gameTypeOptions;

  if (history.currentState !== -1) {
    return <></>;
  }

  const formatOptionName = (optionName) => {
    const words = optionName.split(/(?=[A-Z])/);
    const formattedWords = words.map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      } else {
        return ` ${word.charAt(0).toUpperCase() + word.slice(1)}`;
      }
    });
    return formattedWords.join("");
  };

  const formatOptionValue = (optionValue) => {
    if (typeof optionValue === "boolean") {
      return optionValue ? "Enabled" : "Disabled";
    }
    return optionValue;
  };

  return (
    <SideMenu
      title="Options"
      scrollable
      content={
        <table className="options-table">
          <tbody>
            {Object.entries(gameOptions).map(([optionName, optionValue]) => (
              <tr key={optionName}>
                <td className="option-name">{formatOptionName(optionName)}:</td>
                <td className="option-value">
                  {formatOptionValue(optionValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
}

export function ActionList({ title = "Actions", actionStyle = {} }) {
  const game = useContext(GameContext);

  const currentlyViewedState = game.history.states[game.stateViewing];
  const meetings = currentlyViewedState ? currentlyViewedState.meetings : {};

  const isParticipant = game.isParticipant;

  const actions = Object.values(meetings).reduce((actions, meeting) => {
    if (meeting.voting) {
      var action;

      switch (meeting.inputType) {
        case "player":
        case "boolean":
        case "role":
        case "alignment":
        case "custom":
        case "customBoolean":
        case "AllRoles":
        case "select":
          action = (
            <ActionSelect
              key={meeting.id}
              socket={game.socket}
              meeting={meeting}
              players={game.players}
              self={game.self}
              history={game.history}
              stateViewing={game.stateViewing}
              style={actionStyle}
            />
          );
          break;
        case "button":
          action = (
            <ActionButton
              key={meeting.id}
              socket={game.socket}
              meeting={meeting}
              players={game.players}
              self={game.self}
              history={game.history}
              stateViewing={game.stateViewing}
              style={actionStyle}
            />
          );
          break;
        case "text":
          action = (
            <ActionText
              key={meeting.id}
              socket={game.socket}
              meeting={meeting}
              players={game.players}
              self={game.self}
              history={game.history}
              stateViewing={game.stateViewing}
              style={actionStyle}
            />
          );
          break;
        case "imageButtons":
          action = (
            <ActionImageButtons
              key={meeting.id}
              socket={game.socket}
              meeting={meeting}
              players={game.players}
              self={game.self}
              history={game.history}
              stateViewing={game.stateViewing}
              style={actionStyle}
            />
          );
          break;
        case "playingCardButtons":
          action = (
            <PlayingCardButtons
              key={meeting.id}
              socket={game.socket}
              meeting={meeting}
              players={game.players}
              self={game.self}
              history={game.history}
              stateViewing={game.stateViewing}
              style={actionStyle}
            />
          );
          break;
        case "actionSeparatingText":
          action = (
            <ActionSeparatingText
              key={meeting.id}
              socket={game.socket}
              meeting={meeting}
              players={game.players}
              self={game.self}
              history={game.history}
              stateViewing={game.stateViewing}
              style={actionStyle}
            />
          );
          break;
      }

      actions.push(action);
    }
    return actions;
  }, []);

  return (
    <SideMenu
      scrollable
      title={
        <UnresolvedActionCount>{title || "Actions"}</UnresolvedActionCount>
      }
      content={<div className="action-list">{actions}</div>}
    />
  );
}

function ActionSelect(props) {
  const [meeting, history, stateViewing, isCurrentState, notClickable, onVote] =
    useAction(props);
  const [selectVisible, setSelectVisible] = useState(true);

  const targetOptions = randomizeMeetingTargetsWithSeed({
    targets: meeting.targets,
    seed: meeting.id,
    playerIds: Object.values(props?.players).map((player) => player.id),
  }).map((target) => ({
    id: target,
    label: getTargetDisplay(target, meeting, props.players),
  }));

  function onSelectVote(sel) {
    onVote(sel);
  }

  useEffect(() => {
    if (notClickable && meeting.hideAfterVote) {
      setSelectVisible(false);
    }
  }, [notClickable]);

  if (!selectVisible) return null;

  // Client side vote counting logic
  const shouldDisplayCounters = meeting.displayVoteCounter;
  const noOneDisplayName = meeting.noOneDisplayName
    ? meeting.noOneDisplayName
    : NO_ONE_NAME;
  const canVoteNoOne =
    meeting.targets &&
    Array.isArray(meeting.targets) &&
    meeting.targets.includes("*");
  const canVoteMagus =
    meeting.targets &&
    Array.isArray(meeting.targets) &&
    meeting.targets.includes("*magus");
  const voteCounts = new Map();
  var highestVoteCount = 0;
  var noOneHasMostVotes = false;

  if (shouldDisplayCounters) {
    // Tally the votes per player
    for (const member of Object.values(meeting.members)) {
      var selections = getTargetDisplay(
        meeting.votes[member.id],
        meeting,
        props.players
      );
      for (let selection of selections) {
        if (!voteCounts.has(selection)) {
          voteCounts.set(selection, 0);
        }
        voteCounts.set(selection, voteCounts.get(selection) + 1);
      }
    }

    // Determine the highest number of votes - these counters will appear red
    for (const value of voteCounts.values()) {
      if (value > highestVoteCount) {
        highestVoteCount = value;
      }
    }

    if (
      voteCounts.has(noOneDisplayName) &&
      voteCounts.get(noOneDisplayName) === highestVoteCount
    ) {
      noOneHasMostVotes = true;
    }
  }

  const rowItems = Object.values(meeting.members).map((member) => {
    const player = props.players[member.id];
    const selection = getTargetDisplay(
      meeting.votes[member.id],
      meeting,
      props.players
    );
    const name = player ? player.name : null;

    return {
      id: member.id,
      name: name || "Anonymous",
      canVote: member.canVote,
      selection: selection,
    };
  });

  // In a meeting where players are targets, a "special" target is anything that's not a player
  // includes "Condemn No One", "Declare Magus Game"
  var displayingSpecialTarget = false;

  var displayingNoOneTarget = false;
  var displayingMagusTarget = false;

  // Also show how many people are voting noOneDisplayName if applicable
  if (shouldDisplayCounters && canVoteNoOne) {
    displayingSpecialTarget = true;
    displayingNoOneTarget = true;
  }

  // Also show how many people are voting MAGUS_NAME if applicable
  if (shouldDisplayCounters && canVoteMagus) {
    displayingSpecialTarget = true;
    displayingMagusTarget = true;
  }

  // Start displaying the special targets after the divider to keep them visually separate
  if (displayingSpecialTarget) {
    rowItems.push("divider");
  }

  if (displayingNoOneTarget) {
    rowItems.push({
      id: "*",
      name: noOneDisplayName,
      canVote: false,
      selection: [],
    });
  }

  if (displayingMagusTarget) {
    rowItems.push({
      id: "*magus",
      name: MAGUS_NAME,
      canVote: false,
      selection: [],
    });
  }

  return (
    <Box
      className="action"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: 3,
        ...props.style,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Dropdown
          className={`action-dropdown ${notClickable ? "not-clickable" : ""}`}
          options={targetOptions}
          value={null}
          onChange={onSelectVote}
          icon={
            <>
              <Typography>{meeting.actionName}</Typography>{" "}
              <i className="fas fa-angle-down dropdown-arrow" />
            </>
          }
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        />
      </Box>

      <Box className="votes" sx={{ width: "100%" }}>
        {rowItems.map((rowItem) => {
          if (rowItem === "divider") {
            // if the row item is just the string "divider" then short circuit and render a divider
            return (
              <Divider
                key={"divider"}
                direction="horizontal"
                sx={{
                  marginBottom: 1,
                }}
              />
            );
          }

          const rowIsNoOne = rowItem.name === noOneDisplayName;
          const rowIsSpecial = rowItem.id.startsWith("*");

          var voteCount = 0;
          if (rowItem.name && voteCounts.has(rowItem.name)) {
            voteCount = voteCounts.get(rowItem.name);
          }
          const hasHighestVoteCount =
            voteCount != 0 &&
            voteCount == highestVoteCount &&
            (!noOneHasMostVotes || rowIsNoOne);

          if (
            !rowItem.canVote &&
            meeting.displayOptions.disableShowDoesNotVote
          ) {
            return null;
          }

          var voteCountStyle = null;
          if (hasHighestVoteCount) {
            if (rowIsSpecial) {
              voteCountStyle = { backgroundColor: "#487a28" };
            } else {
              voteCountStyle = { backgroundColor: "#bd4c4c" };
            }
          } else {
            voteCountStyle = { backgroundColor: "#4c7dbd" };
          }

          var nameColorOverride = null;
          if (rowIsSpecial) {
            nameColorOverride = "grey";
          }

          return (
            <Box
              key={rowItem.id}
              className={`vote ${meeting.multi ? "multi" : ""}`}
              sx={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
              {shouldDisplayCounters && (
                <div className="vote-count" style={voteCountStyle}>
                  {voteCount}
                </div>
              )}
              <Typography
                className="voter"
                sx={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: nameColorOverride ? nameColorOverride : undefined,
                }}
                onClick={() => onSelectVote(rowItem.id)}
              >
                {rowItem.name}
              </Typography>
              {!rowItem.canVote && !rowIsSpecial && (
                <Typography className="selection">does not vote</Typography>
              )}
              {rowItem.canVote && rowItem.selection.length > 0 && (
                <Typography>votes</Typography>
              )}
              {rowItem.canVote && (
                <Typography className="selection">
                  {rowItem.selection.join(", ")}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ActionButton(props) {
  const [meeting, history, stateViewing, isCurrentState, notClickable, onVote] =
    useAction(props);

  if (notClickable) return null;

  const votes = { ...(meeting.votes || {}) };
  for (let playerId in votes) {
    votes[playerId] = getTargetDisplay(votes[playerId], meeting, props.players);
  }

  const myVoteDisplay = votes[props.self];

  return (
    <Box className="action" sx={{ ...props.style }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {meeting.actionName}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {(meeting.targets || []).map((target) => {
          const targetDisplay = getTargetDisplay(
            target,
            meeting,
            props.players
          );

          const isSelected = myVoteDisplay === targetDisplay;
          const disabled = !!myVoteDisplay && !meeting.canUnvote;

          return (
            <Button
              key={target}
              color="primary"
              disabled={disabled}
              onClick={() => onVote(target)}
              size="small"
              sx={{ textTransform: "none" }}
              aria-pressed={isSelected}
            >
              {targetDisplay}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}

function ActionImageButtons(props) {
  const [meeting, history, stateViewing, isCurrentState, notClickable, onVote] =
    useAction(props);
  const [selectedTarget, setSelectedTarget] = useState(null);

  if (notClickable) {
    return null;
  }

  const votes = { ...meeting.votes };
  for (let playerId in votes)
    votes[playerId] = getTargetDisplay(votes[playerId], meeting, props.players);

  const selectedStyle = {
    border: "2px solid #999",
    backgroundColor: "#f0f0f0",
    boxSizing: "border-box",
  };

  const unselectedStyle = {
    border: "2px solid transparent",
    boxSizing: "border-box",
  };

  const imgContainerStyle = {
    width: "30px",
    height: "30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  };

  const handleClick = (target) => {
    setSelectedTarget(target);
    onVote(target);
  };

  const buttons = meeting.targets.map((target) => {
    var targetDisplay = getTargetDisplay(target, meeting, props.players);
    const isSelected = selectedTarget === target;
    return (
      <div
        className="btn btn-theme"
        key={target}
        onClick={() => handleClick(target)}
        style={isSelected ? selectedStyle : unselectedStyle}
      >
        <div style={imgContainerStyle}>
          <img
            src={emoteMap[targetDisplay]}
            alt={targetDisplay}
            className="action-icon"
          />
        </div>
      </div>
    );
  });

  return (
    <div className="action" style={{ ...props.style }}>
      <div className="action-name">{meeting.actionName}</div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>{buttons}</div>
    </div>
  );
}

function PlayingCardButtons(props) {
  const [meeting, history, stateViewing, isCurrentState, notClickable, onVote] =
    useAction(props);
  const [selectedTarget, setSelectedTarget] = useState(null);

  if (notClickable) {
    return null;
  }

  const votes = { ...meeting.votes };
  for (let playerId in votes)
    votes[playerId] = getTargetDisplay(votes[playerId], meeting, props.players);

  const selectedStyle = {
    border: "2px solid #999",
    backgroundColor: "#f0f0f0",
    boxSizing: "border-box",
  };

  const unselectedStyle = {
    border: "2px solid transparent",
    boxSizing: "border-box",
  };

  const imgContainerStyle = {
    width: "43px",
    height: "59px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  };

  const handleClick = (target) => {
    setSelectedTarget(target);
    onVote(target);
  };
  //|| (selectedTarget && selectedTarget.includes(target))
  const buttons = meeting.targets.map((target) => {
    var targetDisplay = getTargetDisplay(target, meeting, props.players);
    const isSelected =
      votes[meeting.members[0].id] === target ||
      (votes[meeting.members[0].id] &&
        votes[meeting.members[0].id].includes(target));
    return (
      <div
        className="btn btn-theme"
        key={target}
        onClick={() => handleClick(target)}
        style={isSelected ? selectedStyle : unselectedStyle}
      >
        <div style={imgContainerStyle}>
          <div className={`card ${`c${targetDisplay}`}`}></div>
        </div>
      </div>
    );
  });

  return (
    <div className="action" style={{ ...props.style }}>
      <div className="action-name">{meeting.actionName}</div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>{buttons}</div>
    </div>
  );
}

function ActionText(props) {
  const meeting = props.meeting;
  const self = props.self;

  const disabled = meeting.finished;

  // text settings
  const textOptions = meeting.textOptions || {};

  const minNumber = textOptions.minNumber;
  const maxNumber = textOptions.maxNumber;

  const minLength = textOptions.minLength || 0;
  const maxLength = textOptions.maxLength || MaxTextInputLength;

  const [textData, setTextData] = useState("");

  function handleOnChange(e) {
    var textInput = e.target.value;
    // disable new lines by default
    textInput = textInput.replace(/\n/g, " ");

    if (textOptions.numericOnly) {
      textInput = textInput.replace(/[^0-9]/g, "");
      if (textInput !== "" && textInput !== "0") {
        textInput = parseInt(textInput).toString();
      }
    }

    if (textOptions.minNumber) {
      if (textInput !== "") {
        textInput = Math.max(minNumber, parseInt(textInput)).toString();
      }
    }

    if (textOptions.maxNumber) {
      textInput = Math.min(maxNumber, parseInt(textInput)).toString();
    }

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
          words[i].charAt(0).toLowerCase() ===
          textOptions.enforceAcronym.charAt(i).toLowerCase()
        ) {
          acceptedWords.push(words[i]);
          continue;
        }

        break;
      }

      let addSpace =
        words.length <= textOptions.enforceAcronym.length &&
        words[words.length - 1] === "";
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

    meeting.votes[self] = textData;
    props.socket.send("vote", {
      meetingId: meeting.id,
      selection: textData,
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleOnSubmit();
    }
  }

  return (
    <Box className="action">
      <Typography variant="subtitle1" gutterBottom>
        {meeting.actionName}
      </Typography>

      {!disabled && (
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            value={textData}
            onChange={handleOnChange}
            onKeyDown={handleKeyDown}
            size="small"
            fullWidth
            placeholder={textOptions.placeholder || "Type here"}
          />
          <Button
            variant="contained"
            onClick={handleOnSubmit}
            disabled={textData.length < minLength}
          >
            {textOptions.submit || "Submit"}
          </Button>
        </Stack>
      )}

      {meeting.votes[self] && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Your vote: {meeting.votes[self]}
        </Typography>
      )}
    </Box>
  );
}

function ActionSeparatingText(props) {
  const meeting = props.meeting;
  const text = meeting.actionName;

  return (
    <div className="action" style={{ ...props.style }}>
      <br />
      <div className="action-name">{text}</div>
      <br />
    </div>
  );
}

function useAction(props) {
  const meeting = props.meeting;
  const history = props.history;
  const stateViewing = props.stateViewing;
  const isCurrentState = stateViewing === history.currentState;

  const notClickable =
    !isCurrentState ||
    !meeting.amMember ||
    !meeting.canVote ||
    (((meeting.instant && !meeting.instantButChangeable) || meeting.noUnvote) &&
      meeting.votes[props.self]);

  function onVote(sel) {
    var isUnvote;

    if (!Array.isArray(meeting.votes[props.self]))
      isUnvote = sel === meeting.votes[props.self];
    else isUnvote = meeting.votes[props.self].indexOf(sel) !== -1;

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

  const noOneDisplayName = meeting.noOneDisplayName
    ? meeting.noOneDisplayName
    : NO_ONE_NAME;

  for (let i in targets) {
    let target = targets[i];

    switch (meeting.inputType) {
      case "player":
        if (target === "*") target = noOneDisplayName;
        else if (target === "*magus") target = MAGUS_NAME;
        else if (target) target = players[target].name;
        else target = "";
        break;
      case "boolean":
        if (target === "*") target = "No";
        else if (!target) target = "";
        break;
      default:
        if (target === "*") target = "None";
        else if (!target) target = "";
    }

    targets[i] = target;
  }

  return targets;
}

export function LastWillEntry(props) {
  const game = useContext(GameContext);
  const [lastWill, setLastWill] = useState(props.lastWill);

  const currentState = game.history.states[history.currentState];
  const cannotModifyLastWill =
    !currentState || !currentState.name.startsWith("Day");

  if (
    !game.isParticipant ||
    history.currentState < 0 ||
    !game.getSetupGameSetting("Last Wills")
  ) {
    return <></>;
  }

  function onWillChange(e) {
    var newWill = e.target.value.slice(0, MaxWillLength);
    setLastWill(newWill);
    props.socket.send("lastWill", newWill);
  }

  if (cannotModifyLastWill) {
    return <></>;
  }

  return (
    <SideMenu
      title="Last Will"
      isAccordionMenu
      lockIcon={
        <i
          className={`fas ${
            props.cannotModifyLastWill ? "fa-lock" : "fa-lock-open"
          } fa-fw`}
        />
      }
      content={
        <div className="last-will-wrapper">
          <textarea
            readOnly={props.cannotModifyLastWill}
            className="last-will-entry"
            value={lastWill}
            onChange={onWillChange}
          />
        </div>
      }
      disabled={props.cannotModifyLastWill}
    />
  );
}

function SettingsForm({ handleClose = null }) {
  const game = useContext(GameContext);
  const { settings, updateSettings } = game;

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
      label: "Display Terminology Emoticons",
      ref: "terminologyEmoticons",
      type: "boolean",
      value: settings.terminologyEmoticons,
    },
    {
      label: "Message Layout",
      ref: "messageLayout",
      type: "select",
      options: [
        {
          label: "Default",
          value: "default",
        },
        {
          label: "Default (large nameplate)",
          value: "defaultLarge",
        },
        {
          label: "Compact (inline)",
          value: "compactInline",
        },
        {
          label: "Compact (vertically aligned)",
          value: "compactAligned",
        },
      ],
      value: settings.messageLayout,
    },
  ]);

  function cancel() {
    formFields.forEach((field) => {
      updateFormFields({
        ref: field.ref,
        prop: "value",
        value: settings[field.ref],
      });
    });

    if (handleClose) {
      handleClose();
    }
  }

  function saveSettings() {
    const newSettings = {};
    formFields.forEach((field) => {
      newSettings[field.ref] = field.value;
    });

    updateSettings({
      type: "set",
      settings: newSettings,
    });

    if (handleClose) {
      handleClose();
    }
  }

  const menuContent = <Form fields={formFields} onChange={updateFormFields} />;

  const menuFooter = (
    <div className="settings-control">
      <ButtonGroup variant="contained">
        <Button color="primary" onClick={saveSettings}>
          Save
        </Button>
        {handleClose && (
          <Button color="secondary" onClick={cancel}>
            Cancel
          </Button>
        )}
      </ButtonGroup>
    </div>
  );

  return (
    <>
      {menuContent}
      {menuFooter}
    </>
  );
}

export function SettingsMenu() {
  const [expanded, setExpanded] = useState(false);

  const handleClose = () => {
    setExpanded(false);
  };

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <SideMenu
      title="Settings"
      isAccordionMenu
      content={<SettingsForm handleClose={handleClose} />}
      expanded={expanded}
      onChange={handleToggle}
    />
  );
}

function FirstGameModal(props) {
  const showModal = props.showModal;
  const setShowModal = props.setShowModal;

  const modalHeader = "Welcome to UltiMafia!";

  const modalContent = (
    <>
      <div className="paragraph">
        We hope you enjoy your first game! Here's a few helpful resources for
        navigating the site:
      </div>

      <div className="paragraph">
        <div>
          - You can learn roles, items, mechanics, and slang{" "}
          <a href="/learn" target="_blank">
            here
          </a>
          !
        </div>
        <div>
          - You can familiarize yourself with the site rules{" "}
          <a href="/rules" target="_blank">
            here
          </a>
          .
        </div>
        <div>
          - Embedded{" "}
          <a
            href="https://discord.gg/C5WMFpYRHQ"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            here
          </a>{" "}
          is a link to the site's Discord server.
        </div>
        <div>
          - Want to learn how to be a better player? Sign up to be a mentee{" "}
          <a
            href="/community/forums/thread/iU8EPBj9Z?reply=cpSlmcz-q"
            target="_blank"
          >
            here
          </a>
          !
        </div>
        <div>
          - If you have suggestions, feedback, or notice any bugs, you can make
          a thread{" "}
          <a href="/community/forums/board/SiJGWYr6O" target="_blank">
            here
          </a>
          .
        </div>
        <div>
          - Our website is open-source! You can contribute code on our{" "}
          <a href="/community/forums/board/SiJGWYr6O" target="_blank">
            GitHub repository
          </a>
          .
        </div>
        <div>
          - Want to help us keep the lights on? You can support us on{" "}
          <a
            href="https://www.patreon.com/"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            Patreon
          </a>{" "}
          and{" "}
          <a
            href="https://ko-fi.com/ultimafia"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            Ko-fi
          </a>
          .
        </div>
      </div>

      <div className="paragraph">
        Thanks for playing on the Ultimate Mafia Gaming Experience! Go hogwild,
        my friend 🐗
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

export function SpeechFilter() {
  const game = useContext(GameContext);
  const {
    isolationEnabled,
    setIsolationEnabled,
    speechFilters: filters,
    setSpeechFilters: setFilters,
    stateViewing,
  } = game;

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
      isAccordionMenu
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

export function PinnedMessages() {
  const game = useContext(GameContext);

  if (game.stateViewing < 0) return <></>;

  function sortMessagesByTimestamp(a, b) {
    if (a.time < b.time) {
      return -1;
    }
    if (a.time > b.time) {
      return 1;
    } else {
      return 0;
    }
  }

  const sortedPinnedMessages = Object.values(game.pinnedMessages).sort(
    sortMessagesByTimestamp
  );

  const pinnedMessages = sortedPinnedMessages.map((message, i) => {
    return (
      <Message
        message={message}
        review={game.review}
        history={game.history}
        players={game.players}
        stateViewing={game.stateViewing}
        key={message.id || message.messageId + message.time || i}
        onMessageQuote={game.onMessageQuote}
        onPinMessage={game.onPinMessage}
        isMessagePinned={game.isMessagePinned}
        settings={game.settings}
        forceDefaultStyling
      />
    );
  });

  return (
    <SideMenu
      title="Pinned messages"
      isAccordionMenu
      contentPadding="0px 0px"
      content={
        <div
          className="speech-display"
          style={{ minHeight: "40px", maxHeight: "240px" }}
        >
          {pinnedMessages}
        </div>
      }
    />
  );
}

export function Notes() {
  const game = useContext(GameContext);
  const stateViewing = game.stateViewing;
  const [notes, setNotes] = useState("");
  const { gameId } = useParams();

  useEffect(() => {
    var notesData = window.localStorage.getItem("notesData");

    if (notesData) {
      notesData = JSON.parse(notesData);

      if (notesData.game !== gameId)
        window.localStorage.removeItem("notesData");
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
      isAccordionMenu
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

function useHistoryReducer(pauseHistoryUpdates) {
  return useReducer(
    (history, action) => {
      var newHistory;

      if (pauseHistoryUpdates) {
        return update(history, {
          pausedActions: {
            $push: [action],
          },
        });
      }

      switch (action.type) {
        case "set":
          var stateIds = Object.keys(action.history)
            .map((a) => parseInt(a))
            .sort((a, b) => a - b);
          newHistory = { states: action.history, pausedActions: [] };

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
                    obituaries: {},
                    // winners: action.state.winners ? action.state.winners : null,
                    roles: { ...history.states[prevState].roles },
                    dead: { ...history.states[prevState].dead },
                    exorcised: { ...history.states[prevState].exorcised },
                    extraInfo: { ...action.state.extraInfo },
                  },
                },
              },
              currentState: {
                $set: Number.parseInt(action.state.id),
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
              newHistory.states[history.currentState].selTab ===
              action.meetingId
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
                (t) => t !== action.info.target
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
        case "obituaries":
          if (history.states[history.currentState]) {
            newHistory = update(history, {
              states: {
                [history.currentState]: {
                  obituaries: {
                    [action.obituariesMessage.source]: {
                      $set: action.obituariesMessage,
                    },
                  },
                },
              },
            });
          }
          break;
        // case "winners":
        //   if (history.states[history.currentState]) {
        //     newHistory = update(history, {
        //       states: {
        //         [history.currentState]: {
        //           winners: {
        //             [action.winnersMessage.source]: {
        //               $set: action.winnersMessage,
        //             },
        //           },
        //         },
        //       },
        //     });
        //   }
        //   break;
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
    { states: {}, pausedActions: [] }
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
      case "set":
        newState = action.stateNum;
        break;
      default:
        throw Error(`Unknown action type ${action.type}`);
    }

    if (history.states[newState]) return newState;
    else return state;
  }, history.currentState);
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
    messageLayout: "default",
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

export function useActivity() {
  // const volumeThreshold = 0.001;
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

  return [activity, updateActivity];
}

export function useAudio(settings) {
  const audioRef = useRef({});

  const [audioInfo, updateAudio] = useReducer(
    (audioInfo, action) => {
      var newAudioInfo;

      switch (action.type) {
        case "play":
          const unmuteable = action.audioName === "vegPing";
          if (!unmuteable && !settings.sounds) return audioInfo;
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
