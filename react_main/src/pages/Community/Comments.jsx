import React, { useState, useContext, useEffect } from "react";
import axios from "axios";

import { useErrorAlert } from "../../components/Alerts";
import { filterProfanity } from "../../components/Basic";
import { PageNav } from "../../components/Nav";
import { TextEditor } from "../../components/Form";
import { UserContext } from "../../Contexts";

import "css/forums.css";
import "css/comments.css";
import { Loading } from "../../components/Loading";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Comment } from "./Comment";

export default function Comments(props) {
  const location = props.location;
  const isMulti = Array.isArray(location);
  const locationKey = isMulti ? location.join(",") : location;

  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [comments, setComments] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    setComments([]);
    setLoaded(false);
    setShowInput(false);
    onCommentsPageNav(1);
  }, [locationKey]);

  function buildQuery(_page) {
    const parts = [`page=${_page}`];
    if (isMulti) {
      parts.push(`locations=${location.map(encodeURIComponent).join(",")}`);
    } else {
      parts.push(`location=${encodeURIComponent(location)}`);
    }
    return parts.join("&");
  }

  function onCommentsPageNav(_page) {
    axios
      .get(`/api/comment?${buildQuery(_page)}`)
      .then((res) => {
        setLoaded(true);
        const data = res.data || {};
        const fetched = Array.isArray(data) ? data : data.comments || [];
        const fetchedMaxPage = Array.isArray(data)
          ? 1
          : data.maxPage || 1;

        for (let comment of fetched)
          comment.content = filterProfanity(
            comment.content,
            user.settings,
            "\\*"
          );

        setComments(fetched);
        setMaxPage(fetchedMaxPage);
        setPage(Math.min(_page, fetchedMaxPage));
      })
      .catch(errorAlert);
  }

  function onPostSubmit() {
    if (isMulti) return;
    axios
      .post("/api/comment", { content: postContent, location })
      .then(() => {
        onCommentsPageNav(1);
        setPostContent("");
        setShowInput(false);
      })
      .catch(errorAlert);
  }

  function onPostCancel() {
    setShowInput(false);
  }

  const commentRows = comments.map((comment) => (
    <Comment
      fullWidth={props?.fullWidth}
      location={comment.location || (isMulti ? undefined : location)}
      comment={comment}
      comments={comments}
      setComments={setComments}
      onDelete={() => onCommentsPageNav(page)}
      onRestore={() => onCommentsPageNav(page)}
      key={comment.id}
    />
  ));

  if (!loaded) return <Loading small />;

  const canPost =
    !isMulti && user.loggedIn && user.perms.postReply;

  const topBar = (
    <Paper sx={{ p: 1 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {canPost ? (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowInput(true)}
          >
            Post Comment
          </Button>
        ) : (
          <Box />
        )}
        <PageNav
          inverted
          page={page}
          maxPage={maxPage}
          onNav={onCommentsPageNav}
        />
      </Stack>
    </Paper>
  );

  const bottomBar = (
    <Paper sx={{ p: 1 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PageNav
          inverted
          page={page}
          maxPage={maxPage}
          onNav={onCommentsPageNav}
        />
      </Stack>
    </Paper>
  );

  return (
    <Stack direction="column" spacing={1}>
      <div className="comments-input-wrapper">
        {!showInput && topBar}
        {showInput && (
          <Paper
            sx={{
              p: 1,
              ".react-mde, .mde-header, .mde-text, .mde-preview": {
                backgroundColor: "unset !important",
                borderColor: "var(--mui-palette-divider)",
              },
              ".react-mde": {
                borderRadius: "var(--mui-shape-borderRadius)",
              },
            }}
          >
            <Stack direction="column" spacing={1} sx={{ flex: "1" }}>
              <TextEditor value={postContent} onChange={setPostContent} />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={onPostCancel}
                  sx={{ flex: "1" }}
                >
                  Cancel
                </Button>
                <div style={{ flex: "1" }} />
                <Button
                  onClick={onPostSubmit}
                  sx={{ flex: "1", marginLeft: "auto !important" }}
                >
                  Post
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </div>
      <Stack direction="column" spacing={1} className="comments-page">
        {comments.length === 0 && <Typography>No comments yet</Typography>}
        {commentRows}
        {bottomBar}
      </Stack>
    </Stack>
  );
}
