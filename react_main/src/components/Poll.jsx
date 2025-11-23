import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Paper,
  Typography,
  Box,
  Stack,
  Button,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { getPageNavFilterArg, PageNav } from "components/Nav";
import { NameWithAvatar } from "pages/User/User";
import LobbySidebarPanel from "pages/Play/LobbyBrowser/LobbySidebarPanel";

export function Poll({ lobby, threadId, locked }) {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [activePolls, setActivePolls] = useState([]);
  const [polls, setPolls] = useState([]);
  const [allPolls, setAllPolls] = useState([]);
  const [pollPage, setPollPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const isThreadPoll = !!threadId;
  const isLobbyPoll = !!lobby;
  const isAllLobbies = lobby === "All";

  useEffect(() => {
    if (user.loggedIn) {
      if (isThreadPoll && threadId) {
        fetchThreadPoll();
      } else if (isLobbyPoll && lobby) {
        fetchPolls();
      }
    }
  }, [lobby, threadId, pollPage, user.loggedIn, locked]);

  // Reset pagination when lobby changes
  useEffect(() => {
    if (isLobbyPoll) {
      setPollPage(1);
    }
  }, [lobby]);

  const fetchThreadPoll = async () => {
    if (!user.loggedIn) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/poll/thread/${threadId}`);
      if (response.data.poll) {
        setAllPolls([response.data.poll]);
      } else {
        setAllPolls([]);
      }
    } catch (error) {
      errorAlert();
    }
    setLoading(false);
  };

  const fetchPolls = async () => {
    // Don't fetch if user is not logged in
    if (!user.loggedIn) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/poll/list/${lobby}?page=${pollPage}`
      );
      const { currentPoll, activePolls, polls } = response.data;

      setCurrentPoll(currentPoll);
      setActivePolls(activePolls || []);
      setPolls(polls);

      // Combine active polls with history for display
      let combined = [];

      if (pollPage === 1) {
        if (isAllLobbies && activePolls && activePolls.length > 0) {
          // For "All" lobby, show all active polls first
          const filteredPolls = polls.filter(
            (p) => !activePolls.some((ap) => ap.id === p.id)
          );
          combined = [...activePolls, ...filteredPolls];
        } else if (currentPoll) {
          // For specific lobby, show current poll first
          const filteredPolls = polls.filter((p) => p.id !== currentPoll.id);
          combined = [currentPoll, ...filteredPolls];
        } else {
          combined = polls;
        }
      } else {
        // Pages beyond 1 only show history
        combined = polls;
      }

      setAllPolls(combined);
    } catch (error) {
      errorAlert();
    }
    setLoading(false);
  };

  const onPollPageNav = (page) => {
    // Don't paginate if user is not logged in
    if (!user.loggedIn) {
      return;
    }

    var filterArg = getPageNavFilterArg(page, pollPage, polls, "created");

    if (filterArg == null) return;

    setLoading(true);
    axios
      .get(`/api/poll/list/${lobby}?${filterArg}`)
      .then((res) => {
        const { currentPoll, activePolls, polls } = res.data;

        if (res.data.polls.length || (activePolls && activePolls.length)) {
          setCurrentPoll(currentPoll);
          setActivePolls(activePolls || []);
          setPolls(res.data.polls);
          setPollPage(page);

          // Combine for display
          let combined = [];

          if (page === 1) {
            if (isAllLobbies && activePolls && activePolls.length > 0) {
              const filteredPolls = polls.filter(
                (p) => !activePolls.some((ap) => ap.id === p.id)
              );
              combined = [...activePolls, ...filteredPolls];
            } else if (currentPoll) {
              const filteredPolls = polls.filter(
                (p) => p.id !== currentPoll.id
              );
              combined = [currentPoll, ...filteredPolls];
            } else {
              combined = polls;
            }
          } else {
            combined = polls;
          }

          setAllPolls(combined);
        }
        setLoading(false);
      })
      .catch((error) => {
        errorAlert();
        setLoading(false);
      });
  };

  const handleVote = async (optionIndex, pollId) => {
    try {
      await axios.post("/api/poll/vote", {
        pollId: pollId,
        optionIndex,
      });

      // Refresh the poll data - use appropriate fetch function
      if (isThreadPoll) {
        fetchThreadPoll();
      } else {
        fetchPolls();
      }
    } catch (error) {
      errorAlert();
    }
  };

  const renderVoterAvatars = (optionIndex, poll) => {
    if (!poll.voterInfo || !poll.voterInfo[optionIndex]) {
      return null;
    }

    const voters = poll.voterInfo[optionIndex];
    return (
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}
      >
        {voters.map((voter, index) => (
          <Tooltip key={index} title={voter.name || "Unknown User"} arrow>
            <Box
              sx={{
                "& .user-name": { display: "none" },
                "& .name-with-avatar": { width: "auto" },
              }}
            >
              <NameWithAvatar
                id={voter.userId}
                name=" "
                avatar={true}
                small={true}
                noLink={true}
              />
            </Box>
          </Tooltip>
        ))}
      </Stack>
    );
  };

  const renderPolls = () => {
    if (allPolls.length === 0) {
      return isThreadPoll ? null : (
        <Typography variant="body2" color="text.secondary">
          No polls for this lobby.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        {!isThreadPoll && <PageNav page={pollPage} onNav={onPollPageNav} />}
        {allPolls.map((poll) => {
          const isActive = !poll.completed;
          const completedDate =
            poll.completed && poll.completedAt
              ? new Date(poll.completedAt).toLocaleDateString()
              : null;
          const expiresDate =
            poll.expiresAt && !poll.completed
              ? new Date(poll.expiresAt).toLocaleDateString()
              : null;

          return (
            <Box
              key={poll.id}
              sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
            >
              {isAllLobbies && poll.lobby && (
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ fontWeight: 700, mb: 1, display: "block" }}
                >
                  {poll.lobby}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {poll.question}
              </Typography>

              <Stack spacing={1}>
                {poll.options.map((option, index) => {
                  const voteCount = poll.voteCounts
                    ? poll.voteCounts[index]
                    : 0;
                  const totalVotes = poll.voteCounts
                    ? poll.voteCounts.reduce((a, b) => a + b, 0)
                    : 0;
                  const percentage =
                    totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                  const isUserVote = poll.userVote === index;

                  return (
                    <Box key={index}>
                      <Button
                        variant={isUserVote ? "contained" : "outlined"}
                        fullWidth
                        onClick={() =>
                          !poll.completed && handleVote(index, poll.id)
                        }
                        disabled={poll.completed}
                        sx={{
                          justifyContent: "flex-start",
                          textAlign: "left",
                          mb: 1,
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ width: "100%" }}
                        >
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {option}
                          </Typography>
                          <Typography variant="caption">
                            {voteCount} ({percentage.toFixed(1)}%)
                          </Typography>
                        </Stack>
                      </Button>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{ mt: 0.5 }}
                      />
                      {renderVoterAvatars(index, poll)}
                    </Box>
                  );
                })}
              </Stack>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                {isActive && expiresDate && `Completes on ${expiresDate}`}
                {isActive && !expiresDate && "Active indefinitely"}
                {!isActive && `Completed on ${completedDate}`}
              </Typography>
            </Box>
          );
        })}
        {!isThreadPoll && <PageNav page={pollPage} onNav={onPollPageNav} />}
      </Stack>
    );
  };

  // Don't show polls to non-logged-in users
  if (!user.loggedIn) {
    return null;
  }

  // Don't show empty thread polls
  if (isThreadPoll && allPolls.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="primary" gutterBottom>
          Poll
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <LobbySidebarPanel title="Poll">
      {renderPolls()}
    </LobbySidebarPanel>
  );
}

// Export an alias for thread polls
export function ThreadPoll({ threadId, locked }) {
  return <Poll threadId={threadId} locked={locked} />;
}
