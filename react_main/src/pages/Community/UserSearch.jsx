import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  TextField,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import { useTheme } from "@mui/styles";

import { UserContext } from "../../Contexts";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/User";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { Time } from "../../components/Basic";

export default function UserSearch(props) {
  const [userList, setUserList] = useState([]);
  const [searchVal, setSearchVal] = useState("");

  const user = useContext(UserContext);
  const theme = useTheme();

  useEffect(() => {
    document.title = "Users | UltiMafia";
  }, []);

  useEffect(() => {
    if (searchVal.length > 0) {
      axios
        .get(`/user/searchName?query=${searchVal}`)
        .then((res) => {
          setUserList(res.data);
        })
        .catch(useErrorAlert);
    } else {
      axios
        .get("/user/online")
        .then((res) => {
          setUserList(res.data);
        })
        .catch(useErrorAlert);
    }
  }, [searchVal]);

  const users = userList.map((user) => (
    <Grid item xs={12} key={user.id}>
      <Card style={{ padding: theme.spacing(2), display: "flex", alignItems: "center" }}>
        <CardContent style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
          <StatusIcon status={user.status} style={{ marginLeft: theme.spacing(2) }} />
          <Time minSec millisec={Date.now() - user.lastActive} suffix=" ago" />
        </CardContent>
      </Card>
    </Grid>
  ));

  return (
    <Box style={{ padding: theme.spacing(3) }}>
      <Typography variant="h4" gutterBottom>
        User Search
      </Typography>
      <TextField
        fullWidth
        label="Username"
        value={searchVal}
        onChange={(e) => setSearchVal(e.target.value)}
        variant="outlined"
        margin="normal"
      />
      <Grid container spacing={3}>
        {users}
      </Grid>
      <Box style={{ marginTop: theme.spacing(3) }}>
        <NewestUsers />
        {user.perms.viewFlagged && <FlaggedUsers />}
      </Box>
    </Box>
  );
}

function NewestUsers(props) {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  useEffect(() => {
    onPageNav(1);
  }, []);

  function onPageNav(_page) {
    var filterArg = getPageNavFilterArg(_page, page, users, "joined");

    if (filterArg == null) return;

    axios
      .get(`/user/newest?${filterArg}`)
      .then((res) => {
        if (res.data.length > 0) {
          setUsers(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  const userRows = users.map((user) => (
    <Grid item xs={12} key={user.id}>
      <Card style={{ padding: theme.spacing(2), display: "flex", alignItems: "center" }}>
        <CardContent style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
          <Typography style={{ marginLeft: theme.spacing(2) }}>
            <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ));

  return (
    <Box style={{ padding: theme.spacing(3) }}>
      <Typography variant="h5" gutterBottom>
        Newest Users
      </Typography>
      <PageNav page={page} onNav={onPageNav} inverted />
      <Grid container spacing={3}>
        {userRows}
      </Grid>
      <PageNav page={page} onNav={onPageNav} inverted />
    </Box>
  );
}

function FlaggedUsers(props) {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  useEffect(() => {
    onPageNav(1);
  }, []);

  function onPageNav(_page) {
    var filterArg = getPageNavFilterArg(_page, page, users, "joined");

    if (filterArg == null) return;

    axios
      .get(`/user/flagged?${filterArg}`)
      .then((res) => {
        if (res.data.length > 0) {
          setUsers(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  const userRows = users.map((user) => (
    <Grid item xs={12} key={user.id}>
      <Card style={{ padding: theme.spacing(2), display: "flex", alignItems: "center" }}>
        <CardContent style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
          <Typography style={{ marginLeft: theme.spacing(2) }}>
            <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ));

  return (
    <Box style={{ padding: theme.spacing(3) }}>
      <Typography variant="h5" gutterBottom>
        Flagged Users
      </Typography>
      <PageNav page={page} onNav={onPageNav} inverted />
      <Grid container spacing={3}>
        {userRows}
      </Grid>
      <PageNav page={page} onNav={onPageNav} inverted />
    </Box>
  );
}