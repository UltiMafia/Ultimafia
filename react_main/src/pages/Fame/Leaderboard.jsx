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
import { KUDOS_ICON, KARMA_ICON, ACHIEVEMENTS_ICON } from "../User/Profile";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState("winLossRatio");
  const [order, setOrder] = useState("desc");

  useEffect(() => {
    axios
      .get("/user/${id}")
      .then((res) => {
        const formattedUsers = res.data.slice(0, 20).map((user) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          winLossRatio:
            user.stats["Mafia"].all.wins.count /
            (user.stats["Mafia"].all.wins.total || 1),
          kudos: user.kudos,
          karma: user.karma,
          achievements: user.achievements.length || 0,
        }));
        setUsers(formattedUsers);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
      });
  }, []);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedUsers = [...users].sort((a, b) => {
    const valA = a[orderBy];
    const valB = b[orderBy];

    if (valA < valB) return order === "asc" ? -1 : 1;
    if (valA > valB) return order === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <TableContainer component={Paper}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>
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
                <TableCell>{user.achievements}/20</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
}
