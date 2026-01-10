import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { NameWithAvatar } from "../User/User";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import Setup from "components/Setup";
import { NewLoading } from "pages/Welcome/NewLoading";
import { GameRow } from "pages/Play/LobbyBrowser/GameRow";

export const POINTS_ICON = require(`images/points.png`);
export const PRESTIGE_ICON = require(`images/prestige.png`);

function Overview({ roundInfo }) {
  const [currentSeasonInfo, setCurrentSeasonInfo] = useState(null);
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    if (roundInfo.seasonNumber) {
      axios.get(`/api/competitive/season/${roundInfo.seasonNumber}`).then((response) => {
        setCurrentSeasonInfo(response.data);
      });
    }
  }, [roundInfo ? roundInfo.seasonNumber : null]);

  if (!currentSeasonInfo) {
    return <NewLoading />
  }

  return (<Grid2 container columns={isPhoneDevice ? 1 : 3} spacing={isPhoneDevice ? 1 : 4}>
    <Grid2 size={1}>
      <Stack direction="column" spacing={1} divider={<Divider orientation="horizontal" flexItem />}>
        <Typography variant="h3" gutterBottom>
          Season {roundInfo.seasonNumber} top 10 players
        </Typography>
        {currentSeasonInfo.standings.map((seasonStanding) => {
          const userId = seasonStanding.userId;
          const user = currentSeasonInfo.users[userId];
          return (
            <Box key={userId} sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 2em 16px 2em 16px",
              gap: 0.5,
              alignItems: "center",
              textAlign: "right",
            }}>
              <Box sx={{ overflowX: "clip" }}>
                <NameWithAvatar
                  id={user.id}
                  name={user.name}
                  avatar={user.avatar}
                />
              </Box>
              <Typography sx={{
                lineHeight: "1",
              }}>
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
              <Typography sx={{
                lineHeight: "1",
              }}>
                {"0"}
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
    </Grid2>
    <Grid2 size={1}>
      <Stack direction="column" spacing={1} divider={<Divider orientation="horizontal" flexItem />}>
        <Typography variant="h3" gutterBottom>
          Round {roundInfo.currentRound.number} top 10 players
        </Typography>
        {roundInfo.standings.map((roundStanding) => {
          const userId = roundStanding.userId;
          const user = roundInfo.users[userId].user;
          const points = roundInfo.users[userId].points;
          const gamesPlayed = roundInfo.users[userId].gamesPlayed;

          return (
            <Box key={roundStanding.userId} sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 2em 16px 1.5em 1em",
              gap: 0.5,
              alignItems: "center",
              textAlign: "right",
            }}>
              <Box sx={{ overflowX: "clip" }}>
                <NameWithAvatar
                  id={user.id}
                  name={user.name}
                  avatar={user.avatar}
                />
              </Box>
              <Typography sx={{
                lineHeight: "1",
              }}>
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
              <Typography sx={{
                lineHeight: "1",
              }}>
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
    </Grid2>
    <Grid2 size={1}>
      <Stack direction="column" spacing={1}>
        {currentSeasonInfo.setupOrder.map((roundSetups, i) => (
          <Stack direction="column" spacing={1} key={i}>
            <Typography variant="h3">
              Round {i+1}
            </Typography>
            {roundSetups.map((setupNumber) => {
              const setup = currentSeasonInfo.setups[setupNumber];
              return (
                <Setup setup={setup} key={setup.id} />
              );
            }
            )}
          </Stack>
        ))}
      </Stack>
    </Grid2>
  </Grid2>);
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
          <Typography variant="h3">
            Day {day}
          </Typography>
          {currentRoundGamesByDay[day].map((gameCompletion) => (
            <Grid2 container columns={isPhoneDevice ? 1 : 2} key={gameCompletion.game.id} spacing={isPhoneDevice ? 1 : 4}>
              <Grid2 size={1}>
                <GameRow
                  game={gameCompletion.game}
                  lobby={"Competitive"}
                  showGameTypeIcon
                  showGameState
                />
              </Grid2>
              <Grid2 size={1}>
                {gameCompletion.pointsEarnedByPlayers.map((pointsEarnedByPlayer) => {
                  const userId = pointsEarnedByPlayer.userId;
                  const user = roundInfo.users[userId].user;
                  return (
                    <Stack direction="row" spacing={1} key={userId} sx={{
                      alignItems: "center"
                    }}>
                      <NameWithAvatar
                        id={userId}
                        name={user.name}
                        avatar={user.avatar}
                        />
                      <Typography sx={{ marginLeft: "auto !important" }}>
                        {pointsEarnedByPlayer.points}
                      </Typography>
                      <img
                        src={POINTS_ICON}
                        alt="Fortune"
                      />
                    </Stack>
                  );
                })}
              </Grid2>
            </Grid2>
          ))}
        </Stack>
      ))}
    </Stack>
  )
}

export default function Competitive() {
  const [tab, setTab] = useState("overview");
  const [currentRoundInfo, setCurrentRoundInfo] = useState(null);
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    document.title = "Competitive | UltiMafia";

    axios
      .get(`/api/competitive/currentRound`)
      .then((response) => {
        setCurrentRoundInfo(response.data);
      });
  }, []);

  if (!currentRoundInfo) {
    return <NewLoading />
  }

  const roundHasStarted = currentRoundInfo.currentRound && currentRoundInfo.currentRound.currentDay > 0;

  let displayTitle = null;
  let caption = null;
  if (currentRoundInfo.seasonNumber) {
    if (roundHasStarted) {
      const date = new Date(currentRoundInfo.currentRound.endDate);
      displayTitle = `Season ${currentRoundInfo.seasonNumber} Round ${currentRoundInfo.currentRound.number} Day ${currentRoundInfo.currentRound.currentDay}`;
      caption = `Current round closes on ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
    else {
      const date = new Date(currentRoundInfo.currentRound.startDate);
      displayTitle = `Season ${currentRoundInfo.seasonNumber}`;
      caption = `Next round starts on ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
  }
  else {
    displayTitle = "Offseason";
  }

  return (
    <Stack direction="column" spacing={1}>
      <Stack direction={isPhoneDevice ? "column" : "row"} spacing={1} sx={{
        alignItems: "center",
      }}>
        <Typography variant="h2">
          {displayTitle}
        </Typography>
        {caption && (<Typography variant="caption" sx={{ marginLeft: isPhoneDevice ? undefined : "auto !important" }}>
          {caption}
        </Typography>)}
      </Stack>
      {currentRoundInfo.currentRound && (
        <>
          <Tabs
            value={tab}
            onChange={(_, newValue) => setTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
          }}>
            <Tab label="Overview" value="overview" />
            {roundHasStarted && (<Tab label="Round History" value="gameHistory" />)}
          </Tabs>
          <Box sx={{ display: tab === "overview" ? undefined : "none" }}>
            <Overview roundInfo={currentRoundInfo} />
          </Box>
          <Box sx={{ display: tab === "gameHistory" ? undefined : "none" }}>
            <GameHistory roundInfo={currentRoundInfo} />
          </Box>
        </>
      )}
    </Stack>
  );
}
