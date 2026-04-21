import React, { useState, useEffect } from "react";
import axios from "axios";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/User";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { Time } from "../../components/Basic";
import {
  Box,
  Grid,
  TextField,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function UserSearch(props) {
  const theme = useTheme();
  const [userList, setUserList] = useState([]);
  const [searchVal, setSearchVal] = useState("");
  const [onlineCount, setOnlineCount] = useState(null);

  useEffect(() => {
    document.title = "Users | UltiMafia";
  }, []);

  useEffect(() => {
    if (searchVal.length > 0) {
      axios
        .get(`/api/user/searchName?query=${searchVal}`)
        .then((res) => {
          setUserList(res.data);
        })
        .catch(useErrorAlert);
    } else {
      axios
        .get("/api/user/online")
        .then((res) => {
          setUserList(res.data);
          setOnlineCount(res.data.length);
        })
        .catch(useErrorAlert);
    }
  }, [searchVal]);

  const users = userList.map((user) => (
    <Card key={user.id} className="user-cell" variant="outlined">
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "8px 12px",
          "&:last-child": { paddingBottom: "8px" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <NameWithAvatar
            id={user.id}
            name={user.name}
            avatar={user.avatar}
            vanityUrl={user.vanityUrl}
          />
          <Box sx={{ width: "8px" }} />
          <StatusIcon status={user.status} />
        </Box>
        <Typography variant="caption" sx={{ marginTop: "4px" }}>
          {/*<Time minSec millisec={Date.now() - user.lastActive} suffix=" ago" />*/}
        </Typography>
      </CardContent>
    </Card>
  ));

  return (
    <Box display="flex" flexDirection="row" padding={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
            {onlineCount == null
              ? "Loading online users…"
              : `${onlineCount} user${onlineCount === 1 ? "" : "s"} online`}
          </Typography>
          <TextField
            fullWidth
            label="🔎 Username"
            variant="outlined"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <Box
            sx={{
              overflowY: "auto",
              flexGrow: 1,
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {users}
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <NewestUsers />
        </Grid>
      </Grid>
    </Box>
  );
}

function NewestUsers(props) {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);

  const errorAlert = useErrorAlert();

  useEffect(() => {
    onPageNav(1);
  }, []);

  function onPageNav(_page) {
    var filterArg = getPageNavFilterArg(
      _page,
      page,
      users,
      "joined",
      "lastActive"
    );

    if (filterArg == null) return;

    axios
      .get(`/api/user/newest?${filterArg}`)
      .then((res) => {
        if (res.data.length > 0) {
          setUsers(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  const userRows = users.map((user) => (
    <Card
      key={user.id}
      className="user-row"
      variant="outlined"
      sx={{ marginBottom: 2 }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          padding: "8px 12px",
          "&:last-child": { paddingBottom: "8px" },
        }}
      >
        <NameWithAvatar
          id={user.id}
          name={user.name}
          avatar={user.avatar}
          vanityUrl={user.vanityUrl}
        />
        <Typography variant="caption" sx={{ marginTop: "4px" }}>
          <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
        </Typography>
      </CardContent>
    </Card>
  ));

  return (
    <Box className="newest-users box-panel">
      <Typography variant="h4" className="heading">
        Newest Users
      </Typography>
      <Box className="users-list">
        <PageNav page={page} onNav={onPageNav} inverted />
        {userRows}
        <PageNav page={page} onNav={onPageNav} inverted />
      </Box>
    </Box>
  );
}

