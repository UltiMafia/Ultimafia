import React, { useState, useEffect } from "react";
import { FormControl, InputLabel, Box } from "@mui/material";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";
import axios from "axios";

import { useErrorAlert } from "../../../components/Alerts";

import detective from "images/roles/village/detective-vivid.png";
import { UiField as TextField, UiSelect as Select, UiMenuItem as MenuItem, UiText as Typography, UiAction, UiDialog, UiIcon } from "components/ui";

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
    <UiDialog
      open={open}
      onClose={handleClose}
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <img
            src={detective}
            alt="detective"
            width="60"
            height="60"
            style={{ flexShrink: 0 }}
          />
          <span>Search Forums</span>
        </span>
      }
      actions={
        <>
          <UiAction variant="ghost" onClick={handleClose}>
            Cancel
          </UiAction>
          <UiAction
            variant="primary"
            onClick={handleSearch}
            disabled={loading || (!searchQuery.trim() && !username.trim())}
          >
            <UiIcon name="search" size={18} />
            {loading ? "Searching..." : "Search"}
          </UiAction>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          fullWidth
          label="Filter by content"
          placeholder="🔎 Search thread/post content"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          helperText="Search in thread titles and post content"
        />

        <TextField
          fullWidth
          label="Filter by username"
          placeholder="Enter username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <FormControl fullWidth>
          <InputLabel>Filter by board</InputLabel>
          <Select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            label="Filter by board"
          >
            <MenuItem value="">
              <Box sx={{ fontWeight: 700, opacity: 0.7 }}>All boards</Box>
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
    </UiDialog>
  );
}
