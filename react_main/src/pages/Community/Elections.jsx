import React, { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Link,
  MenuItem, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { UserSearchSelect } from "components/Form";
import moveUpIcon from "components/ui/hackernoon/solid/angle-up-solid.svg";
import moveDownIcon from "components/ui/hackernoon/solid/angle-down-solid.svg";
import removeIcon from "components/ui/hackernoon/solid/times-solid.svg";
import { UserContext } from "Contexts";
import { Avatar } from "pages/User/UserWidgets";

const API = "/api/admin-elections";
const PHASE_LABELS = {
  nominations: "Nominations open",
  voting: "Voting open",
  awaitingCertification: "Awaiting certification",
  certified: "Certified",
};
const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium", timeStyle: "short", hour12: true,
});

function errorMessage(error) {
  const message = error.response?.data;
  return typeof message === "string" && message.length < 200
    ? message
    : "Could not complete the election request. Try again.";
}

function useElectionAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run(action) {
    setPending(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }
  return { pending, error, run };
}

function CallElection({ onCreated }) {
  const [open, setOpen] = useState(false);
  const { pending, error, run } = useElectionAction();

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(async () => {
      await axios.post(API, {
        title: form.get("title"),
        votingStartsAt: new Date(form.get("starts")).toISOString(),
        votingEndsAt: new Date(form.get("ends")).toISOString(),
        termDays: Number(form.get("termDays")),
      });
      setOpen(false);
      onCreated();
    });
  }

  return (
    <Box>
      <Button onClick={() => setOpen(true)} variant="contained">Call election</Button>
      <Dialog open={open} onClose={pending ? undefined : () => setOpen(false)}
        fullWidth maxWidth="xs" aria-labelledby="call-election-title">
        <Box component="form" onSubmit={submit}>
          <DialogTitle id="call-election-title">Call an admin election</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{
              pt: 1,
              "& .MuiOutlinedInput-input[type='datetime-local']": {
                backgroundColor: "transparent",
                boxSizing: "content-box",
                color: "text.primary",
                height: "1.4375em",
                paddingLeft: "14px",
                colorScheme: (theme) => theme.palette.mode,
              },
            }}>
              <DialogContentText>
                Nominations begin immediately and close when voting opens. Times use your local time zone.
              </DialogContentText>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField required label="Election title" name="title" disabled={pending}
                inputProps={{ maxLength: 100 }} />
              <TextField required label="Voting opens" name="starts" type="datetime-local"
                InputLabelProps={{ shrink: true }} disabled={pending} />
              <TextField required label="Voting closes" name="ends" type="datetime-local"
                InputLabelProps={{ shrink: true }} disabled={pending} />
              <TextField required label="Admin term (days)" name="termDays" type="number"
                inputProps={{ min: 1, max: 365, step: 1 }} disabled={pending} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending ? "Calling election…" : "Call election"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

function NomineeIdentity({ nominee, link, small }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      <Box aria-hidden="true" sx={{ display: "flex", flexShrink: 0 }}>
        <Avatar id={nominee.id} name={nominee.name} hasImage={nominee.avatar} small={small} />
      </Box>
      {link ? (
        <Link component={RouterLink} to={`/user/${nominee.id}`} sx={{ overflowWrap: "anywhere" }}>
          {nominee.name}
        </Link>
      ) : (
        <Typography component="span" sx={{ overflowWrap: "anywhere" }}>{nominee.name}</Typography>
      )}
    </Stack>
  );
}

