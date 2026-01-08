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
  IconButton,
} from "@mui/material";
import { NameWithAvatar, Avatar } from "../User/User";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import Setup from "components/Setup";
import { NewLoading } from "pages/Welcome/NewLoading";
import { GameRow } from "pages/Play/LobbyBrowser/GameRow";
import { Link, useSearchParams } from "react-router-dom";
import { UserContext } from "Contexts";
import { PageNav, SearchBar } from "components/Nav";

export const QUERY_PARAM_SEASON = "season";
export const QUERY_PARAM_ROUND = "round";

const POINTS_ICON = require(`images/points.png`);
const PRESTIGE_ICON = require(`images/prestige.png`);

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

function Overview({ roundInfo, seasonInfo }) {
  const isPhoneDevice = useIsPhoneDevice();
  const [userSearch, setUserSearch] = useState("");
  const [pageNumSeason, setPageNumSeason] = useState(1);
  const [pageNumRound, setPageNumRound] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const userStandingsSeasonFull = seasonInfo.standings.filter((seasonStanding) => seasonInfo.users[seasonStanding.userId].user.name.toLowerCase().includes(userSearch));
  const userStandingsSeason = userStandingsSeasonFull.slice((pageNumSeason-1)*itemsPerPage, pageNumSeason*itemsPerPage);

  const userStandingsRoundFull = roundInfo.standings.filter((roundStanding) => roundInfo.users[roundStanding.userId].user.name.toLowerCase().includes(userSearch));
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
                const user = seasonInfo.users[userId].user;
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
                      {seasonStanding.points}
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
                      {seasonStanding.tiebreakerPoints}
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
                const user = roundInfo.users[userId].user;
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
                      {points}
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

function GameHistory({ roundInfo }) {
  const isPhoneDevice = useIsPhoneDevice();

  let currentRoundGamesByDay = {};
  if (roundInfo) {
    for (let gameCompletion of roundInfo.gameCompletions) {
      if (currentRoundGamesByDay[gameCompletion.day] === undefined) {
        currentRoundGamesByDay[gameCompletion.day] = [];
      }
      currentRoundGamesByDay[gameCompletion.day].push(gameCompletion);
    }
  }

  return (
    <Stack direction="column" spacing={1}>
      {Object.keys(currentRoundGamesByDay).map((day) => (
        <Stack direction="column" spacing={1} key={day}>
          <Typography variant="h3">Day {day}</Typography>
          {currentRoundGamesByDay[day].map((gameCompletion) => (
            <Paper
              elevation={2}
              sx={{
                p: 2,
                height: "100%",
              }}
            >
              <Grid2
                container
                columns={isPhoneDevice ? 1 : 2}
                key={gameCompletion.game.id}
                spacing={isPhoneDevice ? 1 : 4}
              >
                <Grid2 size={1}>
                  <GameRow
                    game={gameCompletion.game}
                    lobby={"Competitive"}
                    showGameTypeIcon
                    showGameState
                  />
                </Grid2>
                <Grid2 size={1}>
                  {gameCompletion.pointsEarnedByPlayers.map(
                    (pointsEarnedByPlayer) => {
                      const userId = pointsEarnedByPlayer.userId;
                      const user = roundInfo.users[userId].user;
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
                            {pointsEarnedByPlayer.points}
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
      });
  }, [seasonNumber, roundNumber]);

  useEffect(() => {
    if (currentRoundInfo && currentRoundInfo.seasonNumber) {
      axios
        .get(`/api/competitive/season/${currentRoundInfo.seasonNumber}`)
        .then((response) => {
          setCurrentSeasonInfo(response.data);
        });
    }
  }, [currentRoundInfo ? currentRoundInfo.seasonNumber : null]);

  if (!currentSeasonInfo) {
    return <NewLoading />;
  }

  if (!currentRoundInfo || Object.keys(currentRoundInfo).length === 0) {
    return <NewLoading />;
  }

  const roundHasStarted =
    currentRoundInfo.round && currentRoundInfo.round.currentDay > 0;

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
        {user.loggedIn && (
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
                    Stack
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
                      {currentSeasonInfo.users[user.id]?.points || 0}
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
                      Stack
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
                        {currentRoundInfo.users[user.id]?.points || 0}
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
              <Box
                sx={{
                  marginLeft: "auto !important",
                }}
              >
                <IconButton component={Link} to="faq" aria-label="faq">
                  <i className="fas fa-question-circle" />
                </IconButton>
              </Box>
            </Stack>
          </Grid2>
        )}
      </Grid2>
      {currentRoundInfo.round && (
        <>
          <Tabs
            centered
            value={tab}
            onChange={(_, newValue) => setTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Tab label="Overview" value="overview" />
            {roundHasStarted && (
              <Tab label="Round History" value="gameHistory" />
            )}
          </Tabs>
          <Stack spacing={1} sx={{ display: tab === "overview" ? undefined : "none" }}>
            <Overview
              roundInfo={currentRoundInfo}
              seasonInfo={currentSeasonInfo}
            />
          </Stack>
          <Box sx={{ display: tab === "gameHistory" ? undefined : "none" }}>
            <GameHistory roundInfo={currentRoundInfo} />
          </Box>
        </>
      )}
    </Stack>
  );
}
