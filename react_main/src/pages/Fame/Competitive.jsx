import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Typography,
  CircularProgress,
  Stack,
  Grid2,
  Divider,
  Tabs,
  Tab,
  Box,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Button,
  TextField,
} from "@mui/material";
import { NameWithAvatar, Avatar } from "../User/User";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import Setup from "components/Setup";
import { Loading } from "components/Loading";
import { GameRow } from "pages/Play/LobbyBrowser/GameRow";
import { useSearchParams } from "react-router-dom";
import { UserContext, SiteInfoContext } from "Contexts";
import { PageNav, SearchBar } from "components/Nav";
import { useErrorAlert } from "components/Alerts";
import { CompetitiveFaqContent } from "./CompetitiveFaq";

export const QUERY_PARAM_SEASON = "season";
export const QUERY_PARAM_ROUND = "round";

const POINTS_ICON = require(`images/points.png`);
const PRESTIGE_ICON = require(`images/prestige.png`);

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

/** Stable order for round history: completion time, then game id string. */
function compareRoundHistoryGames(a, b) {
  const endA = a.game?.endTime;
  const endB = b.game?.endTime;
  if (endA != null && endB != null && endA !== endB) {
    return endA - endB;
  }
  const idA = String(a.game?.id ?? "");
  const idB = String(b.game?.id ?? "");
  return idA.localeCompare(idB);
}

