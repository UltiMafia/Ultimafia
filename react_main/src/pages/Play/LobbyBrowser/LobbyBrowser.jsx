import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { TutorialLobbyBanner } from "components/TutorialPrompt";
import { useLocation, Link } from "react-router-dom";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";
import axios from "axios";
import UiIcon from "components/ui/UiIcon";
import { UiPageHeader } from "components/ui";

import { UserContext, InGameContext } from "Contexts";
import { getPageNavFilterArg, PageNav } from "components/Nav";
import { useErrorAlert } from "components/Alerts";
import { camelCase } from "../../../utils";
import Comments from "../../Community/Comments";
import "css/join.css";
import { ListSkeleton, PageSkeleton } from "components/Skeletons";
import {
  Button,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { useLoading } from "../../../hooks/useLoading";
import { GameRow } from "./GameRow";
import { RecentForumReplies } from "components/RecentForumReplies";
import { Poll } from "components/Poll";
import RecentTradesFeed from "components/RecentTradesFeed";
import { FeaturedSetup } from "./FeaturedSetup";
import { DailyChallenges } from "./DailyChallengeDisplay";
import { CompetitiveRounds } from "./CompetitiveRounds";

import { lobbiesFor } from "../../../constants/lobbies";
import { useViewActive, ViewActivityContext } from "../../../hooks/useViewActivity";
import ViewOverlayBoundary from "../../../components/ViewOverlayBoundary";
import { LatestRequest } from "../../../lib/latestRequest.js";
import { filterLobbyGames } from "./gameDiscovery.js";

// How often the lobby refreshes its open-game list on its own. A tick is
// skipped while the tab is hidden or a game has the screen.
const LOBBY_POLL_MS = 10000;

// Load secondary features on first use, then retain drafts and conversations.
// Their overlays and activity belong to this panel, not the visible game list.
function LobbySection({ active, id, labelledBy, children }) {
  const viewActive = useViewActive();
  const [visited, setVisited] = useState(active);
  useEffect(() => { if (active) setVisited(true); }, [active]);
  return <div role="tabpanel" id={id} aria-labelledby={labelledBy} hidden={!active}>
    {(visited || active) && <ViewActivityContext.Provider value={viewActive && active}>
      <ViewOverlayBoundary active={viewActive && active}>{children}</ViewOverlayBoundary>
    </ViewActivityContext.Provider>}
  </div>;
}

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
  const defaultLobbyName = "All";
  const [openGamesCounts, setOpenGamesCounts] = useState({});
  const [refreshButtonIsSpinning, setRefreshButtonIsSpinning] = useState(false);
  const [listType, setListType] = useState("All");
  const [page, setPage] = useState(1);
  const [games, setGames] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("games");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
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


  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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
    getOpenGameCounts();
  }, [lobbyName]);

  const getOpenGameCounts = useCallback(async () => {
    if (!currentViewRef.current.active) return;
    const request = countRequests.current.begin();
    return axios.get(`/api/game/openCounts`, { signal: request.signal }).then(({ data }) => {
      if (!isMountedRef.current || !request.isCurrent() || !currentViewRef.current.active) return;

      setOpenGamesCounts(data?.counts || {});
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
  pollRef.current = { getGameList, getOpenGameCounts, listType, page, inGame, active: active && section === "games", loading };

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
  }, [inGame, active, section]);

  const refreshGames = async () => {
    if (!isMountedRef.current) return;

    window.gtag?.("event", "refresh_games");
    setRefreshButtonIsSpinning(true);
    try {
      await Promise.all([
        getGameList(listType, page, null, { reload: true }),
        getOpenGameCounts(),
      ]);
    } finally {
      if (isMountedRef.current) setRefreshButtonIsSpinning(false);
    }
  };

  if (lobbyName !== "All" && !lobbies.some((l) => l.name === lobbyName))
    setLobbyName(defaultLobbyName);

  if (!user.loaded) return <PageSkeleton />;
  // Allow logged-out users to access LobbyBrowser

  const visibleGames = filterLobbyGames(games, statusFilter, search);
  const clearFilters = () => {
    setStatusFilter("All");
    setSearch("");
  };
  // Retain the previous list while refreshing. Empty initial loads alone use a skeleton.
  const gameList =
    loading && games.length === 0 ? (
      <ListSkeleton rows={4} />
    ) : visibleGames.length ? (
      <ul className="lobby-game-list" aria-label="Games on this page" aria-busy={loading}>
        {visibleGames.map(game => <li key={game.id}>
          <GameRow game={game} lobby={lobbyName} showLobbyName showGameTypeIcon showGameState
            refresh={() => getGameList(listType, page, null, { reload: true })} />
        </li>)}
      </ul>
  ) : (
    <div className="lobby-empty" role="status">
      <h2>{games.length ? "No matching games" : "No games in this lobby"}</h2>
      <p>{games.length ? "Search and status filters apply to this page." : "Choose another lobby or host a game."}</p>
      {games.length ? <Button variant="outlined" onClick={clearFilters}>Clear filters</Button> :
        <Button component={Link} to={user.loggedIn ? "/play/host" : "/welcome"}>{user.loggedIn ? "Host a game" : "Sign in to host"}</Button>}
    </div>
  );

  return (
    <div className="lobby-browser">
      <UiPageHeader title="Games" actions={
        <Button component={Link} to={user.loggedIn ? "/play/host" : "/welcome"} startIcon={<UiIcon name="add" />}>Host a game</Button>
      } />
      <Tabs value={section} onChange={(_, value) => setSection(value)} aria-label="Lobby sections" className="lobby-sections">
        <Tab label="Games" value="games" id="lobby-games-tab" aria-controls="lobby-games-panel" />
        <Tab label="More" value="extras" id="lobby-extras-tab" aria-controls="lobby-extras-panel" />
      </Tabs>
      <div className={`lobby-home-layout${section === "extras" ? " is-extras" : ""}`} hidden={section !== "games" && section !== "extras"}>
      <LobbySection id="lobby-games-panel" labelledBy="lobby-games-tab" active={section === "games"}>
        <TutorialLobbyBanner />
        {!user.loggedIn && <p className="guest-join-hint"><Link to="/welcome">Sign in</Link> to join or spectate. <Link to="/play/tutorial">Tutorial</Link></p>}
        <div className="lobby-controls">
          <label className="lobby-select"><span className="sr-only">Lobby</span>
            <select aria-label="Lobby" value={lobbyName} onChange={event => setLobbyName(event.target.value)}>
              {lobbies.filter(lobby => !lobby.hidden).map(lobby => <option key={lobby.name} value={lobby.name} disabled={lobby.disabled}>
                {lobby.name === "All" ? "All lobbies" : lobby.name}{openGamesCounts[lobby.name] ? ` (${openGamesCounts[lobby.name]})` : ""}
              </option>)}
            </select>
          </label>
          <div className="lobby-status-tabs" role="group" aria-label="Filter games by status">
            {[["All", "All"], ["Open", "Open"], ["In Progress", "Live"], ["Finished", "Finished"]].map(([value, label]) =>
              <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)}>{label}</button>)}
          </div>
          <button className="utility-button" type="button" onClick={() => setFiltersExpanded(value => !value)} aria-label="Search games" aria-expanded={filtersExpanded} aria-controls="game-search"><UiIcon name="search" /></button>
          <button className="utility-button" type="button" onClick={refreshGames} disabled={loading} aria-label="Refresh games" aria-busy={refreshButtonIsSpinning}><UiIcon name="refresh" className={refreshButtonIsSpinning ? "ui-icon--busy" : ""} /></button>
        </div>
        <div id="game-search" className="lobby-search" hidden={!filtersExpanded}>
          <TextField type="search" fullWidth placeholder="Setup or host name" value={search} onChange={event => setSearch(event.target.value)} inputProps={{ "aria-label": "Search games on this page" }} />
          {search && <Button variant="text" onClick={() => setSearch("")}>Clear</Button>}
        </div>
        <div className="lobby-result-count" role="status">{visibleGames.length} {visibleGames.length === 1 ? "game" : "games"} on this page</div>
        {gameList}
        <div className="lobby-pagination"><span>Page {page} · {visibleGames.length} games</span><PageNav page={page} onNav={nextPage => getGameList(listType, nextPage, null, { reload: nextPage === page })} /></div>
        <section className="community-wall" aria-labelledby="community-wall-heading">
          <h2 id="community-wall-heading">Community wall</h2>
          <Comments fullWidth
            location={lobbyName === "All"
              ? lobbies.filter(lobby => lobby.name !== "All" && !lobby.developerOnly)
                  .map(lobby => lobby.name === "Main" ? "lobby" : `lobby-${lobby.name}`)
              : lobbyName === "Main" ? "lobby" : `lobby-${lobbyName}`}
            postLocation={lobbyName === "All" ? "lobby" : undefined} />
        </section>
      </LobbySection>
      <aside className="lobby-home-features" aria-label="Challenges and community activity" hidden={section !== "games" && section !== "extras"}>
        <LobbySection id="lobby-extras-panel" labelledBy={section === "extras" ? "lobby-extras-tab" : "lobby-games-tab"} active={section === "games" || section === "extras"}>
          <div className="lobby-secondary-content">
            <DailyChallenges />
            <CompetitiveRounds />
            <FeaturedSetup lobby={lobbyName} glowingHostButton={false} />
            <Poll lobby={lobbyName} />
            <RecentForumReplies />
            <RecentTradesFeed />
          </div>
        </LobbySection>
      </aside>
      </div>

    </div>
  );
}
