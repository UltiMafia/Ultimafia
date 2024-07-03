import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Grid, Box, Link } from "@mui/material";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar } from "../User/User";
import { RoleCount } from "../../components/Roles";

export default function Contributors(props) {
  const [contributors, setContributors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const errorAlert = useErrorAlert();

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

  if (!loaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      </Box>
    );
  }

  const developers = contributors["dev"]?.map((user) => (
    <Grid item xs={12} sm={6} md={4} key={user.id}>
      <Box display="flex" alignItems="center">
        <NameWithAvatar
          small
          id={user.id}
          name={user.name}
          avatar={user.avatar}
        />
      </Box>
    </Grid>
  ));

  const artists = contributors["art"]?.map((item, index) => {
    const user = item.user;
    const roles = item.roles;

    var roleIcons = [];
    for (let gameType in roles) {
      const rolesForGameType = roles[gameType];
      roleIcons.push(
        ...rolesForGameType.map((roleName, i) => (
          <RoleCount key={i} scheme="vivid" role={roleName} gameType={gameType} />
        ))
      );
    }

    return (
      <Grid item xs={12} sm={6} md={4} key={user.id + index}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box display="flex" alignItems="center">
            <NameWithAvatar
            small
            id={user.id}
            name={user.name}
            avatar={user.avatar}
          />
          </Box>
          <Box display="flex" flexWrap="wrap" justifyContent="center" mt={2}>
            {roleIcons}
          </Box>
        </Box>
      </Grid>
    );
  });

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Typography variant="h4" gutterBottom>
          Contributors
        </Typography>
        <Typography variant="body1" paragraph>
          Thank you to everyone who helped build this site and community. This page recognizes people who contributed to site development, but let's not forget moderators, ex-moderators, and community organizers who play a big part in building our community. If you are missed out, please DM us as soon as possible!
        </Typography>
      </Box>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Developers
        </Typography>
        <Typography variant="body2" paragraph>
          Includes coders on <Link href="https://github.com/UltiMafia/Ultimafia" target="_blank" rel="noopener noreferrer">Github</Link> and the role patrol on our discord.
        </Typography>
        <Grid container spacing={2}>
          {developers}
        </Grid>
      </Box>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Artists
        </Typography>
        <Typography variant="body2" paragraph>
          Role icon artists. Work in progress!
        </Typography>
        <Grid container spacing={2}>
          {artists}
        </Grid>
      </Box>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Music/Sound Contributors
        </Typography>
        <Typography variant="body2" paragraph>
          Music is by Fred, check out his YouTube <Link href="https://www.youtube.com/@fredthemontymole" target="_blank" rel="noopener noreferrer">@fredthemontymole</Link>
        </Typography>
      </Box>
    </Container>
  );
}
