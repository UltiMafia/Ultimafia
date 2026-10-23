import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";
import axios from "axios";

import { UserContext, InGameContext } from "Contexts";
import { getPageNavFilterArg, PageNav } from "components/Nav";
import { useErrorAlert } from "components/Alerts";
import { camelCase } from "../../../utils";
import Comments from "../../Community/Comments";
import "css/join.css";
import { RefreshButton } from "./RefreshButton";
import { ListSkeleton, PageSkeleton } from "components/Skeletons";
import {
  Box,
  Divider,
  Grid,
  Grid2,
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
import { RecentForumReplies } from "components/RecentForumReplies";
import { Poll } from "components/Poll";
import RecentTradesFeed from "components/RecentTradesFeed";
import Chat from "../../Chat/Chat";
import { FeaturedSetup } from "./FeaturedSetup";
import { DailyChallenges } from "./DailyChallengeDisplay";
import { CompetitiveRounds } from "./CompetitiveRounds";
import { getRowStubColor } from "./gameRowColors.js";

import { lobbiesFor } from "../../../constants/lobbies";
import { useViewActive } from "../../../hooks/useViewActivity";
import { LatestRequest } from "../../../lib/latestRequest.js";

// How often the lobby refreshes its open-game list on its own. A tick is
// skipped while the tab is hidden or a game has the screen.
const LOBBY_POLL_MS = 20000;

// The list endpoint can return two documents for one game id -- a finished game
// recorded twice, which was live on dev.ultimafia.gg (7Ufg1CxTF appeared twice
// on every page). Rows are keyed by game id, so a duplicate id makes React
// render the list wrongly: an extra row and items in the wrong order, and which
// row lands where depends on what was rendered before, so the same lobby looked
// different each time you came back to it. Show one row per game.
function oneRowPerGame(games) {
  const seen = new Set();
  return games.filter((game) => {
    if (seen.has(game.id)) return false;
    seen.add(game.id);
    return true;
  });
}

export default function LobbyBrowser() {
  const isPhoneDevice = useIsPhoneDevice();
  const theme = useTheme();
  const defaultLobbyName = "All";
  const [openGamesCounts, setOpenGamesCounts] = useState({});
  const [refreshButtonIsSpinning, setRefreshButtonIsSpinning] = useState(false);
  const refreshTimeoutRef = useRef(null);
  const [hasOneOpenGame, setHasOneOpenGame] = useState(false);
  const [listType, setListType] = useState("All");
  const [page, setPage] = useState(1);
  const [games, setGames] = useState([]);
  const listRequests = useRef(new LatestRequest());
  const countRequests = useRef(new LatestRequest());
  const { loading, setLoading } = useLoading();
  const location = useLocation();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  const user = useContext(UserContext);
  const lobbies = lobbiesFor(user);
  const inGame = useContext(InGameContext);
  const active = useViewActive();
  const errorAlert = useErrorAlert();
  const params = new URLSearchParams(location.search);
  const [lobbyName, setLobbyName] = useState(
    params.get("lobby") || localStorage.getItem("lobby") || defaultLobbyName
  );
  const currentViewRef = useRef(null);
  currentViewRef.current = { active, lobbyName };

  useEffect(() => {
    if (!active) setLoading(false);
    return () => {
      listRequests.current.invalidate();
      countRequests.current.invalidate();
    };
  }, [lobbyName, active]);

  const glowingHostButton = !hasOneOpenGame;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    localStorage.setItem("lobby", lobbyName);

    if (params.get("lobby") !== lobbyName) {
      navigate(location.pathname + `?lobby=${lobbyName}`, { replace: true });
    }

    document.title = `🔪 Ultimafia Lobby`;
    // A newly picked lobby starts at page 1. Without resetting it the page
    // number stayed on the previous lobby's page, and the second request the
    // other effect fired for that page raced this one -- two different lists,
    // whichever response landed last.
    setPage(1);
    getGameList(listType, 1);
  }, [location.pathname, lobbyName]);

  useEffect(() => {
    if (!active) return;
    setHasOneOpenGame(false);
    getOpenGameCounts();
  }, [lobbyName]);

  const getOpenGameCounts = useCallback(async () => {
    if (!currentViewRef.current.active) return;
    const request = countRequests.current.begin();
    return axios.get(`/api/game/openCounts`, { signal: request.signal }).then(({ data }) => {
      if (!isMountedRef.current || !request.isCurrent() || !currentViewRef.current.active) return;

      setOpenGamesCounts(data?.counts || {});
      setHasOneOpenGame(Boolean(data?.hasOpen));
    }).catch(() => {});
  }, []);

  // The cursor the page now on screen was fetched with. The list endpoint gives
  // open and in-progress games endTime 0, so a cursor recomputed from the items
  // on screen is not the one that produced this page -- reusing the real one is
  // what makes a refresh, a poll, and a return to a lobby show the same list
  // instead of a different slice each time.
  const pageCursorRef = useRef(null);

  const getGameList = async (
    _listType,
    _page,
    finallyCallback = null,
    { background = false, reload = false } = {}
  ) => {
    if (!currentViewRef.current.active || currentViewRef.current.lobbyName !== lobbyName ||
        (background && loading)) return;
    // A background refresh (the poll) must not flash the loading skeleton on an
    // empty list, so it leaves the loading state alone entirely.
    if (!background) setLoading(true);

    // A reload re-fetches the page already on screen. Paging computes a cursor
    // from the items on screen; a reload reuses the cursor that worked.
    const savedCursor = pageCursorRef.current;
    const filterArg = reload && savedCursor?.lobby === lobbyName &&
      savedCursor.listType === _listType && savedCursor.page === _page
      ? savedCursor.value
      : getPageNavFilterArg(_page, page, games, "endTime");

    if (filterArg == null) {
      if (isMountedRef.current && !background) {
        setLoading(false);
      }
      return;
    }

    const requestedLobby = lobbyName;
    const request = listRequests.current.begin();
    const query = `${filterArg}&page=${_page}`;
    try {
      const res = await axios.get(
        `/api/game/list?list=${camelCase(
          _listType
        )}&lobby=${requestedLobby}&${query}`,
        { signal: request.signal }
      );
      if (!isMountedRef.current || !request.isCurrent() ||
          !currentViewRef.current.active || currentViewRef.current.lobbyName !== requestedLobby) return;

      if (res.data.length > 0 || _page === 1) {
        // A failed/obsolete page request must not change the reload cursor.
        pageCursorRef.current = { lobby: requestedLobby, listType: _listType, page: _page, value: filterArg };
        setListType(_listType);
        setPage(_page);
        setGames(oneRowPerGame(res.data));
      }
    } catch (err) {
      // A failed background refresh must not raise an alert every tick; the
      // list it already has stays on screen and the next tick tries again.
      if (isMountedRef.current && request.isCurrent() && !background) {
        errorAlert();
      }
    }
    if (isMountedRef.current && request.isCurrent() && !background) {
      setLoading(false);
    }
    if (isMountedRef.current && request.isCurrent() && finallyCallback) {
      finallyCallback();
    }
  };

  // What the poll loop should call next: the newest functions and the page and
  // lobby the user is looking at. Read through a ref so one interval can do
  // that without being torn down and rebuilt on every render.
  const pollRef = useRef(null);
  pollRef.current = { getGameList, getOpenGameCounts, listType, page, inGame, active, loading };

  // Refresh the list on its own so it does not sit at whatever it showed when
  // the page opened. Ticks are skipped while the tab is hidden (nobody is
  // looking) or while a game has the screen (this lobby is behind it), and one
  // runs straight away when either ends, so the list you come back to is not
  // the one you left behind.
  const pollHasRunRef = useRef(false);
  useEffect(() => {
    let inFlight = false;

    async function poll() {
      const current = pollRef.current;
      if (inFlight || current.inGame || !current.active || current.loading) return;
      if (document.visibilityState !== "visible") return;

      inFlight = true;
      try {
        await current.getOpenGameCounts();
        // A lobby/page can change while counts are in flight. Never let an old
        // poll cancel a newer foreground request using its captured callbacks.
        const latest = pollRef.current;
        if (!latest.active || latest.inGame || latest.loading) return;
        await latest.getGameList(latest.listType, latest.page, null, {
          background: true,
          reload: true,
        });
      } catch (_) {
        // Next tick tries again.
      } finally {
        inFlight = false;
      }
    }

    const interval = setInterval(poll, LOBBY_POLL_MS);
    document.addEventListener("visibilitychange", poll);

    // The effects above already fetch on mount and on a lobby change, so only
    // poll here when this run is a return from a game or a re-shown tab.
    if (pollHasRunRef.current) poll();
    pollHasRunRef.current = true;

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [inGame, active]);

  const refreshGames = async () => {
    if (!isMountedRef.current) return;

    window.gtag("event", "refreshing_games_hehe", {
      gayness: Math.random(),
    });
    // This is a nice trick to allow spam-clicking the Refresh button
    setRefreshButtonIsSpinning(false);
    await new Promise((res) => setTimeout(res));
    if (!isMountedRef.current) return;
    setRefreshButtonIsSpinning(true);

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const callback = async () => {
      // The animation is so beautiful… It must keep spinning! (although the games have already been refreshed)
      const minAnimationTime = 100;
      await new Promise((res) => {
        refreshTimeoutRef.current = setTimeout(res, minAnimationTime);
      });
      // "But bro, this is bad UX - don't leave users hanging" nah, 100ms is short enough
      if (isMountedRef.current) {
        setRefreshButtonIsSpinning(false);
      }
    };
    getGameList(listType, page, callback, { reload: true });
    getOpenGameCounts();
  };

  if (lobbyName !== "All" && !lobbies.some((l) => l.name === lobbyName))
    setLobbyName(defaultLobbyName);

  if (!user.loaded) return <PageSkeleton />;
  // Allow logged-out users to access LobbyBrowser

  const lobbyTabs = (
    <Tabs
      value={lobbyName}
      onChange={(_, newValue) => setLobbyName(newValue)}
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
  );

  // Keep the current list visible while the next one loads, so switching
  // lobbies does not blank the page or flash a spinner. The spinner is only
  // for the very first load, when there is nothing to show yet.
  const gameList =
    loading && games.length === 0 ? (
      <ListSkeleton rows={4} />
    ) : games.length ? (
    <Stack direction="column" spacing={1}>
      {games.map((game) => {
        return (
          <ListItem disablePadding key={game.id}>
            <Box
              className={game.competitive ? "metallic-gold" : undefined}
              sx={{
                backgroundColor: getRowStubColor(game),
                borderTopLeftRadius: "var(--mui-shape-borderRadius)",
                borderBottomLeftRadius: "var(--mui-shape-borderRadius)",
                alignSelf: "stretch",
                minWidth: "16px",
              }}
            />
            <GameRow
              game={game}
              lobby={lobbyName}
              refresh={() => getGameList(listType, page, null, { reload: true })}
              odd={games.indexOf(game) % 2 === 1}
              key={game.id}
              showLobbyName
              showGameTypeIcon
              showGameState
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
        }}
      >
        <PageNav page={page} onNav={(nextPage) => getGameList(listType, nextPage, null, { reload: nextPage === page })} />
        <Typography variant="h3" color="primary">
          Games
        </Typography>
        <div onClick={refreshGames}>
          <RefreshButton isSpinning={refreshButtonIsSpinning} />
        </div>
      </Stack>
    </Paper>
  );

  return (
    <Stack direction="column" spacing={1}>
      {lobbyTabs}
      <Grid2 container rowSpacing={2} columnSpacing={2}>
        <Grid2 size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Stack direction="column" spacing={1}>
              {buttons}
              {gameList}
            </Stack>
            <Comments
              fullWidth
              location={
                lobbyName === "All"
                  ? lobbies
                      .filter((l) => l.name !== "All" && !l.developerOnly)
                      .map((l) =>
                        l.name === "Main" ? "lobby" : `lobby-${l.name}`
                      )
                  : lobbyName === "Main"
                  ? "lobby"
                  : `lobby-${lobbyName}`
              }
              postLocation={lobbyName === "All" ? "lobby" : undefined}
            />
          </Stack>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Stack spacing={1}>
            <FeaturedSetup
              lobby={lobbyName}
              glowingHostButton={glowingHostButton}
            />
            <CompetitiveRounds />
            <DailyChallenges />
            <RecentlyPlayedSetups lobby={lobbyName} />
            <RecentForumReplies />
            <Chat />
            <Poll lobby={lobbyName} />
            <RecentTradesFeed />
          </Stack>
        </Grid2>
      </Grid2>
    </Stack>
  );
}