function RankingButton({ icon, label, ...props }) {
  return (
    <Tooltip title={label} describeChild>
      <span>
        <IconButton type="button" aria-label={label} sx={{ width: 44, height: 44 }} {...props}>
          <Box aria-hidden="true" sx={{
            width: 24,
            height: 24,
            bgcolor: "currentColor",
            mask: `url("${icon}") center / contain no-repeat`,
          }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

function RankedBallot({ election, onChange }) {
  const [ranking, setRanking] = useState(election.myBallot || []);
  const { pending, error, run } = useElectionAction();
  const nominees = new Map(election.nominees.map((nominee) => [nominee.id, nominee]));
  const unranked = election.nominees.filter(({ id }) => !ranking.includes(id));
  const saved = ranking.length > 0 && ranking.join() === election.myBallot?.join();

  function move(index, offset) {
    const next = [...ranking];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setRanking(next);
  }

  function submit(event) {
    event.preventDefault();
    run(async () => {
      await axios.put(`${API}/${election.id}/ballot`, { ranking });
      onChange();
    });
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={1.5} sx={{ maxWidth: 520 }}>
      <Typography component="h3" variant="subtitle1">Your private ballot</Typography>
      <Typography variant="body2" color="text.secondary">
        Put your favorite first and rank as many nominees as you like. Linked accounts share one ballot:
        use the account you originally voted with to make changes before voting closes.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {ranking.length > 0 && (
        <Box component="ol" role="list" sx={{ m: 0, p: 0, listStyle: "none" }}>
          {ranking.map((id, index) => {
            const nominee = nominees.get(id);
            return (
              <Box component="li" key={id} sx={{ py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                    <Typography component="span" variant="body2" color="text.secondary"
                      sx={{ minWidth: "3ch", textAlign: "end", fontVariantNumeric: "tabular-nums" }}>
                      {index + 1}.
                    </Typography>
                    <NomineeIdentity nominee={nominee} />
                  </Stack>
                  <Stack direction="row" sx={{ flexShrink: 0 }}>
                    <RankingButton icon={moveUpIcon} label={`Move ${nominee.name} up`}
                      disabled={pending || index === 0} onClick={() => move(index, -1)} />
                    <RankingButton icon={moveDownIcon} label={`Move ${nominee.name} down`}
                      disabled={pending || index === ranking.length - 1} onClick={() => move(index, 1)} />
                    <RankingButton icon={removeIcon} label={`Remove ${nominee.name} from ballot`}
                      disabled={pending} onClick={() => setRanking(ranking.filter((ranked) => ranked !== id))} />
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
      {!!unranked.length && (
        <TextField select label="Add a nominee to your ranking" value="" disabled={pending}
          onChange={(event) => setRanking([...ranking, event.target.value])}>
          {unranked.map((nominee) => (
            <MenuItem key={nominee.id} value={nominee.id}><NomineeIdentity nominee={nominee} small /></MenuItem>
          ))}
        </TextField>
      )}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Button type="submit" variant="contained" disabled={!ranking.length || pending || saved}>
          {pending ? "Saving…" : "Save ballot"}
        </Button>
        {saved && <Typography role="status" variant="body2">Ballot saved.</Typography>}
      </Stack>
    </Stack>
  );
}

function NominationForm({ election, onChange }) {
  const [nominee, setNominee] = useState(null);
  const { pending, error, run } = useElectionAction();
  function submit(event) {
    event.preventDefault();
    if (!nominee) return;
    run(async () => {
      await axios.post(`${API}/${election.id}/nominate`, { userId: nominee.id });
      setNominee(null);
      onChange();
    });
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={1.5} sx={{ maxWidth: 520 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <UserSearchSelect placeholder="Find a user to nominate" value={nominee?.name ?? ""}
        onChange={(id, name) => setNominee(id ? { id, name } : null)} />
      <Box><Button type="submit" variant="contained" disabled={!nominee || pending}>
        {pending ? "Nominating…" : "Nominate"}
      </Button></Box>
    </Stack>
  );
}

function CertifyElection({ election, onChange }) {
  const [open, setOpen] = useState(false);
  const { pending, error, run } = useElectionAction();
  return (
    <Box>
      <Button variant="contained" onClick={() => setOpen(true)}>Certify result</Button>
      <Dialog open={open} onClose={pending ? undefined : () => setOpen(false)}
        aria-labelledby={`certify-${election.id}`}>
        <DialogTitle id={`certify-${election.id}`}>Certify {election.title}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This publishes the ranked-choice outcome and starts the winner’s term immediately if there is a winner.
          </DialogContentText>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={pending} onClick={() => run(async () => {
            await axios.post(`${API}/${election.id}/certify`);
            setOpen(false);
            onChange();
          })}>{pending ? "Certifying…" : "Certify result"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ElectionDetails({ election }) {
  const details = [
    { label: "Voting opens", date: election.votingStartsAt, emphasized: election.phase === "nominations" },
    { label: "Voting closes", date: election.votingEndsAt, emphasized: election.phase === "voting" },
    { label: "Admin term", text: `${election.termDays} ${election.termDays === 1 ? "day" : "days"}` },
  ];
  return (
    <Box component="dl" sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
      gap: { xs: 1.25, sm: 2 },
      m: 0,
      py: 1.5,
      borderTop: 1,
      borderBottom: 1,
      borderColor: "divider",
    }}>
      {details.map(({ label, date, text, emphasized }) => (
        <Box key={label}>
          <Typography component="dt" variant="body2" color={emphasized ? "primary.main" : "text.secondary"}>
            {label}
          </Typography>
          <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>
            {date ? <time dateTime={date}>{dateFormat.format(new Date(date))}</time> : text}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function Election({ election, canManage, canVote, reload }) {
  const { id, title, phase, nominees, outcome, termEndsAt, certifiedAt } = election;
  const winner = nominees.find((nominee) => nominee.id === election.winnerId);
  return (
    <Stack component="article" aria-labelledby={`election-${id}`} spacing={1.5}>
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography component="h2" variant="h4" id={`election-${id}`} sx={{ overflowWrap: "anywhere" }}>{title}</Typography>
        <Chip size="small" variant="outlined" color={phase === "voting" ? "primary" : "default"} label={PHASE_LABELS[phase]} />
      </Stack>
      <ElectionDetails election={election} />
      <Stack spacing={0.75}>
        <Typography component="h3" variant="subtitle1">Nominees</Typography>
        {nominees.length ? (
          <Stack component="ul" direction="row" flexWrap="wrap" gap={2} sx={{ m: 0, p: 0, listStyle: "none" }}>
            {nominees.map((nominee) => (
              <Box component="li" key={nominee.id} sx={{ minWidth: 0 }}>
                <NomineeIdentity nominee={nominee} link small />
              </Box>
            ))}
          </Stack>
        ) : <Typography variant="body2" color="text.secondary">None yet</Typography>}
      </Stack>
      {phase === "nominations" && canManage && <NominationForm election={election} onChange={reload} />}
      {phase === "voting" && nominees.length > 0 && (
        canVote ? <RankedBallot key={election.myBallot?.join() || ""} election={election} onChange={reload} />
          : <Typography variant="body2">Sign in to vote.</Typography>
      )}
      {phase === "awaitingCertification" && canManage && <CertifyElection election={election} onChange={reload} />}
      {phase === "certified" && (
        <Box>
          {winner && (
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography component="strong" sx={{ fontWeight: 600 }}>Winner:</Typography>
              <NomineeIdentity nominee={winner} link small />
            </Stack>
          )}
          {outcome === "tie" && <Typography>No winner: unresolved tie.</Typography>}
          {outcome === "noVotes" && <Typography>No winner: no ballots counted for eligible nominees.</Typography>}
          <Typography variant="body2">Certified {dateFormat.format(new Date(certifiedAt))}</Typography>
          {termEndsAt && <Typography variant="body2">Term ends {dateFormat.format(new Date(termEndsAt))}</Typography>}
        </Box>
      )}
    </Stack>
  );
}

export default function Elections() {
  const user = useContext(UserContext);
  const viewerId = user.loggedIn ? user.id : null;
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState(null);
  const [failure, setFailure] = useState(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => {
    setFailure(null);
    setRevision((previous) => previous + 1);
  }, []);
  const data = response?.viewerId === viewerId && response.page === page ? response.data : null;
  const error = failure?.viewerId === viewerId && failure.page === page ? failure.message : "";

  useEffect(() => { document.title = "Elections | UltiMafia"; }, []);

  useEffect(() => {
    const controller = new AbortController();
    axios.get(API, { params: { page }, signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setResponse({ data, page, viewerId });
      })
      .catch((err) => {
        if (!controller.signal.aborted) setFailure({ page, viewerId, message: errorMessage(err) });
      });
    return () => controller.abort();
  }, [page, revision, viewerId]);

  useEffect(() => {
    if (!data) return;
    const now = Date.now();
    const next = Math.min(...data.elections.flatMap((election) =>
      [election.votingStartsAt, election.votingEndsAt, election.termEndsAt]
        .map((date) => Date.parse(date)).filter((timestamp) => timestamp > now)
    ));
    const timer = setTimeout(reload, Math.min(60000, next - now + 250));
    return () => clearTimeout(timer);
  }, [data, reload]);

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 }, textAlign: "start" }}>
      <Box>
        <Typography component="h1" variant="h3" gutterBottom>Elections</Typography>
        <Typography sx={{ maxWidth: 700 }}>
          Elect an UltiMafia admin by ranked choice. If nobody has a majority, the lowest candidates
          are eliminated and ballots transfer to their next ranked choice. An unresolved tie elects no
          one. Individual ballots are never shown to other users or site admins.
        </Typography>
      </Box>
      {data?.canManage && <CallElection onCreated={() => { setPage(1); reload(); }} />}
      {error && <Alert severity="error" action={<Button onClick={reload}>Retry</Button>}>{error}</Alert>}
      {!data && !error && <Box><CircularProgress aria-label="Loading elections" size={24} /></Box>}
      {data && !data.elections.length && <Typography>No elections on this page.</Typography>}
      {data?.elections.map((election) => (
        <React.Fragment key={`${viewerId}:${election.id}`}>
          <Divider />
          <Election election={election} canVote={data.canVote} canManage={data.canManage} reload={reload} />
        </React.Fragment>
      ))}
      {(page > 1 || data?.hasMore) && (
        <Stack direction="row" spacing={1}>
          <Button disabled={page === 1} onClick={() => { setFailure(null); setPage(page - 1); }}>Previous</Button>
          <Button disabled={!data?.hasMore} onClick={() => { setFailure(null); setPage(page + 1); }}>Next</Button>
        </Stack>
      )}
    </Stack>
  );
}
