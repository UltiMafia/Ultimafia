import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid2,
  Stack,
  Typography,
} from "@mui/material";

import { UserContext } from "../../../Contexts";
import { useErrorAlert } from "../../../components/Alerts";
import { Loading } from "../../../components/Loading";
import { useNavigate } from "react-router-dom";
import { RoleCount } from "../../../components/Roles";

// Frontier Justice, as played in the tutorial.
const FJ_ROLES = [
  ["Cop", 1],
  ["Journalist", 1],
  ["Sheriff", 1],
  ["Villager", 3],
  ["Janitor", 1],
  ["Lawyer:Loyal", 1],
  ["Mafioso", 1],
];

// Pick a role for the guided new-user tutorial (Frontier Justice vs bots).
export default function TutorialPicker() {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const navigate = useNavigate();
  const [storylines, setStorylines] = useState(null);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    axios
      .get("/api/game/tutorial/storylines")
      .then((res) => setStorylines(res.data))
      .catch(errorAlert);
  }, []);

  function start(id) {
    setStarting(id);
    axios
      .post("/api/game/tutorial/host", { storyline: id })
      .then((res) => navigate(`/game/${res.data}`))
      .catch((e) => {
        setStarting(null);
        errorAlert(e);
      });
  }

  if (!storylines) return <Loading small />;

  return (
    <Stack spacing={2} sx={{ maxWidth: 900, mx: "auto", p: { xs: 1, sm: 2 } }}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}>📘 Tutorial</Typography>
        <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.55 }}>
          Play a guided game of <b>Frontier Justice</b> against bots: Cop,
          Journalist, Sheriff and 3 Villagers vs Janitor, Lawyer and Mafioso.
          The tutorial tells you exactly what to click at each step. It's
          private, unranked and doesn't count toward any stats. Replay it any
          time.
        </Typography>
      </Box>
      <Box data-testid="tutorial-setup">
        <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
          Frontier Justice (9 players). Tap or hover a role to read it.
        </Typography>
        <Stack
          direction="row"
          flexWrap="wrap"
          useFlexGap
          sx={{ gap: { xs: 1.5, sm: 1 }, "& > *": { minWidth: 40, minHeight: 40 } }}
        >
          {FJ_ROLES.map(([role, count]) => (
            <RoleCount key={role} role={role} count={count} gameType="Mafia" />
          ))}
        </Stack>
      </Box>
      <Typography variant="h6">Choose your role</Typography>
      <Grid2 container spacing={{ xs: 1.5, sm: 2 }}>
        {storylines.map((s) => (
          <Grid2 key={s.id} size={{ xs: 12, sm: 6 }}>
            <Card
              variant="outlined"
              data-testid={`tutorial-${s.id}`}
              sx={{ height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}
            >
              <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ flexShrink: 0, display: "flex" }}>
                    <RoleCount role={s.role} gameType="Mafia" />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ minWidth: 0, flex: 1, lineHeight: 1.25, overflowWrap: "anywhere", fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                  >
                    {s.title}
                  </Typography>
                  {!s.available && <Chip size="small" label="Coming soon" sx={{ flexShrink: 0 }} />}
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, opacity: 0.85, lineHeight: 1.5, overflowWrap: "anywhere" }}
                >
                  {s.blurb}
                </Typography>
              </CardContent>
              <CardActions sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!user.loggedIn || !s.available || Boolean(starting)}
                  onClick={() => start(s.id)}
                  sx={{ minHeight: 44, textTransform: "none", fontSize: "1rem", whiteSpace: "normal" }}
                >
                  {!s.available ? "Coming soon" : starting === s.id ? "Starting…" : `Play as ${s.title}`}
                </Button>
              </CardActions>
            </Card>
          </Grid2>
        ))}
      </Grid2>
      {!user.loggedIn && (
        <Typography variant="body2">Log in to play the tutorial.</Typography>
      )}
    </Stack>
  );
}
