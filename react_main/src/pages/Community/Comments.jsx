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
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const imageRef = useRef(null);
  const [posting, setPosting] = useState(false);
  const postingRef = useRef(false);
  const draftGeneration = useRef(0);
  const currentLocation = useRef(locationKey);
  currentLocation.current = locationKey;
  const [loaded, setLoaded] = useState(false);
  const isMountedRef = useRef(true);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    setComments([]);
    setLoaded(false);
    setShowInput(false);
    draftGeneration.current++;
    imageRef.current = null;
    setImage(null);
    onCommentsPageNav(1);
  }, [locationKey]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

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

  function onImageSelect(file) {
    if (postingRef.current) return;
    if (imageRef.current) {
      errorAlert(new Error("Remove the current image before adding another."));
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        !file.size || file.size > 5 * 1024 * 1024) {
      errorAlert(new Error("Choose a PNG, JPEG or WebP image up to 5 MiB."));
      return;
    }
    imageRef.current = file;
    setImage(file);
  }

  function removeImage() {
    imageRef.current = null;
    setImage(null);
  }

  function onPostSubmit() {
    if (!postLocation || postingRef.current) return;
    postingRef.current = true;
    setPosting(true);
    const generation = draftGeneration.current;
    const submittedLocation = locationKey;
    let body = { content: postContent, location: postLocation };
    if (imageRef.current) {
      body = new FormData();
      body.append("content", postContent);
      body.append("location", postLocation);
      body.append("image", imageRef.current, "pasted-image");
    }
    const stillCurrent = () => isMountedRef.current &&
      generation === draftGeneration.current && currentLocation.current === submittedLocation;
    axios
      .post("/api/comment", body)
      .then(() => {
        if (stillCurrent()) {
          onCommentsPageNav(1);
          setPostContent("");
          setShowInput(false);
          removeImage();
        }
      })
      .catch((err) => {
        if (stillCurrent()) {
          errorAlert(err);
        }
      })
      .finally(() => {
        postingRef.current = false;
        if (isMountedRef.current) setPosting(false);
      });
  }

  function onPostCancel() {
    if (postingRef.current) return;
    draftGeneration.current++;
    removeImage();
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
              <TextEditor value={postContent} onChange={setPostContent} pasteImages
                readOnly={posting} onImageSelect={onImageSelect} />
              {imagePreview && (
                <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
                  <Box component="img" src={imagePreview} alt="Selected comment attachment"
                    sx={{ maxWidth: "100%", maxHeight: 240 }} />
                  <Button disabled={posting} onClick={removeImage}>Remove image</Button>
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
                  disabled={posting}
                  sx={{ flex: "1", marginLeft: "auto !important" }}
                >
                  {posting ? "Posting..." : "Post"}
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
