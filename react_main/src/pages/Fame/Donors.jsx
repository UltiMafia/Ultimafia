import React, { useState, useEffect } from "react";
import axios from "axios";
import { Typography, Grid, Box, Link } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar } from "../User/User";

export default function Donors(props) {
  const theme = useTheme();
  const [donors, setDonors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Donors | UltiMafia";

    axios
      .get("/api/site/donors")
      .then((res) => {
        setDonors(res.data);
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

  const siteDonors = donors.map((user) => (
    <Grid item xs={12} sm={6} md={4} key={user.id}>
      <Box display="flex" alignItems="center">
        <NameWithAvatar
          small
          id={user.id}
          name={user.name}
          vanityUrl={user.vanityUrl}
          avatar={user.avatar}
        />
      </Box>
    </Grid>
  ));

  return (
    <>
      <Box mb={4}>
        <Typography variant="h2" gutterBottom>
          Donors
        </Typography>
        <Typography variant="body1" paragraph>
          This page exists to thank the many people who have financially
          supported UltiMafia at their own expense. If you have donated to
          UltiMafia and are not listed here, please contact an admin
          immediately!
        </Typography>
        <Typography variant="body1" paragraph>
          This website is not for profit and is hosted primarily through
          donations from users. If you are able to, please consider donating on
          our{" "}
          <Link
            href="https://ko-fi.com/ultimafia"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ko-Fi
          </Link>{" "}
          in exchange for a special Donor profile badge and a spot on this page.
        </Typography>
      </Box>
      <Box mb={4}>
        <Grid container spacing={2}>
          {siteDonors}
        </Grid>
      </Box>
    </>
  );
}
