import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  TextField,
  Typography,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "axios";
import { GameContext, UserContext } from "../../Contexts";
import Setup from "../Setup";
import { getSetupBackgroundColor } from "../../pages/Play/LobbyBrowser/gameRowColors.js";
import changeling from "images/roles/cult/changeling-vivid.png";

export default function ChangeSetupDialog({
  open,
  onClose,
  gameType,
  currentSetup,
  onSetupChange,
}) {
  const user = useContext(UserContext);
  const game = useContext(GameContext);
  const [setups, setSetups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSetup, setSelectedSetup] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const numPlayers = Object.values(game.players).filter(player => !player.left).length;

  useEffect(() => {
    if (open) {
      loadSetups();
    }
  }, [open, gameType, numPlayers, page]);

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        setPage(1);
        loadSetups();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery]);

  const loadSetups = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        gameType: gameType,
        page: page.toString(),
        query: searchQuery,
        option: "popular", // Default to popular setups
        minSlots: numPlayers,
      });

      const response = await axios.get(
        `/api/setup/search?${params.toString()}`
      );
      setSetups(response.data.setups || []);
      setTotalPages(response.data.pages || 1);
      if (page > response.data.pages) {
        setPage(response.data.pages);
      }
    } catch (err) {
      setError("Failed to load setups. Please try again.");
      console.error("Error loading setups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSelect = (setup) => {
    setSelectedSetup(setup);
  };

  const handleConfirm = () => {
    if (selectedSetup) {
      onSetupChange(selectedSetup.id);
    }
  };

  const handleClose = () => {
    setSelectedSetup(null);
    setSearchQuery("");
    setPage(1);
    setError(null);
    onClose();
  };

  const canChangeSetup = () => {
    // Check if the game is in pregame state and user is host
    return true; // The actual validation is done on the backend
  };

  if (!canChangeSetup()) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "80vh",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          flexWrap: "wrap",
        }}
      >
        <img
          src={changeling}
          alt="changeling"
          width="60"
          height="60"
          style={{ flexShrink: 0 }}
        />
        <DialogTitle
          sx={{
            p: 0,
            flex: 1,
            fontSize: "1.25rem",
            lineHeight: 1.3,
            fontWeight: 600,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          Change Setup
        </DialogTitle>
      </Box>

      <DialogContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Current Setup
            </Typography>
            {currentSetup && (
              <Paper
                sx={{
                  p: 1,
                  backgroundColor: getSetupBackgroundColor({}, false),
                }}
              >
                <Setup setup={currentSetup} />
              </Paper>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Select New Setup ({gameType})
            </Typography>

            <TextField
              fullWidth
              placeholder="🔎 Setup Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{}}
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Paper
              sx={{
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : setups.length === 0 ? (
                <Box p={3} textAlign="center">
                  <Typography color="text.secondary">
                    No setups found matching your criteria.
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {setups.map((setup) => (
                    <ListItem
                      key={setup.id}
                      disablePadding
                      secondaryAction={
                        selectedSetup?.id === setup.id && (
                          <Typography variant="caption" color="primary">
                            Selected
                          </Typography>
                        )
                      }
                    >
                      <ListItemButton
                        onClick={() => handleSetupSelect(setup)}
                        selected={selectedSetup?.id === setup.id}
                        sx={{
                          "&.Mui-selected": {
                            backgroundColor: "action.selected",
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Typography variant="body1" fontWeight="medium">
                                {setup.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ({setup.total} players)
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Setup setup={setup} />
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            {totalPages > 1 && (
              <Stack
                direction="row"
                justifyContent="center"
                spacing={1}
                sx={{ mt: 2 }}
              >
                <Button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  size="small"
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ alignSelf: "center" }}>
                  Page {page} of {totalPages}
                </Typography>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  size="small"
                >
                  Next
                </Button>
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedSetup}
        >
          Change Setup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
