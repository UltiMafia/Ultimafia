import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/styles";
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";

import { NameWithAvatar } from "../../User/User";
import { Time } from "../../../components/Basic";
import { useErrorAlert } from "../../../components/Alerts";
import { ViewsAndReplies } from "./Forums";

export default function Categories(props) {
  const [categoryInfo, setCategoryInfo] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  useEffect(() => {
    document.title = "Categories | UltiMafia";
    props.updateForumNavInfo({ action: "home" });

    axios
      .get("/forums/categories")
      .then((res) => {
        var categories = res.data.sort(sortItems);

        for (let category of categories)
          category.boards = category.boards.sort(sortItems);

        setCategoryInfo(categories);
        setLoaded(true);

        props.updateForumNavInfo({
          type: "home",
        });
      })
      .catch(errorAlert);
  }, []);

  function sortItems(a, b) {
    return a.position - b.position;
  }

  const categories = categoryInfo.map((category) => {
    const boards = category.boards.map((board) => {
      const newestThreads = board.newestThreads.map((thread) => (
        <Box key={thread.id} display="flex" alignItems="center" mb={1}>
          <Link to={`/community/forums/thread/${thread.id}`} style={{ marginRight: theme.spacing(1) }}>
            {thread.title}
          </Link>
          <NameWithAvatar
            small
            id={thread.author.id}
            name={thread.author.name}
            avatar={thread.author.avatar}
          />
          <Box ml={1}>
            <ViewsAndReplies
              viewCount={thread.viewCount || 0}
              replyCount={thread.replyCount || 0}
            />
          </Box>
        </Box>
      ));

      const recentReplies = board.recentReplies.map((reply) => (
        <Box key={reply.id} display="flex" alignItems="center" mb={1}>
          <Link to={`/community/forums/thread/${reply.thread.id}?reply=${reply.id}`} style={{ marginRight: theme.spacing(1) }}>
            {reply.thread.title}
          </Link>
          <NameWithAvatar
            small
            id={reply.author.id}
            name={reply.author.name}
            avatar={reply.author.avatar}
          />
          <Box ml={1}>
            <Time millisec={Date.now() - reply.postDate} />
            {` ago`}
          </Box>
        </Box>
      ));

      return (
        <Paper key={board.id} style={{ padding: theme.spacing(2), marginBottom: theme.spacing(2) }}>
          <Box display="flex" alignItems="center" mb={2}>
            <i className={`fas fa-${board.icon || "comments"} board-icon`} style={{ marginRight: theme.spacing(1) }} />
            <Link to={`/community/forums/board/${board.id}`}>
              <Typography variant="h6">{board.name}</Typography>
              <Typography variant="body2">{board.description}</Typography>
            </Link>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Newest Thread</Typography>
              {newestThreads.length === 0 ? (
                <Typography>No threads yet</Typography>
              ) : (
                newestThreads
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Recent Replies</Typography>
              {recentReplies.length === 0 ? (
                <Typography>No replies yet</Typography>
              ) : (
                recentReplies
              )}
            </Grid>
          </Grid>
        </Paper>
      );
    });

    return (
      <Box key={category.id} mb={4}>
        <Typography variant="h5" gutterBottom>
          {category.name}
        </Typography>
        <Divider />
        {boards}
      </Box>
    );
  });

  if (!loaded) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" style={{ marginTop: theme.spacing(4) }}>
      {categories}
    </Container>
  );
}
