import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { useErrorAlert } from "./Alerts";
import { UserSearchSelect } from "./Form";
import { UserContext, SiteInfoContext } from "../Contexts";
import { violationDefinitions } from "../constants/violations";

import janitor from "images/roles/mafia/janitor-vivid.png";

export default function ReportDialog({ open, onClose, prefilledArgs = {} }) {
  const [game, setGame] = useState(prefilledArgs.game || "");
  const [userReported, setUserReported] = useState(
    prefilledArgs.userId || prefilledArgs.user || ""
  );
  const [ruleBroken, setRuleBroken] = useState("");
  const [description, setDescription] = useState("");

  // Update state when prefilledArgs changes or dialog opens
  useEffect(() => {
    if (open) {
      // Support both 'userId' and 'user' for backward compatibility
      const userId = prefilledArgs.userId || prefilledArgs.user || "";
      setGame(prefilledArgs.game || "");
      setUserReported(userId);
      setRuleBroken("");
      setDescription("");
    }
  }, [open, prefilledArgs]);

  // Get display value for user (prefer userName, fall back to userId)
  const userDisplayValue =
    prefilledArgs.userName ||
    userReported ||
    prefilledArgs.userId ||
    prefilledArgs.user ||
    "";

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const handleSubmit = async () => {
    const reportedUserValue =
      userReported && typeof userReported === "object" && userReported.id
        ? userReported.id
        : userReported;

    if (!reportedUserValue || !ruleBroken) {
      siteInfo.showAlert(
        "Please choose a user to report and select the rule that was broken.",
        "error"
      );
      return;
    }

    try {
      await axios.post("/api/report/send", {
        game: game || undefined,
        user: reportedUserValue,
        rule: ruleBroken,
        description: description || undefined,
      });

      setGame("");
      setUserReported("");
      setRuleBroken("");
      setDescription("");

      siteInfo.showAlert(
        "Thank you — your report was delivered to moderators.",
        "success"
      );
      onClose();
    } catch (e) {
      if (e?.response?.data) {
        siteInfo.showAlert(e.response.data.toString(), "error");
      } else {
        errorAlert(e);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
          src={janitor}
          alt="janitor"
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
          File a Report
        </DialogTitle>
      </Box>

      <DialogContent>
        {user.loggedIn ? (
          <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <Typography variant="body2" color="textSecondary">
              Please provide as much detail as possible when reporting rule or
              policy violations.
            </Typography>

            <TextField
              label="Game"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              fullWidth
              disabled={!!prefilledArgs.game}
            />

            {prefilledArgs.userId || prefilledArgs.user ? (
              <TextField
                label="User Reported"
                value={userDisplayValue}
                disabled
                fullWidth
              />
            ) : (
              <UserSearchSelect
                onChange={(value) => setUserReported(value)}
                placeholder="User Reported"
                value={userReported}
              />
            )}

            <FormControl fullWidth>
              <InputLabel id="rule-broken-label">Rule Broken</InputLabel>
              <Select
                labelId="rule-broken-label"
                value={ruleBroken}
                label="Rule Broken"
                onChange={(e) => setRuleBroken(e.target.value)}
              >
                {violationDefinitions.map((rule) => (
                  <MenuItem key={rule.name} value={rule.name}>
                    {rule.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
          </Box>
        ) : (
          <Typography color="error">
            You must be logged in to file a report.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={!user.loggedIn}
        >
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}
