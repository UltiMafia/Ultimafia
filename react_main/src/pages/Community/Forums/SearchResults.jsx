import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Pagination,
  Alert,
  Paper,
} from "@mui/material";
import axios from "axios";

import { useErrorAlert } from "../../../components/Alerts";
import { Time } from "../../../components/Basic";
import { NameWithAvatar } from "../../User/User";
import { UserContext } from "../../../Contexts";
import { NewLoading } from "../../Welcome/NewLoading";
import CustomMarkdown from "../../../components/CustomMarkdown";

export default function SearchResults(props) {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const query = searchParams.get("query") || "";
  const username = searchParams.get("username") || "";
  const boardId = searchParams.get("boardId") || "";

  useEffect(() => {
    if (query || username) {
      performSearch();
    } else {
      setLoading(false);
    }
  }, [query, username, boardId, page]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (username) params.append("username", username);
      if (boardId) params.append("boardId", boardId);
      params.append("page", page);
      params.append("limit", 10);

      const response = await axios.get(
        `/api/forums/search?${params.toString()}`
      );
      setResults(response.data);
    } catch (error) {
      errorAlert(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          style={{ backgroundColor: "#ffeb3b", padding: "0 2px" }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getContextSnippet = (content, searchTerm, maxLength = 200) => {
    if (!content) return "";

    const lowerContent = content.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const index = lowerContent.indexOf(lowerSearchTerm);

    if (index === -1) {
      return content.length > maxLength
        ? content.substring(0, maxLength) + "..."
        : content;
    }

    const start = Math.max(0, index - maxLength / 2);
    const end = Math.min(
      content.length,
      index + searchTerm.length + maxLength / 2
    );

    let snippet = content.substring(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return snippet;
  };

  if (loading) {
    return <NewLoading />;
  }

  if (!query && !username) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Please use the search dialog to search for forum content.
        </Alert>
      </Box>
    );
  }

  if (!results) {
    return null;
  }

  const { threads, replies, totalThreads, totalReplies, totalPages } = results;
  const allResults = [
    ...threads.map((thread) => ({ ...thread, type: "thread" })),
    ...replies.map((reply) => ({ ...reply, type: "reply" })),
  ].sort((a, b) => {
    // Sort by date, threads by bumpDate, replies by postDate
    const dateA = a.type === "thread" ? a.bumpDate : a.postDate;
    const dateB = b.type === "thread" ? b.bumpDate : b.postDate;
    return dateB - dateA;
  });

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          🔎
          <Typography variant="h5" component="h1">
            Search Results
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {query && (
            <Chip
              icon="🔎"
              label={`Content: "${query}"`}
              color="primary"
              variant="outlined"
            />
          )}
          {username && (
            <Chip
              label={`User: "${username}"`}
              color="secondary"
              variant="outlined"
            />
          )}
          {boardId && (
            <Chip
              label={`Board: "${
                results.threads[0]?.board?.name || "Selected Board"
              }"`}
              color="default"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          Found {totalThreads} threads and {totalReplies} replies
        </Typography>
      </Paper>

      {allResults.length === 0 ? (
        <Alert severity="info">
          No results found for your search criteria.
        </Alert>
      ) : (
        <>
          {allResults.map((result, index) => (
            <Card key={`${result.type}-${result.id}`} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Chip
                        label={result.type === "thread" ? "Thread" : "Reply"}
                        size="small"
                        color={
                          result.type === "thread" ? "primary" : "secondary"
                        }
                        variant="outlined"
                      />
                      {result.type === "thread" ? (
                        <Link
                          to={`/community/forums/thread/${result.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                              "&:hover": { color: "primary.main" },
                              fontWeight: "bold",
                            }}
                          >
                            {highlightText(result.title, query)}
                          </Typography>
                        </Link>
                      ) : (
                        <Link
                          to={`/community/forums/thread/${result.thread.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                              "&:hover": { color: "primary.main" },
                              fontWeight: "bold",
                            }}
                          >
                            Reply to:{" "}
                            {highlightText(result.thread.title, query)}
                          </Typography>
                        </Link>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="div"
                      >
                        <CustomMarkdown>
                          {highlightText(
                            getContextSnippet(result.content, query),
                            query
                          )}
                        </CustomMarkdown>
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <NameWithAvatar
                        small
                        id={result.author.id}
                        name={result.author.name}
                        vanityUrl={result.author.vanityUrl}
                        avatar={result.author.avatar}
                      />

                      <Typography variant="caption" color="text.secondary">
                        <Time
                          millisec={
                            Date.now() -
                            (result.type === "thread"
                              ? result.postDate
                              : result.postDate)
                          }
                        />
                        {" ago"}
                      </Typography>

                      {result.type === "thread" && (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            {result.replyCount} replies
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.viewCount || 0} views
                          </Typography>
                        </>
                      )}

                      <Link
                        to={`/community/forums/board/${
                          result.type === "thread"
                            ? result.board.id
                            : result.thread.board.id
                        }`}
                        style={{ textDecoration: "none" }}
                      >
                        <Chip
                          label={
                            result.type === "thread"
                              ? result.board.name
                              : result.thread.board.name
                          }
                          size="small"
                          variant="outlined"
                          sx={{
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        />
                      </Link>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
