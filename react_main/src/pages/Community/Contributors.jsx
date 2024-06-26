import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "@mui/styles";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Link,
} from "@mui/material";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar } from "../User/User";
import { RoleCount } from "../../components/Roles";
import { NewLoading } from "../Welcome/NewLoading";

export default function Contributors(props) {
  const [contributors, setContributors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const errorAlert = useErrorAlert();
  const theme = useTheme();

  useEffect(() => {
    document.title = "Contributors | UltiMafia";

    axios
      .get("/site/contributors")
      .then((res) => {
        setContributors(res.data);
        setLoaded(true);
      })
      .catch((e) => {
        setLoaded(true);
        errorAlert(e);
      });
  }, []);

  if (!loaded) return <NewLoading small />;

  const developers = contributors["dev"].map((user) => (
    <Grid item xs={12} sm={6} md={4} key={user.id}>
      <Paper style={{ padding: theme.spacing(2) }}>
        <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
      </Paper>
    </Grid>
  ));

  const artists = contributors["art"].map((item) => {
    const user = item.user;
    const roles = item.roles;

    var roleIcons = [];
    for (let gameType in roles) {
      const rolesForGameType = roles[gameType];
      roleIcons.push(
        ...rolesForGameType.map((roleName, index) => (
          <RoleCount key={index} scheme="vivid" role={roleName} gameType={gameType} />
        ))
      );
    }

    return (
      <Grid item xs={12} sm={6} md={4} key={user.id}>
        <Paper style={{ padding: theme.spacing(2) }}>
          <Box display="flex" alignItems="center">
            <Box flexGrow={1}>
              <NameWithAvatar id={user.id} name={user.name} avatar={user.avatar} />
            </Box>
            <Box>{roleIcons}</Box>
          </Box>
        </Paper>
      </Grid>
    );
  });

  return (
    <Container maxWidth="lg" style={{ marginTop: theme.spacing(4) }}>
      <Typography variant="body1" paragraph>
        Thank you to everyone who helped build this site and community. This page recognises people who contributed to site development, but not to forget moderators, ex-moderators, and community organisers who do a big part of the work building our community. If you are missed out, please DM us as soon as possible!
      </Typography>
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Developers
        </Typography>
        <Typography variant="body2" paragraph>
          Includes coders on <Link href="https://github.com/UltiMafia/Ultimafia" target="_blank" rel="noopener noreferrer">Github</Link> and the role patrol on our discord.
        </Typography>
        <Grid container spacing={3}>
          {developers}
        </Grid>
      </Box>
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Artists
        </Typography>
        <Typography variant="body2" paragraph>
          Role icon artists. Work in progress!
        </Typography>
        <Grid container spacing={3}>
          {artists}
        </Grid>
      </Box>
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Music
        </Typography>
        <Typography variant="body2" paragraph>
          Music is by Fred, check out his youtube{" "}
          <Link href="https://www.youtube.com/@fredthemontymole" target="_blank" rel="noopener noreferrer">
            @fredthemontymole
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}