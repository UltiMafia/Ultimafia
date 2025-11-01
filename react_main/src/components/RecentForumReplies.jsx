import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { Paper, Stack, Typography, Box } from "@mui/material";
import { Avatar } from "pages/User/User";
import { Time } from "components/Basic";

export function RecentForumReplies() {
  const [newestThreads, setNewestThreads] = useState([]);
  const [recentReplies, setRecentReplies] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/forums/categories");
        const categories = res.data || [];

        const threads = [];
        const replies = [];

        for (const cat of categories) {
          for (const board of cat.boards || []) {
            // Newest threads
            for (const thread of board.newestThreads || []) {
              threads.push({
                kind: "thread",
                date: thread.postDate,
                title: thread.title,
                threadId: thread.id,
                replyId: null,
                user: thread.author,
              });
            }

            // Recent replies
            for (const reply of board.recentReplies || []) {
              replies.push({
                kind: "reply",
                date: reply.postDate,
                title: reply.thread?.title,
                threadId: reply.thread?.id,
                replyId: reply.id,
                user: reply.author,
              });
            }
          }
        }

        threads.sort((a, b) => (b.date || 0) - (a.date || 0));
        replies.sort((a, b) => (b.date || 0) - (a.date || 0));
        setNewestThreads(threads.slice(0, 1));
        setRecentReplies(replies.slice(0, 5));
      } catch (e) {
        // Silently ignore; show empty state below
        setNewestThreads([]);
        setRecentReplies([]);
      }
    })();
  }, []);

  return (
    <Paper sx={{ p: 1 }}>
        <Typography color="primary" gutterBottom>
          Forum Activity
        </Typography>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        Newest Thread
      </Typography>
      {newestThreads.length === 0 ? (
        <Typography variant="body2" sx={{ mb: 1 }}>
          No recent replies.
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mb: 1 }}>
          {newestThreads.map((item) => {
            const link = `/community/forums/thread/${item.threadId}`;
            return (
              <Box
                key={`thread-${item.threadId}-${item.date}`}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Avatar
                  small
                  hasImage={item.user?.avatar}
                  id={item.user?.id}
                  name={item.user?.name}
                />
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Link to={link}>{item.title}</Link>
                  {item.date ? (
                    <Typography variant="caption" color="text.secondary">
                      <Time millisec={Date.now() - (item.date || 0)} /> ago
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        Recent Replies
      </Typography>
      {recentReplies.length === 0 ? (
        <Typography variant="body2">No recent replies.</Typography>
      ) : (
        <Stack spacing={1}>
          {recentReplies.map((item) => {
            const link = `/community/forums/thread/${item.threadId}?reply=${item.replyId}`;
            return (
              <Box
                key={`reply-${item.replyId}-${item.date}`}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Avatar
                  small
                  hasImage={item.user?.avatar}
                  id={item.user?.id}
                  name={item.user?.name}
                />
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Link to={link}>{item.title}</Link>
                  <Typography variant="caption" color="text.secondary">
                    <Time millisec={Date.now() - (item.date || 0)} /> ago
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
