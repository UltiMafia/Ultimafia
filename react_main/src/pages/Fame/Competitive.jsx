import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Typography,
  CircularProgress,
  Stack,
  Grid2,
  Divider,
} from "@mui/material";
import { NameWithAvatar } from "../User/User";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import Setup from "components/Setup";

export const POINTS_ICON = require(`images/points.png`);

export default function Competitive() {
  const [seasons, setSeasons] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [currentSeasontandings, setCurrentSeasonStandings] = useState([]);
  const [currentRoundStandings, setCurrentRoundStandings] = useState([]);
  const isPhoneDevice = useIsPhoneDevice();

  useEffect(() => {
    document.title = "Competitive | UltiMafia";

    axios.get(`/api/competitive/seasons`).then((response) => {
      const seasons = response.data;
      for (const season of seasons) {
        let isCurrentSeason = false;
        if (!season.completed) {
          isCurrentSeason = true;
          setCurrentSeason(season);
        }
        for (const round of season.rounds) {
          if (isCurrentSeason && !round.completed) {
            setCurrentRound(round);
          }
          console.log(`Rendering season ${season.number} round ${round.number}`);
          updateEvents({
            type: "add",
            event: {
              title: `Competitive Season ${season.number} Round ${round.number}`,
              start: round.startDate,
              end: round.endDate,
            },
          })
        }
      }
    });
  }, []);

  useEffect(() => {
    if (currentSeason) {
      axios.get(`/api/competitive/season/${currentSeason.number}/round/${currentSeason.currentRound}/standings`).then((response) => {
        setCurrentRoundStandings(response.data);
      });
      axios.get(`/api/competitive/season/${currentSeason.number}/standings`).then((response) => {
        setCurrentSeasonStandings(response.data);
      });
    }
  }, [currentSeason ? currentSeason.number : null]);

  return (
    <Stack direction="column" spacing={1}>
      <Typography variant="h2" sx={{
        borderBottom: 1,
        borderColor: "divider",
      }}>
        {currentSeason ? `Season ${currentSeason.number}` : "Offseason"}
        {currentSeason && currentRound ? ` Round ${currentSeason.currentRound} Day ${currentRound.currentDay}` : " Offround"}
      </Typography>
      {currentSeason && (<Grid2 container columns={isPhoneDevice ? 1 : 3} spacing={2}>
        <Grid2 size={1}>
          <Typography variant="h3" gutterBottom>
            Season top 10 players
          </Typography>
            {currentSeasontandings.map((seasonStanding) => (
              <Stack direction="row" spacing={1} key={seasonStanding.userId} sx={{
                alignItems: "center"
              }}>
                <Typography>
                  <NameWithAvatar
                    id={seasonStanding.user.id}
                    name={seasonStanding.user.name}
                    avatar={seasonStanding.user.avatar}
                  />
                </Typography>
                <Typography sx={{ marginLeft: "auto !important" }}>
                  {seasonStanding.points}
                </Typography>
              </Stack>
            ))}
        </Grid2>
        <Grid2 size={1}>
          <Stack direction="column" spacing={1} divider={<Divider orientation="horizontal" flexItem />}>
            <Typography variant="h3" gutterBottom>
              Round top 10 players
            </Typography>
            {currentRoundStandings.map((roundStanding) => (
              <Stack direction="row" spacing={1} key={roundStanding.userId} sx={{
                alignItems: "center"
              }}>
                <Typography>
                  <NameWithAvatar
                    id={roundStanding.user.id}
                    name={roundStanding.user.name}
                    avatar={roundStanding.user.avatar}
                  />
                </Typography>
                <Typography sx={{ marginLeft: "auto !important" }}>
                  {roundStanding.points}
                </Typography>
                <img
                  src={POINTS_ICON}
                  alt="Fortune"
                />
              </Stack>
            ))}
          </Stack>
        </Grid2>
        <Grid2 size={1}>
          <Stack direction="column" spacing={1}>
            <Typography variant="h3">
              Setups
            </Typography>
            {currentSeason.setups.map((setup) => (
              <Setup setup={setup} key={setup.id} />
            ))}
          </Stack>
        </Grid2>
      </Grid2>)}
    </Stack>
  );
}
