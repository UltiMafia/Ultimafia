import React, { useState, useEffect, useContext } from "react";
import { Redirect, useLocation, useHistory, Link } from "react-router-dom";
import axios from "axios";

import { UserContext } from "../../../Contexts";
import { getPageNavFilterArg, PageNav } from "../../../components/Nav";
import { useErrorAlert } from "../../../components/Alerts";
import { camelCase } from "../../../utils";
import Comments from "../../Community/Comments";
import { Lobbies } from "../../../Constants";
import "../../../css/join.css";
import { RefreshButton } from "./RefreshButton";
import { NewLoading } from "../../Welcome/NewLoading";
import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  List,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useLoading } from "../../../hooks/useLoading";
import { GameRow } from "./GameRow";
import { useIsPhoneDevice } from "../../../hooks/useIsPhoneDevice";

const lobbies = [
  { name: "All", displayName: "🔪 All" },
  { name: "Games", displayName: "🎲 Games" },
  { name: "Roleplay", displayName: "🎭 Roleplay" },
  { name: "Mafia", displayName: "🔪 Mafia", hidden: true },
  { name: "Competitive", displayName: "💛 Competitive", disabled: true },
];

export const LobbyBrowser = () => {
  const isPhoneDevice = useIsPhoneDevice();
  const defaultLobbyName = lobbies[0].name;
  const [refreshTimeoutId, setRefreshTimeoutId] = useState(null);
  const [refreshButtonIsSpinning, setRefreshButtonIsSpinning] = useState(false);
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

  useEffect(() => {
    localStorage.setItem("lobby", lobbyName);

    if (params.get("lobby") !== lobbyName) {
      history.push(location.pathname + `?lobby=${lobbyName}`);
    }

    document.title = `🔪 Ultimafia Lobby`;
    getGameList(listType, 1);
  }, [location.pathname, lobbyName]);

  useEffect(() => {
    getGameList(listType, page);
  }, [lobbyName]);

  const getGameList = async (_listType, _page, finallyCallback = null) => {
    setLoading(true);
    var filterArg = getPageNavFilterArg(_page, page, games, "endTime");

    if (filterArg == null) return;

    filterArg += `&page=${_page}`;
    try {
      const res = await axios.get(
        `/game/list?list=${camelCase(
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
  };

  if (lobbyName !== "All" && Lobbies.indexOf(lobbyName) === -1)
    setLobbyName(defaultLobbyName);

  if (!user.loaded) return <NewLoading small />;
  if (user.loaded && !user.loggedIn) return <Redirect to="/" />;

  const LobbyTabs = (
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
              label={lobby.displayName}
              value={lobby.name}
              disabled={lobby?.disabled}
            />
          ))}
      </Tabs>
      <div
        onClick={refreshGames}
        style={{ display: "flex", marginLeft: "auto" }}
      >
        <RefreshButton isSpinning={refreshButtonIsSpinning} />
      </div>
    </Box>
  );
  const GameList = loading ? (
    <NewLoading small />
  ) : games.length ? (
    <List sx={{ my: -0.5 }}>
      {games.map((game) => (
        <GameRow
          game={game}
          lobby={lobbyName}
          refresh={() => getGameList(listType, page)}
          odd={games.indexOf(game) % 2 === 1}
          key={game.id}
        />
      ))}
    </List>
  ) : (
    <Typography style={{ textAlign: "center" }}>
      No games played recently.
    </Typography>
  );

  const PageNavGames = (
    <PageNav page={page} onNav={(page) => getGameList(listType, page)} />
  );
  const Buttons = (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <ButtonGroup variant="outlined" sx={{ my: 1 }}>
          <Link to="/play/host">
            <Button
              sx={{
                height: "100%",
                ...(isPhoneDevice ? { px: 1 } : {}),
                textTransform: "none",
                transform: "translate3d(0,0,0)",
                fontWeight: "800",
              }}
              variant="contained"
            >
              Host
            </Button>
          </Link>
          <Link to="/play/create">
            <Button
              sx={{
                height: "100%",
                ...(isPhoneDevice ? { px: 1 } : {}),
                textTransform: "none",
                transform: "translate3d(0,0,0)",
                fontWeight: "800",
              }}
            >
              Create Setup
            </Button>
          </Link>
          <Link to="/play/decks">
            <Button
              sx={{
                height: "100%",
                ...(isPhoneDevice ? { px: 1 } : {}),
                textTransform: "none",
                transform: "translate3d(0,0,0)",
                fontWeight: "800",
              }}
            >
              Decks
            </Button>
          </Link>
          <Link to="/play/createDeck">
            <Button
              sx={{
                height: "100%",
                ...(isPhoneDevice ? { px: 1 } : {}),
                textTransform: "none",
                transform: "translate3d(0,0,0)",
                fontWeight: "800",
              }}
            >
              Create Deck
            </Button>
          </Link>
        </ButtonGroup>
        {!isPhoneDevice && PageNavGames}
      </Box>
      {isPhoneDevice && <div>{PageNavGames}</div>}
    </>
  );

  return (
    <>
      {LobbyTabs}
      {GameList}
      {Buttons}

      <Grid container sx={{ mt: 4 * 1 }}>
        <Grid item xs={12} md={7}>
          <Comments
            fullWidth
            location={
              lobbyName === "Mafia" || lobbyName === "All"
                ? "lobby"
                : `lobby-${lobbyName}`
            }
          />
        </Grid>
      </Grid>
    </>
  );
};
