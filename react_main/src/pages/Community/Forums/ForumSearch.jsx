import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { useErrorAlert } from "../../../components/Alerts";

import detective from "images/roles/village/detective-vivid.png";

export default function ForumSearch({ open, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const errorAlert = useErrorAlert();

  useEffect(() => {
    if (open) {
      loadBoards();
    }
  }, [open]);

  const loadBoards = async () => {
    try {
      const response = await axios.get("/api/forums/search/boards");
      // Ensure response.data is an array
      setBoards(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      errorAlert(error);
      // Set empty array on error to prevent map error
      setBoards([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !username.trim()) {
      errorAlert("Please enter at least a search term or username");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (username.trim()) params.append("username", username.trim());
      if (selectedBoard) params.append("boardId", selectedBoard);

      // Navigate to search results page with query parameters
      navigate(`/community/forums/search?${params.toString()}`);
      onClose();
    } catch (error) {
      errorAlert(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setUsername("");
    setSelectedBoard("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
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
          src={detective}
          alt="detective"
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
          Search Forums
        </DialogTitle>
      </Box>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            fullWidth
            label="Search for content"
            placeholder="Enter keywords to search in posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">🔎</InputAdornment>
              ),
            }}
            helperText="Search in thread titles and post content"
          />

          <TextField
            fullWidth
            label="Filter by username"
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            helperText="Find posts by a specific user"
          />

          <FormControl fullWidth>
            <InputLabel>Filter by board</InputLabel>
            <Select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              label="Filter by board"
            >
              <MenuItem value="">
                <em>All boards</em>
              </MenuItem>
              {Array.isArray(boards) &&
                boards.map((board) => (
                  <MenuItem key={board.id} value={board.id}>
                    {board.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSearch}
          variant="contained"
          disabled={loading || (!searchQuery.trim() && !username.trim())}
          startIcon="🔎"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
