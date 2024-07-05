import React, { useState, useEffect, useContext } from "react";
import axios from "axios";

import { UserContext } from "../../Contexts";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/User";

import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { Time } from "../../components/Basic";
import { Box, Grid, TextField, Card, CardContent, Typography } from "@mui/material";
import { useTheme } from '@mui/styles';
import "../../css/userSearch.css";

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
    <Card key={user.id} className="user-cell" variant="outlined" sx={{ margin: 1, display: 'inline-block' }}>
      <CardContent sx={{ display: "flex", alignItems: "center" }}>
        <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
        <Box sx={{ width: '8px' }} />
        <StatusIcon status={user.status} />
      </CardContent>
    </Card>
  ));
  
  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      <Card variant="outlined" sx={{ padding: theme.spacing(3), textAlign: 'justify' }}>
        <Box display="flex" flexDirection="row" padding={2}>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ maxHeight: '70vh', overflow: 'auto', display: 'flex', flexWrap: 'wrap' }}>
                {users}
              </Box>
            </Grid>
          </Grid>
          <Grid item xs="auto">
            <NewestUsers />
            {user.perms.viewFlagged && <FlaggedUsers />}
          </Grid>
        </Box>
      </Card>
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
    <Card key={user.id} className="user-row" variant="outlined" sx={{ marginBottom: 2 }}>
      <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
        <Typography variant="body2">
          <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
        </Typography>
      </CardContent>
    </Card>
  ));

  return (
    <Box className="newest-users box-panel">
      <Typography variant="h6" className="heading">Newest Users</Typography>
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
    <Card key={user.id} className="user-row" variant="outlined" sx={{ marginBottom: 2 }}>
      <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
        <Typography variant="body2">
          <Time minSec millisec={Date.now() - user.joined} suffix=" ago" />
        </Typography>
      </CardContent>
    </Card>
  ));

  return (
    <Box className="flagged-users box-panel">
      <Typography variant="h6" className="heading">Flagged Users</Typography>
      <Box className="users-list">
        <PageNav page={page} onNav={onPageNav} inverted />
        {userRows}
        <PageNav page={page} onNav={onPageNav} inverted />
      </Box>
    </Box>
  );
}
