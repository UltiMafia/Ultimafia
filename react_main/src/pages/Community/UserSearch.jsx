import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "../../Contexts";
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

  const user = useContext(UserContext);

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
        })
        .catch(useErrorAlert);
    }
  }, [searchVal]);

  const users = userList.map((user) => (
    <Card
      key={user.id}
      className="user-cell"
      variant="outlined"
      sx={{ margin: 1 }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
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
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {users}
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <NewestUsers />
          {user.perms.viewFlagged && <FlaggedUsers />}
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
      <CardContent sx={{ display: "flex", flexDirection: "column" }}>
        <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
        <Typography variant="caption" sx={{ marginTop: "4px" }}>
          <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
        </Typography>
      </CardContent>
    </Card>
  ));

  return (
    <Box className="newest-users box-panel">
      <Typography variant="h6" className="heading">
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

function FlaggedUsers(props) {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);

  const errorAlert = useErrorAlert();

  useEffect(() => {
    onPageNav(1);
  }, []);

  function onPageNav(_page) {
    var filterArg = getPageNavFilterArg(_page, page, users, "joined");

    if (filterArg == null) return;

    axios
      .get(`/api/user/flagged?${filterArg}`)
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
      <CardContent sx={{ display: "flex", flexDirection: "column" }}>
        <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
        <Typography variant="caption" sx={{ marginTop: "4px" }}>
          <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
        </Typography>
      </CardContent>
    </Card>
  ));

  return (
    <Box className="flagged-users box-panel">
      <Typography variant="h6" className="heading">
        Flagged Users
      </Typography>
      <Box className="users-list">
        <PageNav page={page} onNav={onPageNav} inverted />
        {userRows}
        <PageNav page={page} onNav={onPageNav} inverted />
      </Box>
    </Box>
  );
}
