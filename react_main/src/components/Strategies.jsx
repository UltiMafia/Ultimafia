import React, { useContext, useEffect, useState } from "react";
import axios from "axios";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { TextEditor } from "components/Form";
import CustomMarkdown from "components/CustomMarkdown";
import { VoteWidget } from "pages/Community/Forums/Forums";
import { NameWithAvatar } from "pages/User/User";
import { NewLoading } from "pages/Welcome/NewLoading";
import surprisedFace from "images/emotes/surprised.webp";
import sadFace from "images/emotes/sad.webp";

function sortStrategies(strategies) {
  if (!Array.isArray(strategies)) return [];

  return strategies.slice().sort((a, b) => {
    const voteDiff = (b.voteCount || 0) - (a.voteCount || 0);
    if (voteDiff !== 0) return voteDiff;

    const updatedDiff = (b.updatedAt || 0) - (a.updatedAt || 0);
    if (updatedDiff !== 0) return updatedDiff;

    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function StrategiesBase({
  setupId,
  variant = "panel",
  visible = true,
  maxTitleLength = 80,
  maxContentLength = 4000,
}) {
  const user = useContext(UserContext);
  const theme = useTheme();
  const errorAlert = useErrorAlert();

  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const canCreate = Boolean(
    visible && setupId && user.loggedIn && user.perms.postReply
  );

  useEffect(() => {
    let mounted = true;

    async function fetchStrategies() {
      if (!setupId || !visible || !user.loaded) {
        if (mounted) {
          setStrategies([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      axios
        .get("/api/strategy", { params: { setupId } })
        .then((res) => {
          if (!mounted) return;
          const data = Array.isArray(res.data) ? res.data : [];
          const allowDeleted = Boolean(user.perms.viewDeleted);
          const filtered = allowDeleted ? data : data.filter((s) => !s.deleted);
          setStrategies(sortStrategies(filtered));
        })
        .catch((err) => {
          if (!mounted) return;
          errorAlert(err);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }

    fetchStrategies();

    return () => {
      mounted = false;
    };
  }, [setupId, visible, user.loaded, user.perms?.viewDeleted]);

  const handleDialogClose = () => {
    if (submitting) return;
    setDialogOpen(false);
    setEditingStrategy(null);
    setTitleInput("");
    setContentInput("");
  };

  const openCreateDialog = () => {
    setEditingStrategy(null);
    setTitleInput("");
    setContentInput("");
    setDialogOpen(true);
  };

  const openEditDialog = (strategy) => {
    setEditingStrategy(strategy);
    setTitleInput(strategy.title || "");
    setContentInput(strategy.content || "");
    setDialogOpen(true);
  };

  const onDialogSubmit = () => {
    if (!setupId) return;
    if (submitting) return;

    const trimmedTitle = titleInput.trim();
    const trimmedContentLength = contentInput.trim().length;

    if (
      trimmedTitle.length === 0 ||
      trimmedContentLength === 0 ||
      trimmedTitle.length > maxTitleLength ||
      contentInput.length > maxContentLength
    )
      return;

    setSubmitting(true);

    const payload = {
      setupId,
      title: titleInput,
      content: contentInput,
    };

    const request = editingStrategy
      ? axios.put(`/api/strategy/${editingStrategy.id}`, payload)
      : axios.post("/api/strategy", payload);

    request
      .then((res) => {
        const strategy = res.data;
        if (!strategy) return;

        setStrategies((prev) => {
          if (!Array.isArray(prev)) return [strategy];

          if (editingStrategy) {
            const updated = prev.map((item) =>
              item.id === strategy.id ? strategy : item
            );
            return sortStrategies(updated);
          }

          return sortStrategies(prev.concat(strategy));
        });

        handleDialogClose();
      })
      .catch(errorAlert)
      .finally(() => setSubmitting(false));
  };

  const renderHeader = () => (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: "center", width: "100%" }}
    >
      <Typography sx={{ flexGrow: 1 }}>Strategies</Typography>
      {canCreate && (
        <IconButton size="small" onClick={openCreateDialog}>
          <i className="fas fa-plus" />
        </IconButton>
      )}
    </Stack>
  );

  const voteAwareSetter = (updated) => {
    if (typeof updated === "function") {
      setStrategies((prev) => sortStrategies(updated(prev)));
    } else {
      setStrategies(sortStrategies(updated));
    }
  };

  const renderStrategy = (strategy) => {
    const createdLabel =
      strategy.createdAt != null
        ? new Date(strategy.createdAt).toLocaleString()
        : null;
    const updatedLabel =
      strategy.updatedAt != null &&
      strategy.createdAt != null &&
      strategy.updatedAt - strategy.createdAt > 60000
        ? new Date(strategy.updatedAt).toLocaleString()
        : null;

    const isExpanded = expandedIds.has(strategy.id);

    return (
      <Accordion
        key={strategy.id}
        disableGutters
        expanded={isExpanded}
        onChange={() => {
          setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(strategy.id)) next.delete(strategy.id);
            else next.add(strategy.id);
            return next;
          });
        }}
      >
        <AccordionSummary
          expandIcon={
            <img
              src={isExpanded ? surprisedFace : sadFace}
              alt={isExpanded ? "Collapse" : "Expand"}
              width={24}
              height={24}
            />
          }
          sx={{
            "& .MuiAccordionSummary-content": {
              alignItems: "center",
              gap: 1,
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", width: "100%" }}
          >
            <VoteWidget
              item={strategy}
              itemHolder={strategies}
              setItemHolder={voteAwareSetter}
              itemType="strategy"
            />
            {strategy.author && (
              <Box
                sx={{
                  "& .user-name": { display: "none" },
                  "& .name-with-avatar": { width: "auto" },
                }}
              >
                <a
                  href={
                    strategy.author.vanityUrl
                      ? `/${strategy.author.vanityUrl}`
                      : `/user/${strategy.author.id}`
                  }
                >
                  <NameWithAvatar
                    small
                    id={strategy.author.id}
                    name=" "
                    avatar={strategy.author.avatar}
                    groups={strategy.author.groups}
                    vanityUrl={strategy.author.vanityUrl}
                  />
                </a>
              </Box>
            )}
            <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, wordBreak: "break-word" }}
              >
                {strategy.title}
              </Typography>
              {createdLabel && (
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {createdLabel}
                </Typography>
              )}
            </Stack>
            {strategy.canEdit && (
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  openEditDialog(strategy);
                }}
              >
                <i className="fas fa-edit" />
              </IconButton>
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <Box
              className="md-content"
              sx={{
                backgroundColor: "transparent !important",
                color: `${theme.palette.text.primary} !important`,
                wordBreak: "break-word",
              }}
            >
              <CustomMarkdown>{strategy.content}</CustomMarkdown>
            </Box>
            {updatedLabel && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Updated {updatedLabel}
              </Typography>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  };

  const header = renderHeader();
  const listContent = loading ? (
    <NewLoading small />
  ) : strategies.length === 0 ? (
    <Typography variant="body2" sx={{ opacity: 0.7 }}>
      No strategies yet.
    </Typography>
  ) : (
    <Stack direction="column" spacing={1}>
      {strategies.map((strategy) => renderStrategy(strategy))}
    </Stack>
  );

  const dialog = (
    <Dialog
      open={dialogOpen}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {editingStrategy ? "Edit Strategy" : "New Strategy"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Title"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            inputProps={{ maxLength: maxTitleLength }}
            autoFocus
            fullWidth
          />
          <Typography variant="caption" sx={{ alignSelf: "flex-end" }}>
            {titleInput.length}/{maxTitleLength}
          </Typography>
          <TextEditor value={contentInput} onChange={setContentInput} />
          <Typography variant="caption" sx={{ alignSelf: "flex-end" }}>
            {contentInput.length}/{maxContentLength}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={onDialogSubmit}
          disabled={
            submitting ||
            titleInput.trim().length === 0 ||
            contentInput.trim().length === 0 ||
            titleInput.length > maxTitleLength ||
            contentInput.length > maxContentLength
          }
        >
          {editingStrategy ? "Save" : "Post"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!visible || !setupId) {
    return null;
  }

  if (variant === "panel") {
    return (
      <>
        <div className="side-menu scrollable">
          <Stack
            direction="row"
            spacing={1}
            className="title-box"
            sx={{
              alignItems: "center",
              p: 1,
              bgcolor: "var(--scheme-color-background)",
            }}
          >
            {header}
          </Stack>
          <div className="side-menu-content">{listContent}</div>
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <Stack spacing={1} sx={{ width: "100%" }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h5">Strategies</Typography>
          {canCreate && (
            <Button variant="outlined" size="small" onClick={openCreateDialog}>
              <i className="fas fa-plus" style={{ marginRight: 8 }} />
              Add Strategy
            </Button>
          )}
        </Stack>
        {listContent}
      </Stack>
      {dialog}
    </>
  );
}

export function StrategiesPanel(props) {
  return <StrategiesBase {...props} variant="panel" />;
}

export function StrategiesSection(props) {
  return <StrategiesBase {...props} variant="section" />;
}

export const SetupStrategiesSection = StrategiesSection;
