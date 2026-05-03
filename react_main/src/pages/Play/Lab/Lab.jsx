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
  Link,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { SiteInfoContext, UserContext } from "Contexts";
import Setup from "components/Setup";
import HostGameDialogue from "components/HostGameDialogue";
import { Loading } from "components/Loading";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";
import { PageNav } from "components/Nav";

function useLabConsts() {
  const siteInfo = useContext(SiteInfoContext);
  return siteInfo.lab;
}

function PoolEntryCard({ entry }) {
  const { rankUpPlays: RANK_UP_PLAYS, graduatePlays: GRADUATE_PLAYS } =
    useLabConsts();
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
  const { submissionMaxPlays: SUBMISSION_MAX_PLAYS } = useLabConsts();
  const [setups, setSetups] = useState(undefined);
  const [submitting, setSubmitting] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setSetups(undefined);
    setQuery("");
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

  const filteredSetups =
    setups && query
      ? setups.filter((s) =>
          (s.name || "").toLowerCase().includes(query.toLowerCase())
        )
      : setups;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Join The Lab</DialogTitle>
      <DialogContent dividers>
        {setups === undefined ? (
          <Loading small />
        ) : setups.length === 0 ? (
          <Typography variant="body2" sx={{ py: 2, textAlign: "center" }}>
            No eligible setups found.{" "}
            <Link
              component={RouterLink}
              to="/play/create?game=Mafia"
              onClick={onClose}
            >
              Create one now!
            </Link>
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Pick one of your Mafia setups with fewer than {SUBMISSION_MAX_PLAYS} clean plays.
              Submitted setups go through mod review before entering the pool.
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by setup name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ mb: 1 }}
            />
            {filteredSetups.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                No setups match "{query}".
              </Typography>
            ) : (
              <Stack spacing={1}>
                {filteredSetups.map((s) => (
                  <Paper
                    key={s.id}
                    variant="outlined"
                    sx={{ p: 1 }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
                        <Setup setup={s} />
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!!submitting}
                        onClick={() => onPick(s)}
                        sx={{ flex: "0 0 auto" }}
                      >
                        {submitting === s.id ? (
                          <i className="fas fa-spinner fa-spin" />
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

const STATUS_META = {
  PENDING_APPROVAL: { label: "Pending approval", color: "warning" },
  IN_POOL: { label: "In the pool", color: "info" },
  GRADUATED: { label: "Graduated", color: "success" },
  DISQUALIFIED: { label: "Disqualified", color: "error" },
  EXPIRED: { label: "Expired", color: "default" },
};

function CurrentSubmissionRow({ submission }) {
  const { rankUpPlays: RANK_UP_PLAYS, graduatePlays: GRADUATE_PLAYS } =
    useLabConsts();
  const plays = submission.labPlaysCount || 0;
  const rankedReached = plays >= RANK_UP_PLAYS;
  const daysLeft =
    submission.labExpiresAt != null
      ? Math.max(
          0,
          Math.ceil((submission.labExpiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        )
      : null;
  const meta = STATUS_META[submission.labStatus];

  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
            <Setup setup={submission} />
          </Box>
          {meta && <Chip size="small" label={meta.label} color={meta.color} />}
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

function PastSubmissionsSection({ past }) {
  const [filter, setFilter] = useState("ALL");
  const counts = past.reduce((acc, s) => {
    acc[s.labStatus] = (acc[s.labStatus] || 0) + 1;
    return acc;
  }, {});
  const filtered =
    filter === "ALL" ? past : past.filter((s) => s.labStatus === filter);

  if (past.length === 0) return null;

  const statusOrder = ["GRADUATED", "DISQUALIFIED", "EXPIRED"];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Your past Lab setups
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: "wrap" }} useFlexGap>
        <Chip
          size="small"
          label={`All (${past.length})`}
          color={filter === "ALL" ? "primary" : "default"}
          onClick={() => setFilter("ALL")}
          variant={filter === "ALL" ? "filled" : "outlined"}
        />
        {statusOrder.map((status) =>
          counts[status] ? (
            <Chip
              key={status}
              size="small"
              label={`${STATUS_META[status].label} (${counts[status]})`}
              color={filter === status ? STATUS_META[status].color : "default"}
              onClick={() => setFilter(status)}
              variant={filter === status ? "filled" : "outlined"}
            />
          ) : null
        )}
      </Stack>
      {filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          No setups in this category.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {filtered.map((s) => {
            const meta = STATUS_META[s.labStatus];
            return (
              <Paper key={s.id} variant="outlined" sx={{ p: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
                    <Setup setup={s} />
                  </Box>
                  {meta && (
                    <Chip size="small" label={meta.label} color={meta.color} />
                  )}
                </Stack>
                {s.labStatus === "DISQUALIFIED" && s.labRejectionReason && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Reason: {s.labRejectionReason}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function MySubmissionPanel({ user }) {
  const errorAlert = useErrorAlert();
  const [submission, setSubmission] = useState(undefined);
  const [past, setPast] = useState([]);
  const [joinOpen, setJoinOpen] = useState(false);

  function refresh() {
    if (!user.loggedIn) return;
    axios
      .get("/api/lab/my-submission")
      .then((res) => {
        setSubmission(res.data.setup);
        setPast(res.data.past || []);
      })
      .catch(errorAlert);
  }

  useEffect(() => {
    refresh();
  }, [user.loggedIn]);

  if (!user.loggedIn) return null;
  if (submission === undefined) return null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: submission ? 1 : 0 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Your Lab submission
        </Typography>
        {!submission && (
          <Button variant="contained" onClick={() => setJoinOpen(true)}>
            Join The Lab
          </Button>
        )}
      </Stack>

      {submission ? (
        <CurrentSubmissionRow submission={submission} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          You don't have a setup in The Lab right now.
        </Typography>
      )}

      <PastSubmissionsSection past={past} />

      <JoinLabDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onSubmitted={refresh}
      />
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
  const {
    rankUpPlays: RANK_UP_PLAYS,
    graduatePlays: GRADUATE_PLAYS,
    poolTenureDays: POOL_TENURE_DAYS,
    graduateRewardCoins: GRADUATE_REWARD_COINS,
    submissionMaxPlays: SUBMISSION_MAX_PLAYS,
  } = useLabConsts();
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
        {user?.perms?.manageLab && (
          <Button
            variant="outlined"
            color="secondary"
            component={RouterLink}
            to="/policy/moderation/lab-queue"
          >
            Approve Lab setups
          </Button>
        )}
      </Stack>

      <Accordion sx={{ mb: 2 }} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            What is The Lab?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 1 }}>
            The Lab promotes <b>setup diversity</b> by surfacing new player-made
            setups and giving them a real shot at plays.
          </Typography>
          <Box
            component="ul"
            sx={{ pl: 3, m: 0, "& li": { mb: 0.5 } }}
          >
            <Typography component="li" variant="body2">
              <b>Join:</b> Submit new Mafia setups
            </Typography>
            <Typography component="li" variant="body2">
              <b>Promotion:</b> Your setups get featured in daily challenges
            </Typography>
            <Typography component="li" variant="body2">
              <b>Milestones:</b> Your setups get ranked-approved after{" "}
              {RANK_UP_PLAYS} plays and graduate with{" "}
              {GRADUATE_REWARD_COINS} coins at {GRADUATE_PLAYS} plays
            </Typography>
            <Typography component="li" variant="body2">
              <b>Disqualification:</b> Setups can only be in the lab for{" "}
              {POOL_TENURE_DAYS} days
            </Typography>
          </Box>
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
