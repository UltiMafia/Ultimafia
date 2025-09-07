import React, { useState, useEffect, useContext, useCallback } from "react";
import { Redirect, useLocation, useHistory, Link } from "react-router-dom";
import axios from "axios";

import { UserContext } from "Contexts";
import { getPageNavFilterArg, PageNav } from "components/Nav";
import Setup from "components/Setup";
import { useErrorAlert } from "components/Alerts";
import { camelCase } from "../../../utils";
import Comments from "../../Community/Comments";
import { Lobbies } from "../../../Constants";
import "css/join.css";
import { RefreshButton } from "./RefreshButton";
import { NewLoading } from "../../Welcome/NewLoading";
import {
  Box,
  Divider,
  Grid,
  List,
  ListItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { useLoading } from "../../../hooks/useLoading";
import { GameRow } from "./GameRow";
import { useIsPhoneDevice } from "../../../hooks/useIsPhoneDevice";
import { RecentlyPlayedSetups } from "./RecentlyPlayedSetups";
import { FeaturedSetup } from "./FeaturedSetup";
import { DailyChallenges } from "./DailyChallengeDisplay";
import { getRowStubColor } from "./gameRowColors.js";

const lobbies = [
  { name: "All", displayName: "All" },
  { name: "Main", displayName: "🔪 Main" },
  { name: "Sandbox", displayName: "⏳ Sandbox" },
  { name: "Competitive", displayName: "💛 Competitive" },
  { name: "Games", displayName: "🎲 Minigames" },
  { name: "Survivor", displayName: "🍹 Survivor" },
  { name: "Roleplay", displayName: "🎭 Roleplay", disabled: true },
];

export const LobbyBrowser = () => {
  const isPhoneDevice = useIsPhoneDevice();
  const theme = useTheme();
  const defaultLobbyName = lobbies[0].name;
  const [openGamesCounts, setOpenGamesCounts] = useState({});
  const [refreshTimeoutId, setRefreshTimeoutId] = useState(null);
  const [refreshButtonIsSpinning, setRefreshButtonIsSpinning] = useState(false);
  const [hasOneOpenUrankedGame, setHasOneOpenUrankedGame] = useState(false);
  const [hasOneOpenGame, setHasOneOpenGame] = useState(false);
  const [listType, setListType] = useState("All");
  const [page, setPage] = useState(1);
  const [games, setGames] = useState([]);
  const { loading, setLoading } = useLoading();
  const location = useLocation();
  const history = useHistory();

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const params = new URLSearchParams(location.search);
  const [lobbyName, setLobbyName] = useState(
    params.get("lobby") || localStorage.getItem("lobby") || defaultLobbyName
  );

  const glowingHostButton = user.canPlayRanked
    ? !hasOneOpenGame
    : !hasOneOpenUrankedGame;

  useEffect(() => {
    localStorage.setItem("lobby", lobbyName);

    if (params.get("lobby") !== lobbyName) {
      history.push(location.pathname + `?lobby=${lobbyName}`);
    }

    document.title = `🔪 Ultimafia Lobby`;
    getGameList(listType, 1);
  }, [location.pathname, lobbyName]);

  useEffect(() => {
    setHasOneOpenGame(false);
    setHasOneOpenUrankedGame(false);
    getGameList(listType, page);
    getOpenGameCounts();
  }, [lobbyName]);

  const getOpenGameCounts = useCallback(async () => {
    return axios.get(`/api/game/list?list=open`).then(({ data }) => {
      const result = {};
      data.forEach((game) => {
        const { lobby } = game;
        if (result[lobby] == undefined) {
          result[lobby] = 0;
        }
        result[lobby]++;

        if (!hasOneOpenGame) setHasOneOpenGame(true);
        if (!hasOneOpenUrankedGame && !game.ranked)
          setHasOneOpenUrankedGame(true);
      });
      setOpenGamesCounts(result);
    });
  }, []);

  const getGameList = async (_listType, _page, finallyCallback = null) => {
    setLoading(true);
    var filterArg = getPageNavFilterArg(_page, page, games, "endTime");

    if (filterArg == null) return;

    filterArg += `&page=${_page}`;
    try {
      const res = await axios.get(
        `/api/game/list?list=${camelCase(
          _listType
        )}&lobby=${lobbyName}&${filterArg}`
      );
      if (res.data.length > 0 || _page === 1) {
        setListType(_listType);
        setPage(_page);
        setGames(res.data);
      }
    } catch (err) {
      errorAlert();
    }
    setLoading(false);
    finallyCallback && finallyCallback();
  };

  const refreshGames = async () => {
    window.gtag("event", "refreshing_games_hehe", {
      gayness: Math.random(),
    });
    // This is a nice trick to allow spam-clicking the Refresh button
    setRefreshButtonIsSpinning(false);
    await new Promise((res) => setTimeout(res));
    setRefreshButtonIsSpinning(true);

    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
    }

    const callback = async () => {
      // The animation is so beautiful… It must keep spinning! (although the games have already been refreshed)
      const minAnimationTime = 100;
      await new Promise((res) => {
        setRefreshTimeoutId(setTimeout(res, minAnimationTime));
      });
      // "But bro, this is bad UX - don't leave users hanging" nah, 100ms is short enough

      setRefreshButtonIsSpinning(false);
    };
    getGameList(listType, page, callback);
    getOpenGameCounts();
  };

  if (lobbyName !== "All" && Lobbies.indexOf(lobbyName) === -1)
    setLobbyName(defaultLobbyName);

  if (!user.loaded) return <NewLoading small />;
  if (user.loaded && !user.loggedIn) return <Redirect to="/" />;

  const lobbyTabs = (
    <Box sx={{ display: "flex" }}>
      <Tabs
        value={lobbyName}
        onChange={(_, newValue) => setLobbyName(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {lobbies
          .filter((lobby) => !lobby.hidden)
          .map((lobby) => (
            <Tab
              key={`lobby-tab-${lobby.name}`}
              label={
                <div>
                  {lobby.displayName}
                  {openGamesCounts[lobby.name] && (
                    <span
                      style={{
                        marginLeft: "5px",
                        borderRadius: "50%",
                        backgroundColor: theme.palette.secondary.main,
                        color: "white",
                        padding: "0 5px",
                      }}
                    >
                      {openGamesCounts[lobby.name]}
                    </span>
                  )}
                </div>
              }
              value={lobby.name}
              disabled={lobby?.disabled}
            />
          ))}
      </Tabs>
    </Box>
  );

  const gameList = loading ? (
    <NewLoading small />
  ) : games.length ? (
    <Stack direction="column" spacing={1}>
      {games.map((game) => {
        return (
          <ListItem disablePadding key={game.id}>
            <Box
              className={game.competitive ? "metallic-gold" : undefined}
              sx={{
                backgroundColor: getRowStubColor(game),
                borderTopLeftRadius: "5px",
                borderBottomLeftRadius: "5px",
                alignSelf: "stretch",
                minWidth: "15px",
              }}
            />
            <GameRow
              game={game}
              lobby={lobbyName}
              refresh={() => getGameList(listType, page)}
              odd={games.indexOf(game) % 2 === 1}
              key={game.id}
              showLobbyName
              showGameTypeIcon
            />
          </ListItem>
        );
      })}
    </Stack>
  ) : (
    <Typography style={{ textAlign: "center" }}>
      No games played recently.
    </Typography>
  );

  const buttons = (
    <Paper>
      <Stack
        direction="row"
        sx={{
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <PageNav page={page} onNav={(page) => getGameList(listType, page)} />
        <Typography color="primary">Games</Typography>
        <div onClick={refreshGames}>
          <RefreshButton isSpinning={refreshButtonIsSpinning} />
        </div>
      </Stack>
    </Paper>
  );

  return (
    <Box
      sx={{
        mt: 1,
      }}
    >
      {lobbyTabs}
      <Divider sx={{ mb: 1 }} />
      <Grid container rowSpacing={2} columnSpacing={2}>
        <Grid item xs={12} md={8}>
          {buttons}
          {gameList}
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <FeaturedSetup
              lobby={lobbyName}
              glowingHostButton={glowingHostButton}
            />
            <DailyChallenges />
            <RecentlyPlayedSetups lobby={lobbyName} />
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <Comments
            fullWidth
            location={
              lobbyName === "Main" || lobbyName === "All"
                ? "lobby"
                : `lobby-${lobbyName}`
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
};