function Overview({ roundInfo, seasonInfo }) {
  const isPhoneDevice = useIsPhoneDevice();
  const [userSearch, setUserSearch] = useState("");
  const [pageNumSeason, setPageNumSeason] = useState(1);
  const [pageNumRound, setPageNumRound] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const userMatch = (user) => {
    if (userSearch === "") {
      return true;
    }
    else {
      return user && user.name.toLowerCase().includes(userSearch);
    }
  }

  const userStandingsSeasonFull = seasonInfo.standings.filter((seasonStanding) => userMatch(seasonInfo.users[seasonStanding.userId].user));
  const userStandingsSeason = userStandingsSeasonFull.slice((pageNumSeason-1)*itemsPerPage, pageNumSeason*itemsPerPage);

  const userStandingsRoundFull = roundInfo.standings.filter((roundStanding) => userMatch(roundInfo.users[roundStanding.userId].user));
  const userStandingsRound = userStandingsRoundFull.slice((pageNumRound-1)*itemsPerPage, pageNumRound*itemsPerPage);

  function handleItemsPerPageChange(e) {
    setItemsPerPage(e.target.value);
    setPageNumSeason(1);
    setPageNumRound(1);
  }

  function handleUserSearchChange(val) {
    setUserSearch(val.toLowerCase());
    setPageNumSeason(1);
    setPageNumRound(1);
  }

  return (
    <Stack direction="column" spacing={1}>
      <Stack direction="row" spacing={1} sx={{
        alignItems: "center",
        justifyContent: isPhoneDevice ? "center" : "space-between",
      }}>
        <SearchBar
          value={userSearch}
          placeholder="🔎 User Name"
          onInput={handleUserSearchChange}
        />
        <FormControl sx={{
          minWidth: "8em",
        }}>
          <InputLabel id="items-per-page-select-label">Items per page</InputLabel>
          <Select
            labelId="items-per-page-select-label"
            id="items-per-page-select"
            value={itemsPerPage}
            label="Items per page"
            onChange={handleItemsPerPageChange}
            size="small"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((num) => (
              <MenuItem value={num} key={num}>
                {num}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Grid2 container columns={isPhoneDevice ? 1 : 2} spacing={1}>
        <Grid2 size={1}>
          <Paper elevation={2} sx={{
            p: 2,
            height: "100%",
          }}>
            <Stack direction="column" spacing={1} divider={<Divider orientation="horizontal" flexItem />}>
              <Stack direction={isPhoneDevice ? "column" : "row"} spacing={1} sx={{
                alignItems: "center",
              }}>
                <Typography variant="h3" sx={{
                  marginRight: isPhoneDevice ? undefined : "auto !important",
                }}>
                  Season {roundInfo.seasonNumber} standings
                </Typography>
                <PageNav
                  page={pageNumSeason}
                  maxPage={Math.ceil(userStandingsSeasonFull.length/itemsPerPage)}
                  onNav={(val) => setPageNumSeason(val)}
                />
              </Stack>
              {userStandingsSeason.map((seasonStanding) => {
                const userId = seasonStanding.userId;
                const user = seasonInfo.users[userId].user || {};
                return (
                  <Box key={userId} sx={{
                    display: "grid",
                    gridTemplateColumns: "2em minmax(0, 1fr) 2em 16px 2em 16px",
                    gap: 0.5,
                    alignItems: "center",
                    textAlign: "right",
                  }}>
                    <Typography variant="h4" sx={{
                      textAlign: "left",
                    }}>
                      {seasonStanding.ranking+1}.
                    </Typography>
                    <Box sx={{ overflowX: "clip" }}>
                      <NameWithAvatar
                        id={user.id}
                        name={user.name}
                        avatar={user.avatar}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: "1",
                      }}
                    >
                      {Math.trunc(seasonStanding.points)}
                    </Typography>
                    <Tooltip title="prestige">
                      <img
                        src={PRESTIGE_ICON}
                        alt="prestige"
                        width="16px"
                        height="16px"
                      />
                    </Tooltip>
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: "1",
                      }}
                    >
                      {Math.trunc(seasonStanding.tiebreakerPoints)}
                    </Typography>
                    <Tooltip title="fortune">
                      <img
                        src={POINTS_ICON}
                        alt="Fortune"
                        width="16px"
                        height="16px"
                      />
                    </Tooltip>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid2>
        <Grid2 size={1}>
          <Paper elevation={2} sx={{
            p: 2,
            height: "100%",
          }}>
            <Stack direction="column" spacing={1} divider={<Divider orientation="horizontal" flexItem />}>
              <Stack direction={isPhoneDevice ? "column" : "row"} spacing={1} sx={{
                alignItems: "center",
              }}>
                <Typography variant="h3" sx={{
                  marginRight: isPhoneDevice ? undefined : "auto !important",
                }}>
                  Round {roundInfo.round.number} standings
                </Typography>
                <PageNav
                  page={pageNumRound}
                  maxPage={Math.ceil(userStandingsRoundFull.length/itemsPerPage)}
                  onNav={(val) => setPageNumRound(val)}
                />
              </Stack>
              {userStandingsRound.map((roundStanding) => {
                const userId = roundStanding.userId;
                const user = roundInfo.users[userId].user || {};
                const points = roundInfo.users[userId].points;
                const gamesPlayed = roundInfo.users[userId].gamesPlayed;

                return (
                  <Box key={roundStanding.userId} sx={{
                    display: "grid",
                    gridTemplateColumns: "2em minmax(0, 1fr) 2em 16px 1.5em 1em",
                    gap: 0.5,
                    alignItems: "center",
                    textAlign: "right",
                  }}>
                    <Typography variant="h4" sx={{
                      textAlign: "left",
                    }}>
                      {roundStanding.ranking+1}.
                    </Typography>
                    <Box sx={{ overflowX: "clip" }}>
                      <NameWithAvatar
                        id={user.id}
                        name={user.name}
                        avatar={user.avatar}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: "1",
                      }}
                    >
                      {Math.trunc(points)}
                    </Typography>
                    <Tooltip title="fortune">
                      <img
                        src={POINTS_ICON}
                        alt="Fortune"
                        width="16px"
                        height="16px"
                      />
                    </Tooltip>
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: "1",
                      }}
                    >
                      {gamesPlayed}
                    </Typography>
                    <Tooltip title="games played">
                      <i
                        className="fas fa-heart"
                        style={{
                          fontSize: "1em",
                          color: "var(--gold-heart-color)",
                        }}
                      />
                    </Tooltip>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid2>
      </Grid2>
      <Paper elevation={2} sx={{
        p: 2,
      }}>
        <Grid2 container columns={isPhoneDevice ? 1 : 3} spacing={1}>
          {seasonInfo.setupOrder.map((roundSetups, i) => (
            <Grid2 size={1}>
              <Stack direction="column" spacing={1} key={i} sx={{
                alignItems: "center",
              }}>
                <Typography variant="h3">Round {i + 1}</Typography>
                {roundSetups.map((setupNumber) => {
                  const setup = seasonInfo.setups[setupNumber];
                  return <Setup setup={setup} key={setup.id} />;
                })}
              </Stack>
            </Grid2>
          ))}
        </Grid2>
      </Paper>
    </Stack>
  );
}

function GameHistory({ roundInfo, canManageCompetitive, reloadRoundInfo }) {
  const isPhoneDevice = useIsPhoneDevice();
  const [playerFilter, setPlayerFilter] = useState("");

  // Parse "player1, player2" and resolve to userIds from round participants
  const getFilterUserIds = () => {
    const parts = playerFilter.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length !== 2) return null;
    const users = roundInfo?.users || {};
    const matchedIds = [];
    const usedIds = new Set();
    for (const part of parts) {
      const lower = part.toLowerCase();
      const found = Object.entries(users).find(
        ([id, data]) =>
          data?.user?.name &&
          data.user.name.toLowerCase().includes(lower) &&
          !usedIds.has(id)
      );
      if (found) {
        matchedIds.push(found[0]);
        usedIds.add(found[0]);
      }
    }
    return matchedIds.length === 2 ? matchedIds : null;
  };

  const filterUserIds = getFilterUserIds();
  let gameCompletionsFiltered = roundInfo?.gameCompletions || [];
  if (filterUserIds) {
    const [id1, id2] = filterUserIds;
    gameCompletionsFiltered = gameCompletionsFiltered.filter((gc) => {
      const playerIds = new Set(gc.pointsEarnedByPlayers.map((p) => String(p.userId)));
      return playerIds.has(String(id1)) && playerIds.has(String(id2));
    });
  }

  let currentRoundGamesByDay = {};
  if (roundInfo) {
    for (let gameCompletion of gameCompletionsFiltered) {
      if (currentRoundGamesByDay[gameCompletion.day] === undefined) {
        currentRoundGamesByDay[gameCompletion.day] = [];
      }
      currentRoundGamesByDay[gameCompletion.day].push(gameCompletion);
    }
    for (const day of Object.keys(currentRoundGamesByDay)) {
      currentRoundGamesByDay[day].sort(compareRoundHistoryGames);
    }
  }

  const dayKeysSorted = Object.keys(currentRoundGamesByDay).sort(
    (a, b) => Number(a) - Number(b)
  );

  return (
    <Stack direction="column" spacing={1}>
      <SearchBar
        value={playerFilter}
        placeholder="Search for games with 2 players"
        onInput={setPlayerFilter}
      />
      {filterUserIds && (
        <Typography variant="body2" color="text.secondary">
          Showing {gameCompletionsFiltered.length} game(s) with both players
        </Typography>
      )}
      {dayKeysSorted.map((day) => (
        <Stack direction="column" spacing={1} key={day}>
          <Typography variant="h3">Day {day}</Typography>
          {currentRoundGamesByDay[day].map((gameCompletion) => (
            <Paper
              elevation={2}
              sx={{
                p: 2,
                height: "100%",
              }}
              key={gameCompletion.game.id}
            >
              <Grid2
                container
                columns={isPhoneDevice ? 1 : 2}
                spacing={isPhoneDevice ? 1 : 4}
              >
                <Grid2 size={1}>
                  <Stack direction="column" spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Game {gameCompletion.game.id}
                    </Typography>
                    <GameRow
                      game={gameCompletion.game}
                      lobby={"Competitive"}
                      showGameTypeIcon
                      showGameState
                    />
                    {canManageCompetitive && (
                      <PointsAdjustmentForm
                        gameCompletion={gameCompletion}
                        roundInfo={roundInfo}
                        reloadRoundInfo={reloadRoundInfo}
                      />
                    )}
                  </Stack>
                </Grid2>
                <Grid2 size={1}>
                  {gameCompletion.pointsEarnedByPlayers.map(
                    (pointsEarnedByPlayer) => {
                      const userId = pointsEarnedByPlayer.userId;
                      const user = roundInfo.users[userId].user || {};
                      return (
                        <Stack
                          direction="row"
                          spacing={1}
                          key={userId}
                          sx={{
                            alignItems: "center",
                          }}
                        >
                          <NameWithAvatar
                            id={userId}
                            name={user.name}
                            avatar={user.avatar}
                          />
                          <Typography sx={{ marginLeft: "auto !important" }}>
                            {Math.trunc(pointsEarnedByPlayer.points)}
                          </Typography>
                          <img src={POINTS_ICON} alt="Fortune" />
                        </Stack>
                      );
                    }
                  )}
                </Grid2>
              </Grid2>
            </Paper>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function SeasonRoundSelect({ seasonNumber, roundNumber, setSearchParams }) {
  const [seasonList, setSeasonList] = useState([]);

  useEffect(() => {
    document.title = "Competitive | UltiMafia";

    axios
      .get(`/api/competitive/seasons`)
      .then((response) => {
        // Ensure response.data is an array
        setSeasonList(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        console.error("Error fetching seasons:", error);
        // Set to empty array on error
        setSeasonList([]);
      });
  }, []);

  let roundList = null;
  if (seasonNumber !== "latest" && seasonList[seasonNumber - 1]) {
    roundList = seasonList[seasonNumber - 1].rounds;
  } else if (seasonNumber === "latest" && seasonList.length > 0) {
    roundList = seasonList[seasonList.length - 1].rounds;
  }

  function handleSeasonChange(e) {
    const newSeasonNumber = e.target.value;
    setSearchParams((searchParams) => {
      if (newSeasonNumber !== "latest") {
        searchParams.set(QUERY_PARAM_SEASON, newSeasonNumber);
      } else {
        searchParams.delete(QUERY_PARAM_SEASON);
      }
      searchParams.delete(QUERY_PARAM_ROUND);
      return searchParams;
    });
  }

  function handleRoundChange(e) {
    const newRoundNumber = e.target.value;
    setSearchParams((searchParams) => {
      if (newRoundNumber !== "latest") {
        searchParams.set(QUERY_PARAM_ROUND, newRoundNumber);
      } else {
        searchParams.delete(QUERY_PARAM_ROUND);
      }
      return searchParams;
    });
  }

  return (
    <Stack direction="row" spacing={1}>
      <FormControl fullWidth>
        <InputLabel id="season-select-label">Season</InputLabel>
        <Select
          labelId="season-select-label"
          id="season-select"
          value={seasonNumber}
          label="Season"
          onChange={handleSeasonChange}
        >
          <MenuItem value={"latest"}>Latest</MenuItem>
          {seasonList.map((season) => (
            <MenuItem value={season.number} key={season.number}>
              {season.number}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {roundList && (
        <FormControl fullWidth>
          <InputLabel id="round-select-label">Round</InputLabel>
          <Select
            labelId="round-select-label"
            id="round-select"
            value={roundNumber}
            label="Round"
            onChange={handleRoundChange}
          >
            <MenuItem value={"latest"}>Latest</MenuItem>
            {roundList
              .filter((round) => round.number > 0)
              .map((round) => (
                <MenuItem value={round.number} key={round.number}>
                  {round.number}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
}

export default function Competitive() {
  const [tab, setTab] = useState("overview");
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentRoundInfo, setCurrentRoundInfo] = useState(null);
  const [currentSeasonInfo, setCurrentSeasonInfo] = useState(null);
  const isPhoneDevice = useIsPhoneDevice();
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const canManageCompetitive = Boolean(user?.perms?.manageCompetitive);

  const seasonNumber = searchParams.get("season")
    ? Number.parseInt(searchParams.get("season"))
    : "latest";
  const roundNumber = searchParams.get("round")
    ? Number.parseInt(searchParams.get("round"))
    : "latest";

  useEffect(() => {
    axios
      .get(`/api/competitive/roundInfo`, {
        params: {
          seasonNumber: seasonNumber,
          roundNumber: roundNumber,
        },
      })
      .then((response) => {
        setCurrentRoundInfo(response.data);
      })
      .catch(errorAlert);
  }, [seasonNumber, roundNumber]);

  const reloadRoundInfo = () => {
    axios
      .get(`/api/competitive/roundInfo`, {
        params: {
          seasonNumber: seasonNumber,
          roundNumber: roundNumber,
        },
      })
      .then((response) => {
        setCurrentRoundInfo(response.data);
      })
      .catch(errorAlert);
  };

  useEffect(() => {
    if (currentRoundInfo && currentRoundInfo.seasonNumber) {
      axios
        .get(`/api/competitive/season/${currentRoundInfo.seasonNumber}`)
        .then((response) => {
          setCurrentSeasonInfo(response.data);
        });
    }
  }, [currentRoundInfo ? currentRoundInfo.seasonNumber : null]);

  useEffect(() => {
    if (!currentRoundInfo || Object.keys(currentRoundInfo).length === 0) return;
    if (currentRoundInfo.seasonNumber !== null && !currentSeasonInfo) return;
    const hasRound = Boolean(currentRoundInfo.round);
    const roundHasStarted =
      currentRoundInfo.round && currentRoundInfo.round.currentDay > 0;
    if (tab === "gameHistory" && !(hasRound && roundHasStarted)) {
      setTab("overview");
    }
  }, [currentRoundInfo, currentSeasonInfo, tab]);

  if (!currentRoundInfo || Object.keys(currentRoundInfo).length === 0) {
    return <Loading />;
  }

  if (currentRoundInfo.seasonNumber !== null && !currentSeasonInfo) {
    return <Loading />;
  }

  const isOffseason = !currentRoundInfo.seasonNumber;
  const hasRound = Boolean(currentRoundInfo.round);
  const roundHasStarted =
    currentRoundInfo.round && currentRoundInfo.round.currentDay > 0;
  const activeTab = isOffseason ? "faq" : tab;

  let displayTitle = null;
  let caption = null;
  if (currentRoundInfo.seasonNumber) {
    if (currentRoundInfo.round) {
      if (currentRoundInfo.seasonPaused) {
        displayTitle = `Season ${currentRoundInfo.seasonNumber} - Round ${currentRoundInfo.round.number} - Paused`;
      } else if (currentRoundInfo.nextEvent) {
        const date = new Date(currentRoundInfo.nextEvent.date);
        if (currentRoundInfo.nextEvent.type === "start") {
          displayTitle = `Season ${currentRoundInfo.seasonNumber} - Round ${currentRoundInfo.round.number}`;
          caption = `Next round starts on ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        } else if (currentRoundInfo.nextEvent.type === "complete") {
          displayTitle = `Season ${currentRoundInfo.seasonNumber} - Round ${currentRoundInfo.round.number} - Day ${currentRoundInfo.round.currentDay}`;
          caption = `Current round closes on ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        } else if (currentRoundInfo.nextEvent.type === "account") {
          displayTitle = `Season ${currentRoundInfo.seasonNumber} - Round ${currentRoundInfo.round.number} - Closed`;
          caption = `Round standings confirm on ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        }
      } else {
        const date = new Date(currentRoundInfo.round.dateCompleted);
        displayTitle = `Season ${currentRoundInfo.seasonNumber} - Round ${currentRoundInfo.round.number} - Closed`;
        caption = `Round completed on ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      }
    } else {
      displayTitle = `Season ${currentRoundInfo.seasonNumber}`;
    }
  } else {
    displayTitle = "Offseason";
  }

  return (
    <Stack direction="column" spacing={1}>
      <Grid2
        container
        columns={isPhoneDevice ? 1 : 3}
        spacing={1}
        sx={{
          alignItems: "center",
        }}
      >
        <Grid2 size={1}>
          <Stack
            direction="column"
            spacing={0.5}
            sx={{
              alignItems: "center",
            }}
          >
            <Typography variant="h2">{displayTitle}</Typography>
            {caption && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: isPhoneDevice ? "center" : "right",
                }}
              >
                {caption}
              </Typography>
            )}
          </Stack>
        </Grid2>
        <Grid2 size={1}>
          <SeasonRoundSelect
            seasonNumber={seasonNumber}
            roundNumber={roundNumber}
            setSearchParams={setSearchParams}
          />
        </Grid2>
        {user.loggedIn && currentSeasonInfo && (
          <Grid2 size={1}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                borderRadius: 1,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "divider",
                p: 1,
              }}
            >
              <Avatar
                id={user.id}
                hasImage={user.avatar}
                name={user.name}
                isSquare
              />
              <Stack direction="column" spacing={0}>
                <Typography>{user.name}</Typography>
                <Stack direction="row" spacing={1}>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: "1",
                      }}
                    >
                      {Math.trunc(currentSeasonInfo.users[user.id]?.points || 0)}
                    </Typography>
                    <Tooltip title="prestige">
                      <img
                        src={PRESTIGE_ICON}
                        alt="Prestige"
                        width="16px"
                        height="16px"
                      />
                    </Tooltip>
                  </Stack>
                  {currentRoundInfo.users && (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          lineHeight: "1",
                        }}
                      >
                        {Math.trunc(currentRoundInfo.users[user.id]?.points || 0)}
                      </Typography>
                      <Tooltip title="fortune">
                        <img
                          src={POINTS_ICON}
                          alt="Fortune"
                          width="16px"
                          height="16px"
                        />
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Grid2>
        )}
      </Grid2>
      <Tabs
        centered
        value={activeTab}
        onChange={(_, newValue) => {
          if (!isOffseason) setTab(newValue);
        }}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {!isOffseason && <Tab label="Overview" value="overview" />}
        {!isOffseason && hasRound && roundHasStarted && (
          <Tab label="Round History" value="gameHistory" />
        )}
        <Tab label="FAQ" value="faq" />
      </Tabs>
      {!isOffseason && activeTab === "overview" && (
        <Stack spacing={1}>
          <Overview
            roundInfo={currentRoundInfo}
            seasonInfo={currentSeasonInfo}
          />
        </Stack>
      )}
      {!isOffseason && hasRound && roundHasStarted && activeTab === "gameHistory" && (
        <Box>
          <GameHistory
            roundInfo={currentRoundInfo}
            canManageCompetitive={canManageCompetitive}
            reloadRoundInfo={reloadRoundInfo}
          />
        </Box>
      )}
      {activeTab === "faq" && (
        <Box sx={{ mt: 1 }}>
          <CompetitiveFaqContent />
        </Box>
      )}
    </Stack>
  );
}

function PointsAdjustmentForm({ gameCompletion, roundInfo, reloadRoundInfo }) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [operation, setOperation] = useState("+");
  const [points, setPoints] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const players = (gameCompletion.pointsEarnedByPlayers || []).map(
    (pointsEarnedByPlayer) => {
      const userId = pointsEarnedByPlayer.userId;
      const user = roundInfo.users[userId]?.user || {};
      return {
        userId: String(userId),
        name: user.name || `User ${userId}`,
      };
    }
  );

  const onSubmit = () => {
    const trimmedPoints = String(points).trim();
    const numericPoints = Number(trimmedPoints);

    if (!selectedUserId) {
      siteInfo.showAlert("Please select a player.", "warning");
      return;
    }

    if (!trimmedPoints || Number.isNaN(numericPoints) || numericPoints <= 0) {
      siteInfo.showAlert("Please enter a positive point amount.", "warning");
      return;
    }

    const delta = operation === "-" ? -numericPoints : numericPoints;

    setSubmitting(true);
    axios
      .post("/api/competitive/adjustPoints", {
        gameId: gameCompletion.game.id,
        userId: selectedUserId,
        delta,
      })
      .then(() => {
        siteInfo.showAlert("Points adjustment applied.", "success");
        setSelectedUserId("");
        setOperation("+");
        setPoints("");
        if (typeof reloadRoundInfo === "function") {
          reloadRoundInfo();
        }
      })
      .catch(errorAlert)
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (players.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor: "var(--scheme-color)",
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Points Adjustment
      </Typography>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "stretch", md: "center" } }}
      >
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id={`points-adjust-player-${gameCompletion.game.id}`}>
            Player
          </InputLabel>
          <Select
            labelId={`points-adjust-player-${gameCompletion.game.id}`}
            value={selectedUserId}
            label="Player"
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {players.map((p) => (
              <MenuItem key={p.userId} value={p.userId}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <InputLabel id={`points-adjust-op-${gameCompletion.game.id}`}>
            +/- 
          </InputLabel>
          <Select
            labelId={`points-adjust-op-${gameCompletion.game.id}`}
            value={operation}
            label="+/-"
            onChange={(e) => setOperation(e.target.value)}
          >
            <MenuItem value="+">+</MenuItem>
            <MenuItem value="-">-</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          type="number"
          label="Points"
          inputProps={{ min: 1 }}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          sx={{ width: 100 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={submitting}
          sx={{ whiteSpace: "nowrap" }}
        >
          {submitting ? "Updating..." : "Apply"}
        </Button>
      </Stack>
    </Box>
  );
}
