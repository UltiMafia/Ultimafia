import React, { useState, useContext, useEffect } from "react";
import axios from "axios";

import { useErrorAlert } from "../../components/Alerts";
import { filterProfanity } from "../../components/Basic";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { TextEditor } from "../../components/Form";
import { UserContext } from "../../Contexts";

import "../../css/forums.css";
import "../../css/comments.css";
import { NewLoading } from "../Welcome/NewLoading";
import { Box, Button } from "@mui/material";
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
      .get(`/comment?location=${location}&${filterArg}`)
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
      .post("/comment", { content: postContent, location })
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

  const marginY = 0.5;
  const commentRows = (
    <Box sx={{ my: -marginY + 1, width: "100%" }}>
      {comments.map((comment) => (
        <Comment
          fullWidth={props?.fullWidth}
          location={location}
          comment={comment}
          comments={comments}
          setComments={setComments}
          onDelete={() => onCommentsPageNav(page)}
          onRestore={() => onCommentsPageNav(page)}
          key={comment.id}
          marginY={marginY}
        />
      ))}
    </Box>
  );

  if (!loaded) return <NewLoading small />;

  return (
    <div className="comments-wrapper thread-wrapper">
      <div className="comments-input-wrapper">
        {!showInput && user.loggedIn && user.perms.postReply && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
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
          </div>
        )}
        {showInput && (
          <div className="reply-form span-panel">
            <TextEditor value={postContent} onChange={setPostContent} />
            <div className="post-btn-wrapper">
              <div className="post-reply btn btn-theme" onClick={onPostSubmit}>
                Post
              </div>
              <div className="btn btn-theme-sec" onClick={onPostCancel}>
                Cancel
              </div>
            </div>
          </div>
        )}
      </div>
      <Box className="comments-page" sx={{ mt: 1 }}>
        {comments.length === 0 && "No comments yet"}
        {commentRows}
        <PageNav inverted page={page} onNav={onCommentsPageNav} />
      </Box>
    </div>
  );
}
