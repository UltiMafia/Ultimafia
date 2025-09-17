import React, { useState, useContext } from "react";
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
} from "@mui/material";
import { useErrorAlert } from "./Alerts";
import { UserContext, SiteInfoContext } from "../Contexts";

import janitor from "images/roles/mafia/janitor-vivid.png";

export default function ReportDialog({ open, onClose }) {
  const [game, setGame] = useState("");
  const [userReported, setUserReported] = useState("");
  const [ruleBroken, setRuleBroken] = useState("");
  const [description, setDescription] = useState("");

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const handleSubmit = () => {
    axios
      .post("/api/report/send", {
        game,
        user: userReported,
        rule: ruleBroken,
        description,
      })
      .then(() => {
        setGame("");
        setUserReported("");
        setRuleBroken("");
        setDescription("");
        siteInfo.showAlert("Thank you for filing your report.", "success");
        onClose();
      })
      .catch(errorAlert);
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
              label="Game (link or ID)"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              fullWidth
            />
            <TextField
              label="User Reported"
              value={userReported}
              onChange={(e) => setUserReported(e.target.value)}
              fullWidth
            />
            <TextField
              label="Rule Broken"
              value={ruleBroken}
              onChange={(e) => setRuleBroken(e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
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
