import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Typography,
  CircularProgress,
} from "@mui/material";
import { NameWithAvatar } from "../User/User";
import {
  KUDOS_ICON,
  KARMA_ICON,
  ACHIEVEMENTS_ICON,
  DAILY_ICON,
} from "../User/Profile";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [sorted, setSorted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState("winLossRatio");
  const [order, setOrder] = useState("desc");

  useEffect(() => {
    axios
      .get(`/api/user/leaderboard`)
      .then((res) => {
        const highkarmaUsers = res.data.leadingKarmaUsers.map((user) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          winLossRatio: user.winRate,
          //(user.stats ? (user.stats["Mafia"].all.wins.count/user.stats["Mafia"].all.wins.total) : 0),
          kudos: user.kudos,
          karma: user.karma,
          achievements: user.achievementCount,
          dailyChallengesCompleted: user.dailyChallengesCompleted,
        }));
        const highkudosUsers = res.data.leadingKudosUsers.map((user) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          winLossRatio: user.winRate,
          //(user.stats ? (user.stats["Mafia"].all.wins.count/user.stats["Mafia"].all.wins.total) : 0),
          kudos: user.kudos,
          karma: user.karma,
          achievements: user.achievementCount,
          dailyChallengesCompleted: user.dailyChallengesCompleted,
        }));
        const highachievementUsers = res.data.leadingAchievementUsers.map(
          (user) => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            winLossRatio: user.winRate,
            // (user.stats ? (user.stats["Mafia"].all.wins.count/user.stats["Mafia"].all.wins.total) : 0),
            kudos: user.kudos,
            karma: user.karma,
            achievements: user.achievementCount,
            dailyChallengesCompleted: user.dailyChallengesCompleted,
          })
        );
        const highWinRateUsers = res.data.leadingStatsUsers.map((user) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          winLossRatio: user.winRate,
          //(user.stats ? (user.stats["Mafia"].all.wins.count/user.stats["Mafia"].all.wins.total) : 0),
          kudos: user.kudos,
          karma: user.karma,
          achievements: user.achievementCount,
          dailyChallengesCompleted: user.dailyChallengesCompleted,
        }));
        const highdailyChallengesUsers =
          res.data.leadingDailyChallengesUsers.map((user) => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            winLossRatio: user.winRate,
            //(user.stats ? (user.stats["Mafia"].all.wins.count/user.stats["Mafia"].all.wins.total) : 0),
            kudos: user.kudos,
            karma: user.karma,
            achievements: user.achievementCount,
            dailyChallengesCompleted: user.dailyChallengesCompleted,
          }));
        const formattedUsers = res.data.leadingKarmaUsers.map((user) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          winLossRatio: user.winRate,
          //(user.stats ? (user.stats["Mafia"].all.wins.count/user.stats["Mafia"].all.wins.total) : 0),
          kudos: user.kudos,
          karma: user.karma,
          achievements: user.achievementCount,
          dailyChallengesCompleted: user.dailyChallengesCompleted,
        }));
        setSorted([
          highkarmaUsers,
          highkudosUsers,
          highachievementUsers,
          highWinRateUsers,
          highdailyChallengesUsers,
        ]);
        setUsers(formattedUsers);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
      });
  }, []);
  let tempsortedUsers = sorted[0];
  if (orderBy == "winLossRatio") {
    tempsortedUsers = sorted[3];
  } else if (orderBy == "kudos") {
    tempsortedUsers = sorted[1];
  } else if (orderBy == "karma") {
    tempsortedUsers = sorted[0];
  } else if (orderBy == "achievements") {
    tempsortedUsers = sorted[2];
  } else if (orderBy == "dailyChallengesCompleted") {
    tempsortedUsers = sorted[4];
  }
  const sortedUsers = tempsortedUsers;
  /*[...users].sort((a, b) => {
    const valA = a[orderBy];
    const valB = b[orderBy];
    if (valA < valB) return order === "asc" ? -1 : 1;
    if (valA > valB) return order === "asc" ? 1 : -1;
    return 0;
  });
  */

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    //setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  return (
    <>
      <Typography variant="h2" gutterBottom>
        Leaderboard
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ bgcolor: "var(--scheme-color-background)" }}
      >
        {loading ? (
          <CircularProgress />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "winLossRatio"}
                    direction={orderBy === "winLossRatio" ? order : "asc"}
                    onClick={() => handleSort("winLossRatio")}
                  >
                    Win:Loss Ratio
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "kudos"}
                    direction={orderBy === "kudos" ? order : "asc"}
                    onClick={() => handleSort("kudos")}
                  >
                    <img src={KUDOS_ICON} alt="Kudos" /> Kudos
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "karma"}
                    direction={orderBy === "karma" ? order : "asc"}
                    onClick={() => handleSort("karma")}
                  >
                    <img src={KARMA_ICON} alt="Karma" /> Karma
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "achievements"}
                    direction={orderBy === "achievements" ? order : "asc"}
                    onClick={() => handleSort("achievements")}
                  >
                    <img src={ACHIEVEMENTS_ICON} alt="Achievements" />
                    Achievements
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "dailyChallengesCompleted"}
                    direction={
                      orderBy === "dailyChallengesCompleted" ? order : "asc"
                    }
                    onClick={() => handleSort("dailyChallengesCompleted")}
                  >
                    <img src={DAILY_ICON} alt="Karma" /> Daily Challenges
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <NameWithAvatar
                      id={user.id}
                      name={user.name}
                      avatar={user.avatar}
                    />
                  </TableCell>
                  <TableCell>{user.winLossRatio.toFixed(2)}</TableCell>
                  <TableCell>{user.kudos}</TableCell>
                  <TableCell>{user.karma}</TableCell>
                  <TableCell>{user.achievements}/40</TableCell>
                  <TableCell>{user.dailyChallengesCompleted}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </>
  );
}
