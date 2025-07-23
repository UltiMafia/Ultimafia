import React, { useState, useEffect } from "react";
import axios from "axios";
import { Typography, Grid, Box, Link } from "@mui/material";
import { useTheme } from "@mui/styles";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar } from "../User/User";
import { RoleCount } from "../../components/Roles";

export default function Contributors(props) {
  const theme = useTheme();
  const [contributors, setContributors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Contributors | UltiMafia";

    axios
      .get("/api/site/contributors")
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      ></Box>
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
          <RoleCount
            key={i}
            scheme="vivid"
            role={roleName.split(":")[0]}
            gameType={gameType}
            skin={roleName.split(":")[1] || "vivid"}
          />
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
    <>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Contributors
        </Typography>
        <Typography variant="body1" paragraph>
          This page serves as a record of gratitude to the many people who have
          contributed to UltiMafia and its predecessors over many years of
          operation. If you contributed to the development of UltiMafia and are
          not listed here, please contact an admin immediately!
        </Typography>
        <Typography variant="body1" paragraph>
          This website is open-source. Feel free to contribute on our{" "}
          <Link
            href="https://github.com/UltiMafia/Ultimafia"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </Link>{" "}
          in exchange for a special Dev profile badge and a spot on this page.
          Check out the other projects from our Devs below!
        </Typography>
      </Box>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Code & Design
        </Typography>
        <Grid container spacing={2}>
          {developers}
        </Grid>
      </Box>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Art & Graphics
        </Typography>
        <Grid container spacing={2}>
          {artists}
        </Grid>
      </Box>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Music & Sound
        </Typography>
        <Typography variant="body1" paragraph>
          Music is by Fred, check out his YouTube{" "}
          <Link
            href="https://www.youtube.com/@fredthemontymole"
            target="_blank"
            rel="noopener noreferrer"
          >
            @fredthemontymole
          </Link>
        </Typography>
      </Box>
    </>
  );
}
