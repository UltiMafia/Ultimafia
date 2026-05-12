import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useErrorAlert } from "components/Alerts";
import { UserContext, SiteInfoContext } from "Contexts";

const TYPE_OPTIONS = [
  { value: "bug", label: "Bug Report" },
  { value: "suggestion", label: "Suggestion" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "mafia", label: "Mafia" },
  { value: "minigames", label: "Minigames" },
  { value: "competitive", label: "Competitive" },
  { value: "forum", label: "Forum" },
  { value: "moderation", label: "Moderation" },
  { value: "other", label: "Other" },
];

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 5000;

export default function Feedback() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("bug");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Feedback | UltiMafia";
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      siteInfo.showAlert("Please provide a title for your feedback.", "error");
      return;
    }
    if (!description.trim()) {
      siteInfo.showAlert("Please describe your feedback.", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post("/api/feedback/submit", {
        title: title.trim(),
        type,
        category,
        description: description.trim(),
      });

      siteInfo.showAlert(
        res?.data?.toString() || "Your feedback has been submitted.",
        "success"
      );
      setTitle("");
      setType("bug");
      setCategory("general");
      setDescription("");
    } catch (e) {
      if (e?.response?.data) {
        siteInfo.showAlert(e.response.data.toString(), "error");
      } else {
        errorAlert(e);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = !user.loggedIn || submitting;

  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Typography variant="h3" gutterBottom>
        Feedback
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Found a bug or have an idea to improve UltiMafia? Submit it here and
        we'll open a tracked issue on our GitHub for the team to triage.
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 560 }}>
        <Stack spacing={2}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            disabled={disabled}
            inputProps={{ maxLength: MAX_TITLE_LENGTH }}
            helperText={`${title.length}/${MAX_TITLE_LENGTH} characters`}
            placeholder="Brief summary of your feedback"
          />
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="feedback-type-label">Feedback Type</InputLabel>
            <Select
              labelId="feedback-type-label"
              label="Feedback Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="feedback-category-label">Category</InputLabel>
            <Select
              labelId="feedback-category-label"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Describe your feedback"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={6}
            placeholder="Include steps to reproduce, screenshots, or any other context that might help..."
            disabled={disabled}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            helperText={`${description.length}/${MAX_DESCRIPTION_LENGTH} characters`}
          />
          {user.loggedIn ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !description.trim()}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          ) : (
            <Typography color="text.secondary">
              You must be logged in to submit feedback.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
