import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import Setup from "components/Setup";
import HostGameDialogue from "components/HostGameDialogue";
import { Loading } from "components/Loading";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";
import { PageNav } from "components/Nav";

const RANK_UP_PLAYS = 10;
const GRADUATE_PLAYS = 30;

function PoolEntryCard({ entry }) {
  const [hostOpen, setHostOpen] = useState(false);
  const plays = entry.labPlaysCount || 0;
  const rankedReached = plays >= RANK_UP_PLAYS;
  const daysLeft =
    entry.labExpiresAt != null
      ? Math.max(
          0,
          Math.ceil((entry.labExpiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        )
      : null;

  return (
    <Paper sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <HostGameDialogue open={hostOpen} setOpen={setHostOpen} setup={entry} />
      <Box sx={{ flexGrow: 1 }}>
        <Setup setup={entry} />
        {entry.creator && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              by
            </Typography>
            <NameWithAvatar
              id={entry.creator.id}
              name={entry.creator.name}
              avatar={entry.creator.avatar}
            />
          </Stack>
        )}
      </Box>

      <Stack spacing={0.5} sx={{ mt: 1 }}>
        <Tooltip
          title={
            rankedReached
              ? `Ranked at ${RANK_UP_PLAYS} plays — graduates at ${GRADUATE_PLAYS}`
              : `Ranks at ${RANK_UP_PLAYS} plays — graduates at ${GRADUATE_PLAYS}`
          }
        >
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (plays / GRADUATE_PLAYS) * 100)}
            color={rankedReached ? "success" : "primary"}
          />
        </Tooltip>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="caption">
            {plays} / {GRADUATE_PLAYS} plays
            {rankedReached && " — ranked ✓"}
          </Typography>
          {daysLeft != null && (
            <Typography variant="caption" color="text.secondary">
              {daysLeft}d left
            </Typography>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="contained"
          onClick={() => setHostOpen(true)}
        >
          Host
        </Button>
        <Button
          size="small"
          component={RouterLink}
          to={`/learn/setup/${entry.id}`}
        >
          Details
        </Button>
      </Stack>
    </Paper>
  );
}

function MySubmissionPanel({ user }) {
  const errorAlert = useErrorAlert();
  const [submission, setSubmission] = useState(undefined);

  useEffect(() => {
    if (!user.loggedIn) return;
    axios
      .get("/api/lab/my-submission")
      .then((res) => setSubmission(res.data.setup))
      .catch(errorAlert);
  }, [user.loggedIn]);

  if (!user.loggedIn) return null;
  if (submission === undefined) return null;

  if (submission === null) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
          Your Lab submission
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You don't have a setup in The Lab right now. Open one of your unranked setups
          and click "Submit to The Lab" to enter the pool.
        </Typography>
      </Paper>
    );
  }

  const plays = submission.labPlaysCount || 0;
  const rankedReached = plays >= RANK_UP_PLAYS;
  const daysLeft =
    submission.labExpiresAt != null
      ? Math.max(
          0,
          Math.ceil((submission.labExpiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        )
      : null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
        Your Lab submission
      </Typography>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <RouterLink to={`/learn/setup/${submission.id}`}>
            <Typography variant="body1">{submission.name}</Typography>
          </RouterLink>
          <Chip
            size="small"
            label={
              submission.labStatus === "PENDING_APPROVAL"
                ? "Pending approval"
                : "In the pool"
            }
            color={submission.labStatus === "IN_POOL" ? "info" : "warning"}
          />
        </Stack>
        {submission.labStatus === "IN_POOL" && (
          <>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (plays / GRADUATE_PLAYS) * 100)}
              color={rankedReached ? "success" : "primary"}
            />
            <Typography variant="body2">
              {plays} / {GRADUATE_PLAYS} clean plays
              {rankedReached && " — ranked ✓"}
              {daysLeft != null && ` — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
            </Typography>
          </>
        )}
      </Stack>
    </Paper>
  );
}

function FeaturedTodayBanner() {
  const errorAlert = useErrorAlert();
  const [featured, setFeatured] = useState(undefined);

  useEffect(() => {
    axios
      .get("/api/lab/featured-today")
      .then((res) => setFeatured(res.data.setup))
      .catch(errorAlert);
  }, []);

  if (!featured) return null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
        Today's featured Lab setup
      </Typography>
      <PoolEntryCard entry={featured} />
    </Paper>
  );
}

export default function Lab() {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [setups, setSetups] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "The Lab | UltiMafia";
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/lab/pool?page=${page}`)
      .then((res) => {
        setSetups(res.data.setups || []);
        setPages(res.data.pages || 1);
      })
      .catch(errorAlert)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "flex-end" }}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4">The Lab</Typography>
          <Typography variant="body2" color="text.secondary">
            New unranked setups looking for plays. Hit {RANK_UP_PLAYS} clean plays to
            become ranked, and {GRADUATE_PLAYS} to graduate (creator earns 100 coins).
          </Typography>
        </Box>
      </Stack>

      <FeaturedTodayBanner />

      <MySubmissionPanel user={user} />

      <Divider sx={{ mb: 2 }}>
        <Typography variant="overline">In The Lab</Typography>
      </Divider>

      {loading && setups.length === 0 ? (
        <Loading small />
      ) : setups.length === 0 ? (
        <Typography variant="body1" sx={{ py: 4, textAlign: "center" }}>
          No setups in The Lab right now. Submit your own from its setup page.
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {setups.map((entry) => (
              <Grid item xs={12} sm={6} md={4} key={entry.id}>
                <PoolEntryCard entry={entry} />
              </Grid>
            ))}
          </Grid>
          {pages > 1 && (
            <Box sx={{ mt: 2 }}>
              <PageNav page={page} maxPage={pages} onNav={setPage} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
