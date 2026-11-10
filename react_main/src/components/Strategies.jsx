import React, { useContext, useEffect, useState } from "react";
import axios from "axios";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Collapse,
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
import { VoteWidget } from "components/VoteWidget";
import { NameWithAvatar, Avatar } from "pages/User/UserWidgets";
import { Loading } from "components/Loading";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { useStrategyWindows } from "components/strategyWindows/StrategyWindowsContext";
import UiAction from "./ui/UiAction";
import UiIcon from "./ui/UiIcon";
import { UiSection } from "./ui";

function sortStrategies(strategies) {
  if (!Array.isArray(strategies)) return [];

  return strategies.slice().sort((a, b) => {
    const deletedDiff = (a.deleted ? 1 : 0) - (b.deleted ? 1 : 0);
    if (deletedDiff !== 0) return deletedDiff;

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
  title = "",
  hideTitle = false,
  maxTitleLength = 80,
  maxContentLength = 4000,
}) {
  const user = useContext(UserContext);
  const theme = useTheme();
  const errorAlert = useErrorAlert();
  const strategyWindows = useStrategyWindows();
  const isPhoneDevice = useIsPhoneDevice();
  // The pop-out button only makes sense where the app shell can actually
  // host windows (Main.jsx) and where there is a mouse to drag them with.
  const canPopout =
    Boolean(strategyWindows.enabled) && !isPhoneDevice && !hideTitle;
  // On a phone a guide opens full screen (the reader below) instead of
  // expanding into the short space a row in the panel leaves.
  const readerMode = Boolean(isPhoneDevice);

  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  // A phone opens a guide full screen instead of expanding it in the list.
  const [readerId, setReaderId] = useState(null);

  const hasUser = Boolean(user && user.id);
  const allowDeleted = Boolean(user.perms?.viewDeleted);

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
          const filtered = allowDeleted
            ? data
            : data.filter((s) => {
                if (!s.deleted) return true;
                if (!hasUser) return false;
                return s.author && s.author.id === user.id;
              });
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
  }, [setupId, visible, user.loaded, user.id, allowDeleted]);

  // A guide can vanish from the list (deleted, filtered out) while it is open
  // full screen; close the reader instead of showing a stale copy.
  useEffect(() => {
    if (readerId && !strategies.some((strategy) => strategy.id === readerId)) {
      setReaderId(null);
    }
  }, [readerId, strategies]);

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

  const renderHeader = () => {
    // Inside a floating window the title bar already names the guide, so the
    // body only carries the actions.
    if (hideTitle && !canCreate) return null;

    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", width: "100%" }}
      >
        {hideTitle ? (
          <Box sx={{ flexGrow: 1 }} />
        ) : (
          <Typography sx={{ flexGrow: 1 }}>Strategies</Typography>
        )}
        {canPopout && (
          <Tooltip title="Open guides in a floating window">
            <IconButton
              size="small"
              data-testid="strategy-popout"
              aria-label="Open guides in a floating window"
              onClick={() => strategyWindows.openStrategyWindow(setupId, { title })}
            >
              <UiIcon name="external" />
            </IconButton>
          </Tooltip>
        )}
        {canCreate && (
          <IconButton size="small" onClick={openCreateDialog}>
            <UiIcon name="add" />
          </IconButton>
        )}
      </Stack>
    );
  };

  const voteAwareSetter = (updated) => {
    if (typeof updated === "function") {
      setStrategies((prev) => sortStrategies(updated(prev)));
    } else {
      setStrategies(sortStrategies(updated));
    }
  };

  const handleDeleteToggle = (strategy, shouldDelete) => {
    if (!strategy?.id) return;

    if (
      shouldDelete &&
      !window.confirm("Are you sure you wish to delete this strategy?")
    ) {
      return;
    }

    const endpoint = shouldDelete
      ? `/api/strategy/${strategy.id}/delete`
      : `/api/strategy/${strategy.id}/restore`;

    axios
      .post(endpoint)
      .then((res) => {
        const updated = res.data;
        if (!updated?.id) return;

        let removedStrategy = false;

        setStrategies((prev) => {
          const list = Array.isArray(prev) ? prev.slice() : [];
          const index = list.findIndex((item) => item.id === updated.id);
          if (index === -1) {
            if (!updated.deleted || allowDeleted || updated.canDelete) {
              list.push(updated);
            }
          } else if (
            updated.deleted &&
            !allowDeleted &&
            (!updated.author || updated.author.id !== user.id)
          ) {
            list.splice(index, 1);
            removedStrategy = true;
          } else {
            list[index] = updated;
          }
          return sortStrategies(list);
        });

        if (removedStrategy) {
          setExpandedIds((prev) => {
            if (!prev.has(updated.id)) return prev;
            const next = new Set(prev);
            next.delete(updated.id);
            return next;
          });
        }
      })
      .catch(errorAlert);
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

    const canShowEdit = Boolean(
      isExpanded && strategy.canEdit && !strategy.deleted
    );

    const canShowDelete = Boolean(isExpanded && strategy.canDelete);
    const canShowRestore = Boolean(isExpanded && strategy.canRestore);

    return (
      <Box component="section"
        key={strategy.id}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: strategy.deleted ? "action.hover" : "background.paper" }}
      >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", width: "100%", p: 1 }}
          >
            <VoteWidget
              item={strategy}
              itemHolder={strategies}
              setItemHolder={voteAwareSetter}
              itemType="strategy"
            />
            {strategy.author && (
              <Box
                sx={{ flexShrink: 0, lineHeight: 0 }}
              >
                <a
                  aria-label={`Profile: ${strategy.author.name}`}
                  href={
                    strategy.author.vanityUrl
                      ? `/${strategy.author.vanityUrl}`
                      : `/user/${strategy.author.id}`
                  }
                >
                  <Avatar
                    small
                    id={strategy.author.id}
                    name={strategy.author.name}
                    hasImage={strategy.author.avatar}
                  />
                </a>
              </Box>
            )}
            <UiAction variant="ghost" className="strategy-disclosure" data-testid="strategy-row"
              aria-expanded={isExpanded} aria-controls={`strategy-content-${strategy.id}`}
              onClick={() => setExpandedIds(previous => { const next = new Set(previous); if (next.has(strategy.id)) next.delete(strategy.id); else next.add(strategy.id); return next; })}
              style={{ flex: 1, minWidth: 0, whiteSpace: "normal", justifyContent: "space-between", textAlign: "left", padding: "8px" }}>
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
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
            <UiIcon name={isExpanded ? "up" : "down"} size={18} />
            </UiAction>
            {canShowEdit && (
              <IconButton
                size="small"
                aria-label="Edit strategy"
                onClick={(event) => {
                  event.stopPropagation();
                  openEditDialog(strategy);
                }}
              >
                <UiIcon name="edit" size={18} />
              </IconButton>
            )}
            {canShowDelete && !strategy.deleted && (
              <Tooltip title="Delete strategy">
                <IconButton
                  size="small"
                  aria-label="Delete strategy"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteToggle(strategy, true);
                  }}
                >
                  <UiIcon name="delete" size={18} />
                </IconButton>
              </Tooltip>
            )}
            {canShowRestore && (
              <Tooltip title="Restore strategy">
                <IconButton
                  size="small"
                  aria-label="Restore strategy"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteToggle(strategy, false);
                  }}
                >
                  <UiIcon name="refresh" size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        <Collapse in={isExpanded} unmountOnExit>
        <Box id={`strategy-content-${strategy.id}`} sx={{ px: 2, pb: 2 }}>
          <Stack spacing={1}>
            {readerMode && (
              <Button
                size="small"
                variant="outlined"
                aria-label="Read full screen"
                startIcon={<UiIcon name="external" />}
                onClick={() => setReaderId(strategy.id)}
                sx={{ alignSelf: "flex-start" }}
              >
                Read full screen
              </Button>
            )}
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
        </Box>
        </Collapse>
      </Box>
    );
  };

  const readerStrategy = readerId
    ? strategies.find((strategy) => strategy.id === readerId) || null
    : null;

  const header = renderHeader();
  const listContent = loading ? (
    <Loading small />
  ) : strategies.length === 0 ? (
    <Typography variant="body2" sx={{ color: "var(--um-muted)" }}>
      No strategies yet. Write one!
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

  // Full-screen reader for phones: the guide gets the whole screen and its own
  // scroll area, instead of the few centimetres a row in the panel leaves.
  const reader =
    readerStrategy ? (
      <Dialog
        open
        fullScreen={readerMode}
        onClose={() => setReaderId(null)}
        aria-labelledby="strategy-reader-title"
        PaperProps={{ "data-testid": "strategy-reader" }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            px: 1,
            py: 0.5,
            flexShrink: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <IconButton
            size="small"
            data-testid="strategy-reader-close"
            aria-label="Close full-screen guide"
            onClick={() => setReaderId(null)}
          >
            <UiIcon name="close" />
          </IconButton>
          <Typography
            variant="subtitle1"
            id="strategy-reader-title"
            data-testid="strategy-reader-title"
            sx={{ flexGrow: 1, minWidth: 0, fontWeight: 600 }}
          >
            {readerStrategy.title}
          </Typography>
          {readerStrategy.canEdit && !readerStrategy.deleted && (
            <IconButton
              size="small"
              aria-label="Edit guide"
              onClick={() => {
                const strategy = readerStrategy;
                setReaderId(null);
                openEditDialog(strategy);
              }}
            >
              <UiIcon name="edit" />
            </IconButton>
          )}
          {readerStrategy.canDelete && !readerStrategy.deleted && (
            <IconButton
              size="small"
              aria-label="Delete guide"
              onClick={() => handleDeleteToggle(readerStrategy, true)}
            >
              <UiIcon name="delete" />
            </IconButton>
          )}
        </Stack>
        <Box
          data-testid="strategy-reader-scroll"
          sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, py: 1.5 }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}
          >
            <VoteWidget
              item={readerStrategy}
              itemHolder={strategies}
              setItemHolder={voteAwareSetter}
              itemType="strategy"
            />
            {readerStrategy.author && (
              <a
                href={
                  readerStrategy.author.vanityUrl
                    ? `/${readerStrategy.author.vanityUrl}`
                    : `/user/${readerStrategy.author.id}`
                }
              >
                <NameWithAvatar
                  small
                  id={readerStrategy.author.id}
                  name={readerStrategy.author.name || " "}
                  avatar={readerStrategy.author.avatar}
                  groups={readerStrategy.author.groups}
                  vanityUrl={readerStrategy.author.vanityUrl}
                />
              </a>
            )}
          </Stack>
          <Typography
            variant="caption"
            sx={{ display: "block", opacity: 0.7, mb: 1.5 }}
          >
            {readerStrategy.createdAt != null
              ? new Date(readerStrategy.createdAt).toLocaleString()
              : null}
          </Typography>
          <Box
            className="md-content"
            sx={{
              backgroundColor: "transparent !important",
              color: `${theme.palette.text.primary} !important`,
              wordBreak: "break-word",
              fontSize: "1.05rem",
              lineHeight: 1.65,
            }}
          >
            <CustomMarkdown>{readerStrategy.content}</CustomMarkdown>
          </Box>
        </Box>
      </Dialog>
    ) : null;

  if (!visible || !setupId) {
    return null;
  }

  // "fill" covers the containers that give the list its own scroll area: the
  // floating window and the mobile game's Info tab.
  if (variant === "fill") {
    return (
      <>
        <Stack
          sx={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            flexDirection: "column",
          }}
        >
          {header && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                px: 1,
                py: 0.5,
                flexShrink: 0,
                bgcolor: "var(--scheme-color-background)",
              }}
            >
              {header}
            </Stack>
          )}
          <Box
            data-testid="strategy-list-scroll"
            sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 1, pb: 1 }}
          >
            {listContent}
          </Box>
        </Stack>
        {dialog}
        {reader}
      </>
    );
  }

  if (variant === "section") return <>
    <UiSection className="ui-card strategy-section">{header}{listContent}</UiSection>
    {dialog}{reader}
  </>;

  const sideMenu = (
    <div
      className="side-menu scrollable"
      style={variant === "section" ? { width: "100%" } : undefined}
    >
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
  );

  return (
    <>
      {sideMenu}
      {dialog}
      {reader}
    </>
  );
}

export function StrategiesPanel(props) {
  return <StrategiesBase {...props} variant="panel" />;
}

export function StrategiesSection(props) {
  return <StrategiesBase variant="section" {...props} />;
}

export const SetupStrategiesSection = StrategiesSection;
