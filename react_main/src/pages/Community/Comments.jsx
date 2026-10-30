import React, { useState, useContext, useEffect, useRef } from "react";
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
import { pastedCommentImage } from "./commentImagePaste.mjs";

export default function Comments(props) {
  const location = props.location;
  const isMulti = Array.isArray(location);
  const postLocation = isMulti ? props.postLocation : location;
  const locationKey = isMulti ? location.join(",") : location;

  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [comments, setComments] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const postingRef = useRef(false);
  const draftRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    setComments([]);
    setLoaded(false);
    setShowInput(false);
    setPostContent("");
    setImage(null);
    draftRef.current += 1;
    onCommentsPageNav(1);
  }, [locationKey, postLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        if (!isMountedRef.current) return;

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
      .catch((err) => {
        if (isMountedRef.current) {
          errorAlert(err);
        }
      });
  }

  function onImagePaste(event) {
    if (postingRef.current) return;
    try {
      const file = pastedCommentImage(event.clipboardData?.items);
      if (!file) return; // Keep ordinary text and URL paste unchanged.
      event.preventDefault();
      if (image) {
        errorAlert("Remove the attached image before pasting another.");
        return;
      }
      setImage(file);
    } catch (error) {
      event.preventDefault();
      errorAlert(error);
    }
  }

  function onPostSubmit() {
    if (!postLocation || postingRef.current) return;
    const draft = draftRef.current;
    let body = { content: postContent, location: postLocation };
    if (image) {
      body = new FormData();
      body.append("content", postContent);
      body.append("location", postLocation);
      body.append("image", image);
    }
    postingRef.current = true;
    setPosting(true);
    axios
      .post("/api/comment", body)
      .then(() => {
        if (isMountedRef.current && draft === draftRef.current) {
          onCommentsPageNav(1);
          setPostContent("");
          setImage(null);
          setShowInput(false);
        }
      })
      .catch((err) => {
        if (isMountedRef.current && draft === draftRef.current) errorAlert(err);
      })
      .finally(() => {
        postingRef.current = false;
        if (isMountedRef.current) setPosting(false);
      });
  }

  function onPostCancel() {
    if (postingRef.current) return;
    draftRef.current += 1;
    setImage(null);
    setShowInput(false);
  }

  const commentRows = comments.map((comment) => (
    <Comment
      fullWidth={props?.fullWidth}
      location={comment.location || (isMulti ? undefined : location)}
      canModerateLocation={props.canModerateLocation}
      comment={comment}
      comments={comments}
      setComments={setComments}
      onDelete={() => onCommentsPageNav(page)}
      onRestore={() => onCommentsPageNav(page)}
      key={comment.id}
    />
  ));

  if (!loaded) return <Loading small />;

  const canPost = Boolean(postLocation) && user.loggedIn && user.perms.postReply;

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
              <TextEditor
                value={postContent}
                onChange={setPostContent}
                onPaste={onImagePaste}
                readOnly={posting}
              />
              <Typography variant="caption">
                Paste one still PNG, JPEG or WebP image (up to 5 MiB).
                Images are resized to fit 1024 by 1024 pixels and added below your text.
              </Typography>
              {image && (
                <Stack spacing={1}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Attached image preview"
                    sx={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }}
                  />
                  <Button disabled={posting} onClick={() => setImage(null)}>
                    Remove image
                  </Button>
                </Stack>
              )}
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={onPostCancel}
                  disabled={posting}
                  sx={{ flex: "1" }}
                >
                  Cancel
                </Button>
                <div style={{ flex: "1" }} />
                <Button
                  onClick={onPostSubmit}
                  disabled={posting || (!postContent.length && !image)}
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
