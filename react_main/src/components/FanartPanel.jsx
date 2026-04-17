import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import { useErrorAlert } from "./Alerts";
import ImageViewer from "./ImageViewer";

export default function FanartPanel({ roleId }) {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadFanart() {
      if (!roleId) {
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      axios
        .get("/api/fanart", { params: { roleId } })
        .then((res) => {
          if (!mounted) return;
          const data = Array.isArray(res.data) ? res.data : [];
          setItems(data);
        })
        .catch((err) => {
          if (!mounted) return;
          errorAlert(err);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }

    loadFanart();
    return () => {
      mounted = false;
    };
  }, [roleId]);

  useEffect(() => {
    if (items.length === 0) {
      if (activeIndex !== 0) setActiveIndex(0);
      return;
    }
    if (activeIndex >= items.length) {
      setActiveIndex(items.length - 1);
    }
  }, [items, activeIndex]);

  function onFileChange(e) {
    if (!e.target.files || !e.target.files[0]) return;
    setFile(e.target.files[0]);
  }

  function onSubmit() {
    if (!roleId || !title.trim() || !file || submitting) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append("roleId", roleId);
    formData.append("title", title.trim());
    formData.append("image", file);

    axios
      .post("/api/fanart", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        const created = res.data;
        if (!created || !created.id) return;
        setItems((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        setActiveIndex(0);
        setTitle("");
        setFile(null);
        setDialogOpen(false);
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  }

  const canCreate =
    user && user.loggedIn && user.perms && user.perms.postReply && roleId;

  function onDelete(item) {
    if (!item?.id) return;
    if (
      !window.confirm(
        "Are you sure you wish to delete this fanart? This cannot be undone."
      )
    )
      return;

    axios
      .post(`/api/fanart/${item.id}/delete`)
      .then(() => {
        setItems((prev) =>
          Array.isArray(prev) ? prev.filter((x) => x.id !== item.id) : prev
        );
      })
      .catch(errorAlert);
  }

  const totalItems = items.length;
  const safeIndex =
    totalItems > 0 ? ((activeIndex % totalItems) + totalItems) % totalItems : 0;
  const currentItem = totalItems > 0 ? items[safeIndex] : null;

  function goPrev() {
    if (totalItems <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }

  function goNext() {
    if (totalItems <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalItems);
  }

  const canDeleteCurrent =
    currentItem &&
    (user?.perms?.deleteFanart ||
      (currentItem.author && currentItem.author.id === user?.id));

  return (
    <>
      <Stack direction="column" spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", width: "100%", px: 1 }}
        >
          <Typography
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              fontSize: "1.15rem",
              letterSpacing: "0.01em",
            }}
          >
            Fanart
          </Typography>
          {canCreate && (
            <IconButton
              size="small"
              onClick={() => {
                setTitle("");
                setFile(null);
                setDialogOpen(true);
              }}
            >
              <i className="fas fa-plus" />
            </IconButton>
          )}
        </Stack>

        {loading ? (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Loading fanart...
          </Typography>
        ) : totalItems === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            No fanart yet. Be the first to upload!
          </Typography>
        ) : (
          <Stack direction="column" spacing={1} alignItems="center">
            <Box
              sx={{
                position: "relative",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {totalItems > 1 && (
                <IconButton
                  size="small"
                  onClick={goPrev}
                  aria-label="Previous fanart"
                  sx={{
                    position: "absolute",
                    left: -4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    color: "#fff",
                    width: 32,
                    height: 32,
                    transition: "background-color 120ms",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.7)",
                    },
                  }}
                >
                  <i
                    className="fas fa-chevron-left"
                    style={{ fontSize: "0.8rem" }}
                  />
                </IconButton>
              )}
              <Box
                sx={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 2,
                  overflow: "hidden",
                  cursor: currentItem?.imageUrl ? "pointer" : "default",
                  position: "relative",
                  backgroundColor: "rgba(127,127,127,0.1)",
                  transition:
                    "transform 150ms ease, box-shadow 150ms ease",
                  "&:hover": {
                    transform: currentItem?.imageUrl
                      ? "scale(1.01)"
                      : "none",
                    boxShadow: currentItem?.imageUrl
                      ? "0 6px 20px rgba(0,0,0,0.25)"
                      : "none",
                  },
                }}
                onClick={() =>
                  currentItem?.imageUrl &&
                  setViewerUrl(currentItem.imageUrl)
                }
              >
                {currentItem?.imageUrl && (
                  <img
                    src={currentItem.imageUrl}
                    alt={currentItem.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}
                {canDeleteCurrent && (
                  <Tooltip title="Delete fanart">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(currentItem);
                      }}
                      sx={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        zIndex: 2,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        width: 28,
                        height: 28,
                        transition: "background-color 120ms",
                        "&:hover": {
                          backgroundColor: "rgba(200,40,40,0.85)",
                        },
                      }}
                    >
                      <i
                        className="fas fa-trash"
                        style={{ fontSize: "0.75rem" }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {totalItems > 1 && (
                <IconButton
                  size="small"
                  onClick={goNext}
                  aria-label="Next fanart"
                  sx={{
                    position: "absolute",
                    right: -4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    color: "#fff",
                    width: 32,
                    height: 32,
                    transition: "background-color 120ms",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.7)",
                    },
                  }}
                >
                  <i
                    className="fas fa-chevron-right"
                    style={{ fontSize: "0.8rem" }}
                  />
                </IconButton>
              )}
            </Box>
            <Stack
              direction="column"
              spacing={0.25}
              alignItems="center"
              sx={{ width: "100%", px: 1 }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  textAlign: "center",
                  wordBreak: "break-word",
                  lineHeight: 1.25,
                }}
              >
                {currentItem?.title}
              </Typography>
              {currentItem?.author && (
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, textAlign: "center" }}
                >
                  by {currentItem.author.name}
                </Typography>
              )}
            </Stack>
            {totalItems > 1 && (
              <Typography
                variant="caption"
                sx={{ opacity: 0.6, letterSpacing: "0.05em" }}
              >
                {safeIndex + 1} / {totalItems}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
      {viewerUrl && (
        <ImageViewer imageUrl={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
      {canCreate && (
        <Dialog
          open={dialogOpen}
          onClose={() => {
            if (!submitting) setDialogOpen(false);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Post Fanart</DialogTitle>
          <DialogContent dividers>
            <Stack direction="column" spacing={2}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                inputProps={{ maxLength: 80 }}
                fullWidth
                autoFocus
              />
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ width: "100%" }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (!submitting) setDialogOpen(false);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={
                submitting || !title.trim() || !file || !canCreate
              }
            >
              Post Fanart
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

