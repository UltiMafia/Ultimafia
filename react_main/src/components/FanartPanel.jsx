import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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

  return (
    <>
      <Stack direction="column" spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", width: "100%" }}
        >
          <Typography sx={{ flexGrow: 1 }}>Fanart</Typography>
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
        ) : items.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            No fanart yet. Be the first to upload!
          </Typography>
        ) : (
          <Stack direction="column" spacing={1}>
            {items.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
              >
                <Stack
                  direction="column"
                  spacing={0.5}
                  sx={{ flexGrow: 1, minWidth: 0 }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, wordBreak: "break-word" }}
                  >
                    {item.title}
                  </Typography>
                  {item.author && (
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      by {item.author.name}
                    </Typography>
                  )}
                </Stack>
                {item.imageUrl && (
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 1,
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onClick={() => setViewerUrl(item.imageUrl)}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                )}
                {(user?.perms?.deleteFanart ||
                  (item.author && item.author.id === user?.id)) && (
                  <Tooltip title="Delete fanart">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                      }}
                    >
                      <i className="fas fa-trash" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            ))}
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

