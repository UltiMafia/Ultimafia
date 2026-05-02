import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { UserContext } from "Contexts";
import Setup from "components/Setup";
import HostGameDialogue from "components/HostGameDialogue";
import { Loading } from "components/Loading";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";
import { PageNav } from "components/Nav";
import { Lab as LabConsts } from "constants/Lab";

const {
  rankUpPlays: RANK_UP_PLAYS,
  graduatePlays: GRADUATE_PLAYS,
  poolTenureDays: POOL_TENURE_DAYS,
  graduateRewardCoins: GRADUATE_REWARD_COINS,
  submissionMaxPlays: SUBMISSION_MAX_PLAYS,
} = LabConsts;

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

function JoinLabDialog({ open, onClose, onSubmitted }) {
  const errorAlert = useErrorAlert();
  const [setups, setSetups] = useState(undefined);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSetups(undefined);
    axios
      .get("/api/lab/eligible-setups")
      .then((res) => setSetups(res.data.setups || []))
      .catch((e) => {
        errorAlert(e);
        setSetups([]);
      });
  }, [open]);

  function onPick(setup) {
    if (submitting) return;
    setSubmitting(setup.id);
    axios
      .post("/api/lab/submit", { setupId: setup.id })
      .then(() => {
        onSubmitted();
        onClose();
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(null));
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Join The Lab</DialogTitle>
      <DialogContent dividers>
        {setups === undefined ? (
          <Loading small />
        ) : setups.length === 0 ? (
          <Typography variant="body2" sx={{ py: 2, textAlign: "center" }}>
            No eligible setups found.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Pick one of your Mafia setups with fewer than {SUBMISSION_MAX_PLAYS} clean plays.
            Submitted setups go through mod review before entering the pool.
          </Typography>
        )}
        {setups !== undefined && setups.length > 0 && (
          <List dense disablePadding>
            {setups.map((s) => (
              <ListItemButton
                key={s.id}
                disabled={!!submitting}
                onClick={() => onPick(s)}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1">{s.name}</Typography>
                      {s.ranked && <Chip size="small" label="Ranked" color="info" />}
                      {s.competitive && <Chip size="small" label="Competitive" color="secondary" />}
                    </Stack>
                  }
                  secondary={`${s.total} players · ${s.playedCount} / ${SUBMISSION_MAX_PLAYS} plays so far`}
                />
                {submitting === s.id && <i className="fas fa-spinner fa-spin" />}
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

function MySubmissionPanel({ user }) {
  const errorAlert = useErrorAlert();
  const [submission, setSubmission] = useState(undefined);
  const [joinOpen, setJoinOpen] = useState(false);

  function refresh() {
    if (!user.loggedIn) return;
    axios
      .get("/api/lab/my-submission")
      .then((res) => setSubmission(res.data.setup))
      .catch(errorAlert);
  }

  useEffect(() => {
    refresh();
  }, [user.loggedIn]);

  if (!user.loggedIn) return null;
  if (submission === undefined) return null;

  if (submission === null) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
              Your Lab submission
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have a setup in The Lab right now.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => setJoinOpen(true)}>
            Join The Lab
          </Button>
        </Stack>
        <JoinLabDialog
          open={joinOpen}
          onClose={() => setJoinOpen(false)}
          onSubmitted={refresh}
        />
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
            Setups looking for plays. Hit {RANK_UP_PLAYS} clean plays to become ranked,
            and {GRADUATE_PLAYS} to graduate (creator earns {GRADUATE_REWARD_COINS} coins).
          </Typography>
        </Box>
      </Stack>

      <Accordion sx={{ mb: 2 }} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            What is The Lab?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              The Lab exists to <b>promote setup diversity</b>. Hundreds of player-made
              setups never get the plays they need to break into the rotation, so the
              same handful of featured and ranked setups dominate. The Lab is a
              structured way to surface new setups and give them a real shot.
            </Typography>
            <Typography variant="body2">
              <b>How a setup joins:</b> the creator submits one of their Mafia setups
              (with fewer than {SUBMISSION_MAX_PLAYS} clean plays) for review. Mods
              approve or reject. Approved setups enter the pool.
            </Typography>
            <Typography variant="body2">
              <b>Daily challenges:</b> while the pool is non-empty, the Tier 2 daily
              challenge for every player becomes "Play a game on [a Lab setup]",
              replacing the usual "Win as [role]" challenge. This drives plays to setups
              in the pool.
            </Typography>
            <Typography variant="body2">
              <b>Milestones:</b> at <b>{RANK_UP_PLAYS} clean plays</b> in the pool, the
              setup is automatically marked ranked. At <b>{GRADUATE_PLAYS} clean plays</b>,
              the setup graduates from the pool and the creator earns{" "}
              <b>{GRADUATE_REWARD_COINS} coins</b>.
            </Typography>
            <Typography variant="body2">
              <b>Expiration:</b> setups have <b>{POOL_TENURE_DAYS} days</b> in the pool
              to reach graduation. Setups that don't make it expire and leave the pool.
              Each setup can only enter The Lab once.
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>

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
