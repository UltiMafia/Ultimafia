import React, { useState, useContext, useEffect } from "react";
import axios from "axios";

import { useErrorAlert } from "../../components/Alerts";
import { filterProfanity } from "../../components/Basic";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { TextEditor } from "../../components/Form";
import { UserContext } from "../../Contexts";

import "css/forums.css";
import "css/comments.css";
import { NewLoading } from "../Welcome/NewLoading";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Comment } from "./Comment";

export default function Comments(props) {
  const location = props.location;

  const [page, setPage] = useState(1);
  const [comments, setComments] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    setComments([]);
    onCommentsPageNav(1);
  }, [location]);

  function onCommentsPageNav(_page) {
    var filterArg = getPageNavFilterArg(_page, page, comments, "date");

    if (filterArg == null) return;

    axios
      .get(`/api/comment?location=${location}&${filterArg}`)
      .then((res) => {
        setLoaded(true);

        if (res.data.length > 0) {
          for (let comment of res.data)
            comment.content = filterProfanity(
              comment.content,
              user.settings,
              "\\*"
            );

          setComments(res.data);
          setPage(_page);
        }
      })
      .catch(errorAlert);
  }

  function onPostSubmit() {
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
      location={location}
      comment={comment}
      comments={comments}
      setComments={setComments}
      onDelete={() => onCommentsPageNav(page)}
      onRestore={() => onCommentsPageNav(page)}
      key={comment.id}
    />
  ));

  if (!loaded) return <NewLoading small />;

  return (
    <Stack direction="column" spacing={1}>
      <div className="comments-input-wrapper">
        {!showInput && user.loggedIn && user.perms.postReply && (
          <Paper sx={{
            p: 1,
          }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowInput(true)}
              >
                Post Comment
              </Button>
              <PageNav inverted page={page} onNav={onCommentsPageNav} />
            </Stack>
          </Paper>
        )}
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
        <PageNav inverted page={page} onNav={onCommentsPageNav} />
      </Stack>
    </Stack>
  );
}
