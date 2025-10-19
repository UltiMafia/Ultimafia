import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Paper,
  Typography,
  Box,
  Stack,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  IconButton,
  Pagination,
} from "@mui/material";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { Time } from "components/Basic";

export function Poll({ lobby }) {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [polls, setPolls] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    if (lobby) {
      fetchPolls();
    }
  }, [lobby, currentPage]);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/poll/list/${lobby}?page=${currentPage}`
      );
      const { currentPoll, polls, hasMore } = response.data;

      setCurrentPoll(currentPoll);
      setPolls(polls);
      setTotalPages(currentPage + (hasMore ? 1 : 0));
    } catch (error) {
      errorAlert();
    }
    setLoading(false);
  };

  const handleVote = async (optionIndex) => {
    if (!currentPoll) return;

    try {
      await axios.post("/api/poll/vote", {
        pollId: currentPoll.id,
        optionIndex,
      });

      // Refresh the poll data
      fetchPolls();
    } catch (error) {
      errorAlert();
    }
  };

  const handleCompletePoll = async () => {
    if (!currentPoll) return;

    try {
      await axios.post("/api/poll/complete", {
        pollId: currentPoll.id,
      });

      // Refresh the poll data
      fetchPolls();
    } catch (error) {
      errorAlert();
    }
  };

  const canViewResults = () => {
    if (!currentPoll) return false;

    // Show results if:
    // 1. User has voted
    // 2. User is admin/dev
    // 3. Poll is completed
    return (
      currentPoll.userVote !== null ||
      user.perms.createPoll ||
      currentPoll.completed
    );
  };

  const canCompletePoll = () => {
    return user.perms.createPoll && currentPoll && !currentPoll.completed;
  };

  const renderVoterAvatars = (optionIndex) => {
    if (!currentPoll.voterAvatars || !currentPoll.voterAvatars[optionIndex]) {
      return null;
    }

    const voterIds = currentPoll.voterAvatars[optionIndex];
    return (
      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
        {voterIds.slice(0, 10).map((userId, index) => (
          <Avatar
            key={index}
            sx={{ width: 20, height: 20 }}
            src={`/api/user/${userId}/avatar`}
          />
        ))}
        {voterIds.length > 10 && (
          <Typography variant="caption" sx={{ alignSelf: "center" }}>
            +{voterIds.length - 10}
          </Typography>
        )}
      </Stack>
    );
  };

  const renderCurrentPoll = () => {
    if (!currentPoll) {
      return (
        <Typography variant="body2" color="text.secondary">
          No active poll for this lobby.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {currentPoll.question}
          </Typography>
        </Box>

        <Stack spacing={1}>
          {currentPoll.options.map((option, index) => {
            const voteCount = currentPoll.voteCounts
              ? currentPoll.voteCounts[index]
              : 0;
            const totalVotes = currentPoll.voteCounts
              ? currentPoll.voteCounts.reduce((a, b) => a + b, 0)
              : 0;
            const percentage =
              totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isUserVote = currentPoll.userVote === index;
            const showResults = canViewResults();

            return (
              <Box key={index}>
                <Button
                  variant={isUserVote ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => !currentPoll.completed && handleVote(index)}
                  disabled={currentPoll.completed}
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
                    {showResults && (
                      <Typography variant="caption">
                        {voteCount} ({percentage.toFixed(1)}%)
                      </Typography>
                    )}
                  </Stack>
                </Button>

                {showResults && totalVotes > 0 && (
                  <Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ mb: 0.5 }}
                    />
                    {renderVoterAvatars(index)}
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>

        {canCompletePoll() && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCompletePoll}
            sx={{ alignSelf: "flex-start" }}
          >
            Complete Poll
          </Button>
        )}

        <Typography variant="caption" color="text.secondary">
          Created <Time millisec={Date.now() - currentPoll.created} /> ago
        </Typography>
      </Stack>
    );
  };

  const renderPollHistory = () => {
    if (polls.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No poll history for this lobby.
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        {polls.map((poll) => (
          <Box
            key={poll.id}
            sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {poll.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {poll.question}
            </Typography>

            <Stack spacing={1}>
              {poll.options.map((option, index) => {
                const voteCount = poll.voteCounts ? poll.voteCounts[index] : 0;
                const totalVotes = poll.voteCounts
                  ? poll.voteCounts.reduce((a, b) => a + b, 0)
                  : 0;
                const percentage =
                  totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                return (
                  <Box key={index}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {option}
                      </Typography>
                      <Typography variant="caption">
                        {voteCount} ({percentage.toFixed(1)}%)
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                );
              })}
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              {poll.completed ? "Completed" : "Active"} •{" "}
              <Time millisec={Date.now() - poll.created} /> ago
            </Typography>
          </Box>
        ))}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              size="small"
            />
          </Box>
        )}
      </Stack>
    );
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Poll
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Poll
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Question" />
          <Tab label="Responses" />
        </Tabs>
      </Box>

      {activeTab === 0 ? renderCurrentPoll() : renderPollHistory()}
    </Paper>
  );
}
